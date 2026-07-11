import { prisma } from '../../config/database.js'
import { logger } from '../../lib/logger.js'
import { broadcastToOrg } from '../../routes/websocket.js'
import { enqueueAttackChainAnalysis, enqueuePoCGeneration } from '../queue/index.js'
import type { ScanContext, ScanModule, Finding } from './types.js'
import { HeaderScanner } from './modules/headers.js'
import { InjectionScanner } from './modules/injection.js'
import { WebAppScanner } from './modules/web-app.js'
import { ApiScanner } from './modules/api.js'
import { AuthScanner } from './modules/auth.js'

/**
 * Returns the scan modules to run based on the scan type
 */
function getModulesForType(scanType: string): ScanModule[] {
  switch (scanType) {
    case 'OWASP_TOP_10':
      return [HeaderScanner, InjectionScanner, AuthScanner, WebAppScanner, ApiScanner]
    case 'API_SECURITY':
      return [ApiScanner, AuthScanner, HeaderScanner]
    case 'FULL':
    default:
      return [HeaderScanner, WebAppScanner, AuthScanner, ApiScanner, InjectionScanner]
  }
}

/**
 * Main scan execution engine.
 * Runs all configured modules against the target and reports findings.
 */
export async function executeScan(scanId: string): Promise<void> {
  // Load scan details
  const scan = await prisma.scan.findUnique({
    where: { id: scanId },
    include: { target: true },
  })

  if (!scan) {
    logger.error({ scanId }, 'Scan not found')
    return
  }

  if (scan.status === 'CANCELLED') {
    logger.info({ scanId }, 'Scan was cancelled, skipping execution')
    return
  }

  const ctx: ScanContext = {
    scanId: scan.id,
    orgId: scan.orgId,
    targetId: scan.targetId,
    targetValue: scan.target.value,
    targetType: scan.target.type,
    config: (scan.config as Record<string, unknown>) ?? {},
  }

  const modules = getModulesForType(scan.scanType)
  const findings: Finding[] = []

  logger.info({
    scanId,
    target: ctx.targetValue,
    scanType: scan.scanType,
    moduleCount: modules.length,
  }, 'Starting scan execution')

  // Mark as running
  await prisma.scan.update({
    where: { id: scanId },
    data: { status: 'RUNNING', startedAt: new Date() },
  })

  broadcastToOrg(ctx.orgId, {
    type: 'scan.started',
    data: { scanId, target: ctx.targetValue, modules: modules.map((m) => m.name) },
  })

  // Execute each module
  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i]

    // Check if scan was cancelled mid-execution
    const currentScan = await prisma.scan.findUnique({ where: { id: scanId }, select: { status: true } })
    if (currentScan?.status === 'CANCELLED' || currentScan?.status === 'PAUSED') {
      logger.info({ scanId, status: currentScan.status }, 'Scan interrupted, stopping')
      return
    }

    const progress = Math.round(((i + 1) / modules.length) * 100)

    logger.info({ scanId, module: mod.name, progress }, `Running module: ${mod.name}`)

    // Update progress
    await prisma.scan.update({
      where: { id: scanId },
      data: { progress },
    })

    broadcastToOrg(ctx.orgId, {
      type: 'scan.progress',
      data: { scanId, progress, currentModule: mod.name },
    })

    try {
      await mod.run(ctx, (finding: Finding) => {
        findings.push(finding)
        logger.info({
          scanId,
          module: mod.name,
          title: finding.title,
          severity: finding.severity,
        }, 'Finding discovered')

        // Real-time broadcast per finding
        broadcastToOrg(ctx.orgId, {
          type: 'scan.finding',
          data: {
            scanId,
            title: finding.title,
            severity: finding.severity,
            category: finding.category,
            endpoint: finding.endpoint,
          },
        })
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      logger.error({ scanId, module: mod.name, error: msg }, 'Module execution failed')
      // Continue with other modules even if one fails
    }
  }

  // Store all findings in the database
  const createdVulns = []
  for (const finding of findings) {
    try {
      const vuln = await prisma.vulnerability.create({
        data: {
          orgId: ctx.orgId,
          targetId: ctx.targetId,
          scanId: scanId,
          title: finding.title,
          description: finding.description,
          severity: finding.severity,
          cvss: finding.cvss,
          status: 'OPEN',
          category: finding.category,
          cwe: finding.cwe,
          owasp: finding.owasp,
          endpoint: finding.endpoint,
          evidence: (finding.evidence ?? undefined) as any,
          poc: finding.poc,
          verifiedAt: finding.poc ? new Date() : null,
        },
      })
      createdVulns.push(vuln)
    } catch (error) {
      // Skip duplicate findings (unique constraint)
      const msg = error instanceof Error ? error.message : ''
      if (!msg.includes('Unique constraint')) {
        logger.error({ error: msg, title: finding.title }, 'Failed to store finding')
      }
    }
  }

  // Mark scan as completed
  await prisma.scan.update({
    where: { id: scanId },
    data: {
      status: 'COMPLETED',
      progress: 100,
      findingsCount: createdVulns.length,
      completedAt: new Date(),
    },
  })

  // Create notification
  const criticalCount = findings.filter((f) => f.severity === 'CRITICAL').length
  const highCount = findings.filter((f) => f.severity === 'HIGH').length

  await prisma.notification.create({
    data: {
      orgId: ctx.orgId,
      type: 'SCAN_COMPLETE',
      title: `Scan completed: ${ctx.targetValue}`,
      body: `Found ${findings.length} vulnerabilities (${criticalCount} critical, ${highCount} high)`,
      metadata: {
        scanId,
        targetValue: ctx.targetValue,
        findingsCount: findings.length,
        criticalCount,
        highCount,
      },
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      orgId: ctx.orgId,
      action: 'scan.completed',
      resource: 'scan',
      resourceId: scanId,
      metadata: {
        target: ctx.targetValue,
        findingsCount: findings.length,
        duration: Date.now() - (scan.startedAt?.getTime() ?? Date.now()),
        modules: modules.map((m) => m.name),
      },
    },
  })

  // Broadcast completion
  broadcastToOrg(ctx.orgId, {
    type: 'scan.completed',
    data: {
      scanId,
      target: ctx.targetValue,
      findingsCount: findings.length,
      criticalCount,
      highCount,
    },
  })

  logger.info({
    scanId,
    target: ctx.targetValue,
    findingsCount: findings.length,
    criticalCount,
    highCount,
  }, 'Scan completed')

  // Post-scan: trigger attack chain analysis if we found vulnerabilities
  if (createdVulns.length >= 2) {
    try {
      await enqueueAttackChainAnalysis(ctx.orgId)
    } catch {
      // Redis might not be available
      logger.warn({ orgId: ctx.orgId }, 'Could not queue attack chain analysis (Redis unavailable?)')
    }
  }

  // Auto-generate PoC for critical/high findings that don't have one
  for (const vuln of createdVulns) {
    if ((vuln.severity === 'CRITICAL' || vuln.severity === 'HIGH') && !vuln.poc) {
      try {
        await enqueuePoCGeneration(vuln.id)
      } catch {
        // Skip if queue unavailable
      }
    }
  }
}
