import { prisma } from '../../config/database.js'
import { logger } from '../../lib/logger.js'
import { llmChat } from './client.js'
import { ATTACK_CHAIN_SYSTEM_PROMPT, buildAttackChainPrompt } from './prompts.js'
import { broadcastToOrg } from '../../routes/websocket.js'

interface AnalysisStep {
  vulnerabilityIndex: number
  action: string
  result: string
  transitionNote: string
}

interface AttackChainAnalysis {
  chainName: string
  description: string
  impact: string
  finalSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  steps: AnalysisStep[]
  mitigationPriority: string
  realWorldLikelihood: 'low' | 'medium' | 'high'
}

/**
 * Analyze all open vulnerabilities in an org and discover potential attack chains.
 * Called after a scan completes or on demand.
 */
export async function analyzeAttackChains(orgId: string): Promise<void> {
  logger.info({ orgId }, 'Starting attack chain analysis')

  // Fetch all open vulnerabilities for the org
  const vulnerabilities = await prisma.vulnerability.findMany({
    where: {
      orgId,
      status: { in: ['OPEN', 'IN_PROGRESS', 'REMEDIATION'] },
      falsePositive: false,
    },
    include: {
      target: { select: { value: true } },
    },
    orderBy: { severity: 'asc' },
  })

  if (vulnerabilities.length < 2) {
    logger.info({ orgId, vulnCount: vulnerabilities.length }, 'Not enough vulns for chain analysis')
    return
  }

  // Only send relevant subset to LLM (max 15 vulns to avoid token limits)
  const vulnsForAnalysis = vulnerabilities.slice(0, 15)

  try {
    const userPrompt = buildAttackChainPrompt(vulnsForAnalysis.map((v) => ({
      title: v.title,
      description: v.description,
      severity: v.severity,
      category: v.category,
      endpoint: v.endpoint,
      target: { value: v.target.value },
    })))

    const response = await llmChat(ATTACK_CHAIN_SYSTEM_PROMPT, userPrompt, {
      temperature: 0.3,
      maxTokens: 3000,
      model: 'gpt-4o',
    })

    // Parse response
    let analysis: AttackChainAnalysis
    try {
      let content = response.content.trim()
      if (content.startsWith('```json')) content = content.slice(7)
      if (content.startsWith('```')) content = content.slice(3)
      if (content.endsWith('```')) content = content.slice(0, -3)
      analysis = JSON.parse(content.trim())
    } catch {
      logger.error({ orgId, content: response.content.slice(0, 300) }, 'Failed to parse attack chain analysis')
      return
    }

    // Validate steps reference valid vulnerabilities
    const validSteps = analysis.steps.filter(
      (s) => s.vulnerabilityIndex >= 0 && s.vulnerabilityIndex < vulnsForAnalysis.length
    )

    if (validSteps.length < 2) {
      logger.info({ orgId }, 'No valid attack chain found by LLM')
      return
    }

    // Check if this chain already exists (by matching vulnerability IDs)
    const chainVulnIds = validSteps.map((s) => vulnsForAnalysis[s.vulnerabilityIndex].id)
    const existingChains = await prisma.attackChain.findMany({
      where: { orgId, status: 'ACTIVE' },
      include: { nodes: { orderBy: { position: 'asc' } } },
    })

    const isDuplicate = existingChains.some((chain) => {
      const existingIds = chain.nodes.map((n) => n.vulnerabilityId)
      return chainVulnIds.every((id) => existingIds.includes(id))
    })

    if (isDuplicate) {
      logger.info({ orgId }, 'Attack chain already exists, skipping')
      return
    }

    // Create the attack chain
    const chain = await prisma.attackChain.create({
      data: {
        orgId,
        name: analysis.chainName,
        description: analysis.description,
        impact: analysis.impact,
        finalSeverity: analysis.finalSeverity,
        aiAnalysis: JSON.stringify({
          mitigationPriority: analysis.mitigationPriority,
          realWorldLikelihood: analysis.realWorldLikelihood,
          steps: analysis.steps,
        }),
        nodes: {
          create: validSteps.map((step, idx) => ({
            vulnerabilityId: vulnsForAnalysis[step.vulnerabilityIndex].id,
            position: idx + 1,
            transitionNote: step.transitionNote,
          })),
        },
      },
      include: {
        nodes: {
          include: { vulnerability: { select: { title: true, severity: true } } },
          orderBy: { position: 'asc' },
        },
      },
    })

    // Notification
    await prisma.notification.create({
      data: {
        orgId,
        type: 'ATTACK_CHAIN',
        title: `Attack chain discovered: ${analysis.chainName}`,
        body: analysis.impact,
        metadata: {
          chainId: chain.id,
          severity: analysis.finalSeverity,
          vulnCount: validSteps.length,
          likelihood: analysis.realWorldLikelihood,
        },
      },
    })

    // Audit
    await prisma.auditLog.create({
      data: {
        orgId,
        action: 'attack_chain.ai_discovered',
        resource: 'attack_chain',
        resourceId: chain.id,
        metadata: {
          name: analysis.chainName,
          severity: analysis.finalSeverity,
          vulnCount: validSteps.length,
          tokensUsed: response.totalTokens,
        },
      },
    })

    // Real-time broadcast
    broadcastToOrg(orgId, {
      type: 'attack_chain.discovered',
      data: {
        chainId: chain.id,
        name: analysis.chainName,
        severity: analysis.finalSeverity,
        impact: analysis.impact,
        vulnCount: validSteps.length,
      },
    })

    logger.info({
      orgId,
      chainId: chain.id,
      name: analysis.chainName,
      severity: analysis.finalSeverity,
      tokensUsed: response.totalTokens,
    }, 'Attack chain discovered')

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    logger.error({ orgId, error: msg }, 'Attack chain analysis failed')
  }
}
