import type { FastifyInstance } from 'fastify'
import { prisma } from '../config/database.js'
import { requireAuth } from '../middleware/auth.js'

export async function dashboardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth)

  // ─── GET /api/dashboard ──────────────────────────────────────────────────
  app.get('/api/dashboard', async (request, reply) => {
    const orgId = request.authUser!.orgId

    const [
      openVulns,
      vulnsBySeverity,
      totalScans,
      runningScans,
      mergedPRs,
      activeChains,
      recentVulns,
      recentRemediations,
    ] = await Promise.all([
      // Total open vulnerabilities
      prisma.vulnerability.count({
        where: { orgId, status: { in: ['OPEN', 'IN_PROGRESS', 'REMEDIATION'] } },
      }),
      // By severity
      prisma.vulnerability.groupBy({
        by: ['severity'],
        where: { orgId, status: { notIn: ['VERIFIED_FIXED', 'FALSE_POSITIVE'] } },
        _count: true,
      }),
      // Total scans
      prisma.scan.count({ where: { orgId } }),
      // Running scans
      prisma.scan.count({ where: { orgId, status: 'RUNNING' } }),
      // Merged PRs
      prisma.remediation.count({
        where: { vulnerability: { orgId }, status: 'MERGED' },
      }),
      // Active attack chains
      prisma.attackChain.count({ where: { orgId, status: 'ACTIVE' } }),
      // Recent vulnerabilities (last 5)
      prisma.vulnerability.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true, title: true, severity: true, status: true, createdAt: true,
          target: { select: { value: true } },
        },
      }),
      // Recent remediations (last 5)
      prisma.remediation.findMany({
        where: { vulnerability: { orgId } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true, status: true, prUrl: true, repo: true, branch: true,
          createdAt: true, mergedAt: true,
          vulnerability: { select: { title: true, severity: true } },
        },
      }),
    ])

    // Calculate security score (simple formula)
    const criticalCount = vulnsBySeverity.find((g) => g.severity === 'CRITICAL')?._count ?? 0
    const highCount = vulnsBySeverity.find((g) => g.severity === 'HIGH')?._count ?? 0
    const mediumCount = vulnsBySeverity.find((g) => g.severity === 'MEDIUM')?._count ?? 0
    const lowCount = vulnsBySeverity.find((g) => g.severity === 'LOW')?._count ?? 0

    // Score: start at 100, deduct per severity
    const score = Math.max(0, Math.min(100,
      100 - (criticalCount * 15) - (highCount * 8) - (mediumCount * 3) - (lowCount * 1)
    ))

    return reply.send({
      success: true,
      data: {
        securityScore: score,
        openVulnerabilities: openVulns,
        vulnsBySeverity: vulnsBySeverity.map((g) => ({ severity: g.severity, count: g._count })),
        totalScans,
        runningScans,
        mergedPRs,
        activeAttackChains: activeChains,
        recentVulnerabilities: recentVulns,
        recentRemediations,
      },
    })
  })

  // ─── GET /api/dashboard/activity ─────────────────────────────────────────
  app.get('/api/dashboard/activity', async (request, reply) => {
    const orgId = request.authUser!.orgId

    // Get last 20 audit log entries as activity feed
    const activities = await prisma.auditLog.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        action: true,
        resource: true,
        resourceId: true,
        metadata: true,
        createdAt: true,
      },
    })

    return reply.send({ success: true, data: activities })
  })
}
