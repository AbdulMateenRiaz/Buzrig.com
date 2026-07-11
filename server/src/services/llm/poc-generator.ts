import { prisma } from '../../config/database.js'
import { logger } from '../../lib/logger.js'
import { llmChat } from './client.js'
import { POC_SYSTEM_PROMPT } from './prompts.js'

interface PoCResult {
  pocType: 'curl' | 'python' | 'javascript' | 'manual'
  steps: string[]
  code: string
  expectedResult: string
  safetyNote: string
  cvssJustification: string
}

/**
 * Generate a proof-of-concept exploit for a vulnerability.
 * This is NON-DESTRUCTIVE — it proves exploitability without causing damage.
 */
export async function generatePoC(vulnerabilityId: string): Promise<PoCResult | null> {
  const vuln = await prisma.vulnerability.findUnique({
    where: { id: vulnerabilityId },
    include: { target: { select: { value: true, type: true } } },
  })

  if (!vuln) {
    logger.error({ vulnerabilityId }, 'Vulnerability not found for PoC generation')
    return null
  }

  try {
    const userPrompt = `Generate a safe, non-destructive proof-of-concept for:

**Vulnerability:** ${vuln.title}
**Severity:** ${vuln.severity} (CVSS: ${vuln.cvss ?? 'N/A'})
**Category:** ${vuln.category}
${vuln.cwe ? `**CWE:** ${vuln.cwe}` : ''}
**Target:** ${vuln.target.value} (${vuln.target.type})
${vuln.endpoint ? `**Endpoint:** ${vuln.endpoint}` : ''}

**Description:**
${vuln.description}

${vuln.evidence ? `**Evidence from scan:**\n${JSON.stringify(vuln.evidence, null, 2)}` : ''}

Generate a PoC that PROVES the vulnerability exists without causing damage. Use placeholder values where needed (e.g., [TARGET_URL]).`

    const response = await llmChat(POC_SYSTEM_PROMPT, userPrompt, {
      temperature: 0.2,
      maxTokens: 2048,
      model: 'gpt-4o',
    })

    // Parse result
    let result: PoCResult
    try {
      let content = response.content.trim()
      if (content.startsWith('```json')) content = content.slice(7)
      if (content.startsWith('```')) content = content.slice(3)
      if (content.endsWith('```')) content = content.slice(0, -3)
      result = JSON.parse(content.trim())
    } catch {
      // Fallback
      result = {
        pocType: 'manual',
        steps: ['See generated exploit code below'],
        code: response.content,
        expectedResult: 'Vulnerability is exploitable',
        safetyNote: 'Review carefully before running',
        cvssJustification: `Severity ${vuln.severity}`,
      }
    }

    // Store PoC on the vulnerability
    await prisma.vulnerability.update({
      where: { id: vulnerabilityId },
      data: {
        poc: result.code,
        verifiedAt: new Date(),
        evidence: {
          ...(vuln.evidence as object ?? {}),
          pocType: result.pocType,
          pocSteps: result.steps,
          expectedResult: result.expectedResult,
          safetyNote: result.safetyNote,
          cvssJustification: result.cvssJustification,
        },
      },
    })

    logger.info({
      vulnerabilityId,
      pocType: result.pocType,
      tokensUsed: response.totalTokens,
    }, 'PoC generated successfully')

    return result

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    logger.error({ vulnerabilityId, error: msg }, 'PoC generation failed')
    return null
  }
}
