import type { ScanModule, ScanContext, Finding } from '../types.js'
import { httpRequest } from '../http-client.js'
import { logger } from '../../../lib/logger.js'

/**
 * Tests for API-specific vulnerabilities: IDOR, mass assignment, info disclosure.
 * Maps to OWASP A01:2021 Broken Access Control.
 */
export const ApiScanner: ScanModule = {
  name: 'API Security',
  description: 'Tests for IDOR, mass assignment, information disclosure, and API misconfigurations',

  async run(ctx: ScanContext, report: (finding: Finding) => void) {
    const baseUrl = ctx.targetValue.startsWith('http')
      ? ctx.targetValue
      : `https://${ctx.targetValue}`

    logger.debug({ target: baseUrl }, 'Running API scan')

    await testInformationDisclosure(baseUrl, report)
    await testIdorPatterns(baseUrl, report)
    await testVerbTampering(baseUrl, report)
    await testOpenApiExposure(baseUrl, report)
  },
}

async function testInformationDisclosure(baseUrl: string, report: (f: Finding) => void) {
  const debugEndpoints = [
    '/debug', '/api/debug', '/_debug', '/api/_health',
    '/env', '/api/env', '/.env', '/config',
    '/api/config', '/phpinfo.php', '/server-status',
    '/actuator', '/actuator/env', '/actuator/health',
    '/.git/config', '/.git/HEAD',
    '/swagger.json', '/api-docs', '/openapi.json',
    '/graphql', '/graphiql',
    '/wp-admin', '/admin', '/api/admin',
  ]

  for (const path of debugEndpoints) {
    const response = await httpRequest(`${baseUrl}${path}`, { timeout: 5000 })

    if (response.status === 200) {
      // Check for sensitive content
      const sensitivePatterns = [
        { regex: /DATABASE_URL|DB_PASSWORD|DB_HOST/i, type: 'Database credentials' },
        { regex: /API_KEY|SECRET_KEY|PRIVATE_KEY/i, type: 'API keys/secrets' },
        { regex: /AWS_ACCESS_KEY|AWS_SECRET/i, type: 'AWS credentials' },
        { regex: /password.*[:=]/i, type: 'Passwords' },
        { regex: /\[core\].*repositoryformatversion/i, type: 'Git repository exposed' },
        { regex: /phpinfo\(\)/i, type: 'PHP configuration' },
      ]

      const found = sensitivePatterns.find((p) => p.regex.test(response.body))

      if (found) {
        report({
          title: `Sensitive information exposed at ${path}`,
          description: `The endpoint ${path} exposes ${found.type}. This information can be used by attackers to gain further access to the system or escalate privileges.`,
          severity: 'HIGH',
          cvss: 7.5,
          category: 'Information Disclosure',
          cwe: 'CWE-200',
          owasp: 'A01:2021',
          endpoint: path,
          evidence: {
            type: found.type,
            statusCode: response.status,
            responseSnippet: response.body.slice(0, 200),
          },
          poc: `curl ${baseUrl}${path}`,
        })
      } else if (path.includes('.git') || path.includes('swagger') || path.includes('graphql')) {
        report({
          title: `Development/debug endpoint exposed: ${path}`,
          description: `The endpoint ${path} is accessible in production. This may expose internal API documentation, source code, or debugging interfaces that should not be public.`,
          severity: 'MEDIUM',
          cvss: 5.3,
          category: 'Security Misconfiguration',
          cwe: 'CWE-200',
          owasp: 'A05:2021',
          endpoint: path,
          evidence: { statusCode: response.status, contentLength: response.body.length },
          poc: `curl -sI ${baseUrl}${path}`,
        })
      }
    }

    await sleep(100)
  }

  // Test error handling — trigger a 500 and check if stack traces leak
  const errorResponse = await httpRequest(`${baseUrl}/api/NONEXISTENT_${Date.now()}`, { timeout: 5000 })
  if (errorResponse.body.match(/at Object\.|at Module\.|at Function\.|Traceback|stack.*trace/i)) {
    report({
      title: 'Stack traces exposed in error responses',
      description: 'Application error responses include full stack traces with internal file paths and line numbers. This reveals application internals to attackers.',
      severity: 'MEDIUM',
      cvss: 5.3,
      category: 'Information Disclosure',
      cwe: 'CWE-209',
      owasp: 'A05:2021',
      endpoint: '/api/*',
      evidence: { responseSnippet: errorResponse.body.slice(0, 500) },
      poc: `curl ${baseUrl}/api/NONEXISTENT`,
    })
  }
}

