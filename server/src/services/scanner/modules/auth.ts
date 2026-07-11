import type { ScanModule, ScanContext, Finding } from '../types.js'
import { httpRequest } from '../http-client.js'
import { logger } from '../../../lib/logger.js'

/**
 * Tests authentication and session management vulnerabilities.
 * Maps to OWASP A07:2021 and A02:2021.
 */
export const AuthScanner: ScanModule = {
  name: 'Authentication & Session',
  description: 'Tests for weak authentication, session management, and cryptographic issues',

  async run(ctx: ScanContext, report: (finding: Finding) => void) {
    const baseUrl = ctx.targetValue.startsWith('http')
      ? ctx.targetValue
      : `https://${ctx.targetValue}`

    logger.debug({ target: baseUrl }, 'Running auth scan')

    await testDefaultCredentials(baseUrl, report)
    await testRateLimiting(baseUrl, report)
    await testPasswordPolicy(baseUrl, report)
    await testJwtWeakness(baseUrl, report)
    await testCors(baseUrl, report)
  },
}

async function testDefaultCredentials(baseUrl: string, report: (f: Finding) => void) {
  const loginEndpoints = ['/api/auth/login', '/api/login', '/login', '/admin/login']
  const defaultCreds = [
    { email: 'admin@admin.com', password: 'admin' },
    { email: 'admin@example.com', password: 'password' },
    { email: 'test@test.com', password: 'test123' },
    { email: 'admin@admin.com', password: 'admin123' },
  ]

  for (const endpoint of loginEndpoints) {
    const probe = await httpRequest(`${baseUrl}${endpoint}`, { method: 'POST', timeout: 5000 })
    if (probe.status === 0 || probe.status === 404) continue

    for (const creds of defaultCreds) {
      const response = await httpRequest(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
        timeout: 5000,
      })

      // If we get a 200 with a token, default creds work
      if (response.status === 200 && (response.body.includes('token') || response.body.includes('session'))) {
        report({
          title: `Default credentials accepted at ${endpoint}`,
          description: `The login endpoint ${endpoint} accepts default/weak credentials (${creds.email}). An attacker can gain unauthorized access using commonly known credentials.`,
          severity: 'CRITICAL',
          cvss: 9.8,
          category: 'Identification and Authentication Failures',
          cwe: 'CWE-798',
          owasp: 'A07:2021',
          endpoint,
          evidence: { credentials: creds.email, responseStatus: response.status },
          poc: `curl -X POST ${baseUrl}${endpoint} -H "Content-Type: application/json" -d '${JSON.stringify(creds)}'`,
        })
        return // one finding is enough
      }

      await sleep(200)
    }
  }
}

async function testRateLimiting(baseUrl: string, report: (f: Finding) => void) {
  const sensitiveEndpoints = [
    '/api/auth/login', '/api/login', '/api/auth/reset-password',
    '/api/auth/forgot-password', '/api/register',
  ]

  for (const endpoint of sensitiveEndpoints) {
    const probe = await httpRequest(`${baseUrl}${endpoint}`, { method: 'POST', timeout: 3000 })
    if (probe.status === 0 || probe.status === 404) continue

    // Send 20 rapid requests
    let blocked = false
    for (let i = 0; i < 20; i++) {
      const response = await httpRequest(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
        timeout: 3000,
      })

      if (response.status === 429) {
        blocked = true
        break
      }

      await sleep(50)
    }

    if (!blocked) {
      report({
        title: `Missing rate limiting on ${endpoint}`,
        description: `The endpoint ${endpoint} does not implement rate limiting. An attacker can make unlimited requests to brute-force credentials, enumerate users, or perform denial-of-service attacks.`,
        severity: 'MEDIUM',
        cvss: 5.9,
        category: 'Security Misconfiguration',
        cwe: 'CWE-307',
        owasp: 'A07:2021',
        endpoint,
        evidence: { requestsMade: 20, wasBlocked: false },
        poc: `for i in $(seq 1 50); do curl -s -o /dev/null -w "%{http_code}\\n" -X POST ${baseUrl}${endpoint} -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"x"}'; done`,
      })
    }
  }
}

