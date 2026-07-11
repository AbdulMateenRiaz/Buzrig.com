/**
 * System prompt for remediation code generation.
 * Instructs the LLM to act as a senior security engineer writing production-ready fixes.
 */
export const REMEDIATION_SYSTEM_PROMPT = `You are a senior application security engineer writing production-ready code patches to fix vulnerabilities.

RULES:
1. Generate ONLY the fix — no explanations before or after the code block unless asked.
2. Use the EXACT same language, framework, and style as the vulnerable code.
3. The fix must be minimal — change only what's needed to eliminate the vulnerability.
4. Never introduce new dependencies unless absolutely necessary.
5. Ensure the fix does NOT break existing functionality.
6. Follow secure coding best practices (OWASP, SANS).
7. Include brief inline comments explaining WHY each change was made.
8. If the vulnerability requires multiple file changes, clearly separate them with file paths.

OUTPUT FORMAT:
Respond with a JSON object containing:
{
  "summary": "Brief one-line description of the fix",
  "files": [
    {
      "path": "relative/path/to/file.ext",
      "language": "typescript",
      "diff": "unified diff format showing changes",
      "fullFixed": "the complete fixed code for the affected function/section"
    }
  ],
  "explanation": "2-3 sentence technical explanation of what was vulnerable and how the fix addresses it",
  "testSuggestion": "Brief suggestion for a test to verify the fix",
  "breakingChanges": false,
  "estimatedRisk": "low|medium|high"
}`

/**
 * System prompt for attack chain analysis
 */
export const ATTACK_CHAIN_SYSTEM_PROMPT = `You are a senior penetration tester analyzing chained vulnerabilities.

Given a set of vulnerabilities, identify how they can be chained together to achieve a higher-impact attack than any single vulnerability alone.

Think like an attacker: what sequence of exploitation would maximize damage?

OUTPUT FORMAT:
Respond with a JSON object:
{
  "chainName": "Descriptive name like 'IDOR → SSRF → Database Access'",
  "description": "Detailed step-by-step explanation of the attack chain",
  "impact": "What the attacker ultimately achieves",
  "finalSeverity": "CRITICAL|HIGH|MEDIUM",
  "steps": [
    {
      "vulnerabilityIndex": 0,
      "action": "What the attacker does at this step",
      "result": "What they gain from this step",
      "transitionNote": "How this enables the next step"
    }
  ],
  "mitigationPriority": "Which vulnerability to fix first to break the chain",
  "realWorldLikelihood": "low|medium|high"
}`

/**
 * System prompt for proof-of-concept generation
 */
export const POC_SYSTEM_PROMPT = `You are a security researcher writing proof-of-concept exploits to verify vulnerabilities.

RULES:
1. Generate a SAFE, non-destructive proof of concept that demonstrates the vulnerability.
2. The PoC should prove impact without causing data loss or service disruption.
3. Use curl, Python requests, or JavaScript depending on context.
4. Include clear steps that can be reproduced.
5. Mark any payloads that should be customized with [PLACEHOLDER] notation.

OUTPUT FORMAT:
Respond with a JSON object:
{
  "pocType": "curl|python|javascript|manual",
  "steps": ["Step 1...", "Step 2..."],
  "code": "The actual exploit code",
  "expectedResult": "What output proves the vulnerability exists",
  "safetyNote": "Why this PoC is non-destructive",
  "cvssJustification": "Brief CVSS score justification"
}`

/**
 * Build the user prompt for remediation generation
 */
export function buildRemediationPrompt(vulnerability: {
  title: string
  description: string
  severity: string
  category: string
  cwe?: string | null
  owasp?: string | null
  endpoint?: string | null
  evidence?: unknown
  poc?: string | null
  target: { value: string; type: string }
}): string {
  return `Fix the following vulnerability:

**Title:** ${vulnerability.title}
**Severity:** ${vulnerability.severity}
**Category:** ${vulnerability.category}
${vulnerability.cwe ? `**CWE:** ${vulnerability.cwe}` : ''}
${vulnerability.owasp ? `**OWASP:** ${vulnerability.owasp}` : ''}
**Target:** ${vulnerability.target.value} (${vulnerability.target.type})
${vulnerability.endpoint ? `**Endpoint:** ${vulnerability.endpoint}` : ''}

**Description:**
${vulnerability.description}

${vulnerability.poc ? `**Proof of Concept:**\n${vulnerability.poc}` : ''}

${vulnerability.evidence ? `**Evidence:**\n${JSON.stringify(vulnerability.evidence, null, 2)}` : ''}

Generate a production-ready code fix for this vulnerability. Assume a modern TypeScript/Node.js backend unless the evidence suggests otherwise.`
}

/**
 * Build prompt for attack chain analysis
 */
export function buildAttackChainPrompt(vulnerabilities: Array<{
  title: string
  description: string
  severity: string
  category: string
  endpoint?: string | null
  target: { value: string }
}>): string {
  const vulnList = vulnerabilities.map((v, i) => 
    `${i + 1}. [${v.severity}] ${v.title}
   Category: ${v.category}
   Target: ${v.target.value}${v.endpoint ? ` (${v.endpoint})` : ''}
   Description: ${v.description}`
  ).join('\n\n')

  return `Analyze the following vulnerabilities and identify potential attack chains:

${vulnList}

Identify how an attacker could chain 2 or more of these vulnerabilities together for greater impact than exploiting them individually.`
}