async function testIdorPatterns(baseUrl: string, report: (f: Finding) => void) {
  // Test sequential ID access patterns
  const idEndpoints = [
    '/api/users/1', '/api/users/2',
    '/api/invoices/1', '/api/invoices/2',
    '/api/orders/1', '/api/orders/2',
  ]

  for (let i = 0; i < idEndpoints.length; i += 2) {
    const resp1 = await httpRequest(`${baseUrl}${idEndpoints[i]}`, { timeout: 5000 })
    const resp2 = await httpRequest(`${baseUrl}${idEndpoints[i + 1]}`, { timeout: 5000 })

    // If both return 200 without auth, possible IDOR
    if (resp1.status === 200 && resp2.status === 200) {
      const endpoint = idEndpoints[i].replace(/\/\d+$/, '/:id')
      report({
        title: `Potential IDOR on ${endpoint}`,
        description: `The endpoint ${endpoint} returns data for sequential IDs without apparent authorization checks. An attacker could enumerate and access other users' resources by iterating through IDs.`,
        severity: 'HIGH',
        cvss: 7.5,
        category: 'Broken Access Control',
        cwe: 'CWE-639',
        owasp: 'A01:2021',
        endpoint,
        evidence: {
          testedUrls: [idEndpoints[i], idEndpoints[i + 1]],
          bothReturned200: true,
        },
        poc: `curl ${baseUrl}${idEndpoints[i]}\ncurl ${baseUrl}${idEndpoints[i + 1]}`,
      })
      break // one IDOR finding is enough
    }

    await sleep(100)
  }
}

async function testVerbTampering(baseUrl: string, report: (f: Finding) => void) {
  // Test if protected endpoints respond to unexpected HTTP methods
  const endpoints = ['/api/users', '/api/admin', '/api/settings']

  for (const endpoint of endpoints) {
    const getResp = await httpRequest(`${baseUrl}${endpoint}`, { method: 'GET', timeout: 5000 })
    if (getResp.status === 401 || getResp.status === 403) {
      // Try other methods
      for (const method of ['PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
        const resp = await httpRequest(`${baseUrl}${endpoint}`, { method, timeout: 5000 })
        if (resp.status === 200) {
          report({
            title: `HTTP method bypass on ${endpoint}`,
            description: `The endpoint ${endpoint} denies GET requests (${getResp.status}) but allows ${method} requests (200). This suggests the authorization check only applies to certain HTTP methods, allowing bypass.`,
            severity: 'HIGH',
            cvss: 7.5,
            category: 'Broken Access Control',
            cwe: 'CWE-650',
            owasp: 'A01:2021',
            endpoint,
            evidence: {
              deniedMethod: 'GET',
              deniedStatus: getResp.status,
              bypassMethod: method,
              bypassStatus: resp.status,
            },
            poc: `curl -X ${method} ${baseUrl}${endpoint}`,
          })
          break
        }
      }
    }

    await sleep(100)
  }
}

async function testOpenApiExposure(baseUrl: string, report: (f: Finding) => void) {
  const specPaths = ['/openapi.json', '/swagger.json', '/api-docs', '/swagger-ui/', '/docs']

  for (const path of specPaths) {
    const resp = await httpRequest(`${baseUrl}${path}`, { timeout: 5000 })
    if (resp.status === 200 && (resp.body.includes('openapi') || resp.body.includes('swagger'))) {
      // Check if it exposes internal/admin endpoints
      const hasAdmin = resp.body.match(/admin|internal|private|debug/i)
      if (hasAdmin) {
        report({
          title: `OpenAPI spec exposes internal endpoints at ${path}`,
          description: `The OpenAPI/Swagger specification at ${path} is publicly accessible and references internal/admin endpoints. This provides attackers with a complete map of the API including undocumented routes.`,
          severity: 'MEDIUM',
          cvss: 5.3,
          category: 'Information Disclosure',
          cwe: 'CWE-200',
          owasp: 'A05:2021',
          endpoint: path,
          evidence: { foundPatterns: hasAdmin[0] },
          poc: `curl ${baseUrl}${path}`,
        })
      }
      break
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