async function testPasswordPolicy(baseUrl: string, report: (f: Finding) => void) {
  const registerEndpoints = ['/api/auth/register', '/api/register', '/api/auth/signup']

  for (const endpoint of registerEndpoints) {
    const probe = await httpRequest(`${baseUrl}${endpoint}`, { method: 'POST', timeout: 3000 })
    if (probe.status === 0 || probe.status === 404) continue

    // Try weak password
    const response = await httpRequest(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'weak-test-penagent@test.com',
        password: '123', // extremely weak
        firstName: 'Test',
        lastName: 'User',
      }),
      timeout: 5000,
    })

    // If 200/201, weak password was accepted
    if (response.status >= 200 && response.status < 300) {
      report({
        title: `Weak password policy on ${endpoint}`,
        description: `The registration endpoint ${endpoint} accepts extremely weak passwords (e.g., "123"). This allows users to create accounts with passwords that are trivially guessable.`,
        severity: 'MEDIUM',
        cvss: 5.4,
        category: 'Identification and Authentication Failures',
        cwe: 'CWE-521',
        owasp: 'A07:2021',
        endpoint,
        evidence: { weakPasswordAccepted: '123', responseStatus: response.status },
        poc: null,
      })
      break
    }
  }
}

async function testJwtWeakness(baseUrl: string, report: (f: Finding) => void) {
  // Try to get a JWT from login (with any credentials)
  const loginEndpoints = ['/api/auth/login', '/api/login']

  for (const endpoint of loginEndpoints) {
    const response = await httpRequest(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'password' }),
      timeout: 5000,
    })

    // Look for JWT in response
    const jwtMatch = response.body.match(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)
    if (jwtMatch) {
      const token = jwtMatch[0]
      const parts = token.split('.')

      try {
        const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString())

        // Check for 'none' algorithm
        if (header.alg === 'none' || header.alg === 'None') {
          report({
            title: 'JWT accepts "none" algorithm',
            description: 'The application issues JWTs with the "none" algorithm, which means the token signature is not verified. Any attacker can forge tokens with arbitrary claims.',
            severity: 'CRITICAL',
            cvss: 9.8,
            category: 'Cryptographic Failures',
            cwe: 'CWE-327',
            owasp: 'A02:2021',
            endpoint,
            evidence: { algorithm: header.alg, jwtHeader: header },
            poc: null,
          })
        }

        // HS256 with potentially weak secret (we can't verify without brute-force,
        // but we flag it as informational if HS256 is used in enterprise context)
        if (header.alg === 'HS256') {
          // Decode payload for additional info
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())

          // Check if token has no expiration
          if (!payload.exp) {
            report({
              title: 'JWT tokens have no expiration',
              description: 'JWT tokens issued by the application do not contain an expiration claim (exp). Stolen tokens remain valid indefinitely.',
              severity: 'HIGH',
              cvss: 7.5,
              category: 'Identification and Authentication Failures',
              cwe: 'CWE-613',
              owasp: 'A07:2021',
              endpoint,
              evidence: { algorithm: header.alg, hasExpiry: false },
              poc: null,
            })
          }
        }
      } catch {
        // Can't decode JWT, skip
      }
    }
  }
}

async function testCors(baseUrl: string, report: (f: Finding) => void) {
  // Test with a malicious origin
  const response = await httpRequest(baseUrl, {
    headers: { Origin: 'https://evil-attacker.com' },
    timeout: 5000,
  })

  const acao = response.headers['access-control-allow-origin']
  const acac = response.headers['access-control-allow-credentials']

  if (acao === '*' && acac === 'true') {
    report({
      title: 'Wildcard CORS with credentials allowed',
      description: 'The application returns Access-Control-Allow-Origin: * with Access-Control-Allow-Credentials: true. This allows any website to make authenticated cross-origin requests and steal user data.',
      severity: 'HIGH',
      cvss: 8.1,
      category: 'Security Misconfiguration',
      cwe: 'CWE-942',
      owasp: 'A05:2021',
      endpoint: '/',
      evidence: { allowOrigin: acao, allowCredentials: acac },
      poc: `fetch("${baseUrl}/api/me", { credentials: "include" }).then(r => r.json()).then(console.log)`,
    })
  } else if (acao === 'https://evil-attacker.com') {
    report({
      title: 'CORS reflects arbitrary origin',
      description: 'The application reflects any Origin header in the Access-Control-Allow-Origin response. This allows any website to make cross-origin requests, potentially stealing sensitive data from authenticated users.',
      severity: 'HIGH',
      cvss: 7.5,
      category: 'Security Misconfiguration',
      cwe: 'CWE-942',
      owasp: 'A05:2021',
      endpoint: '/',
      evidence: { sentOrigin: 'https://evil-attacker.com', reflectedOrigin: acao },
      poc: null,
    })
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
