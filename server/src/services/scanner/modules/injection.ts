import type { ScanModule, ScanContext, Finding } from '../types.js'
import { httpRequest } from '../http-client.js'
import { logger } from '../../../lib/logger.js'

const SQL_PAYLOADS = [
  { payload: "' OR '1'='1", description: 'Classic boolean-based SQL injection' },
  { payload: "'; DROP TABLE users;--", description: 'Destructive SQLi attempt' },
  { payload: "' UNION SELECT null,null,null--", description: 'UNION-based column enumeration' },
  { payload: "1' AND SLEEP(5)--", description: 'Time-based blind SQL injection' },
  { payload: "\\'; WAITFOR DELAY '0:0:5'--", description: 'MSSQL time-based blind' },
]

const XSS_PAYLOADS = [
  { payload: '<script>alert(1)</script>', description: 'Basic reflected XSS' },
  { payload: '"><img src=x onerror=alert(1)>', description: 'Event handler XSS' },
  { payload: "javascript:alert('XSS')", description: 'Protocol handler XSS' },
  { payload: '<svg/onload=alert(1)>', description: 'SVG-based XSS' },
  { payload: '{{7*7}}', description: 'Template injection probe' },
]

const SSRF_PAYLOADS = [
  { payload: 'http://169.254.169.254/latest/meta-data/', description: 'AWS metadata SSRF' },
  { payload: 'http://127.0.0.1:22', description: 'Internal port scanning via SSRF' },
  { payload: 'file:///etc/passwd', description: 'Local file read via SSRF' },
]

/**
 * Tests for injection vulnerabilities (SQLi, XSS, SSRF).
 * Maps to OWASP A03:2021 Injection.
 */
export const InjectionScanner: ScanModule = {
  name: 'Injection Testing',
  description: 'Tests for SQL injection, XSS, and SSRF vulnerabilities',

  async run(ctx: ScanContext, report: (finding: Finding) => void) {
    const baseUrl = ctx.targetValue.startsWith('http')
      ? ctx.targetValue
      : `https://${ctx.targetValue}`

    logger.debug({ target: baseUrl }, 'Running injection scan')

    // Discover endpoints first
    const endpoints = await discoverEndpoints(baseUrl)

    for (const endpoint of endpoints) {
      await testSqlInjection(baseUrl, endpoint, report)
      await testXss(baseUrl, endpoint, report)
      await testSsrf(baseUrl, endpoint, report)
    }
  },
}

async function discoverEndpoints(baseUrl: string): Promise<string[]> {
  const commonPaths = [
    '/api/users', '/api/search', '/api/login', '/api/register',
    '/api/products', '/api/orders', '/api/invoices',
    '/api/auth/login', '/api/auth/register', '/api/auth/reset-password',
    '/search', '/login', '/register', '/contact',
  ]

  const discovered: string[] = []

  for (const path of commonPaths) {
    const response = await httpRequest(`${baseUrl}${path}`, { timeout: 5000 })
    if (response.status > 0 && response.status < 500) {
      discovered.push(path)
    }
    await sleep(50)
  }

  // Always test root
  if (!discovered.includes('/')) discovered.push('/')

  return discovered.slice(0, 20) // limit to prevent over-scanning
}

async function testSqlInjection(baseUrl: string, endpoint: string, report: (f: Finding) => void) {
  for (const { payload, description } of SQL_PAYLOADS) {
    // Test in query parameter
    const url = `${baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}q=${encodeURIComponent(payload)}`
    const response = await httpRequest(url, { timeout: 8000 })

    // Check for SQL error signatures
    const sqlErrors = [
      /SQL syntax.*MySQL/i,
      /Warning.*mysql_/i,
      /PostgreSQL.*ERROR/i,
      /ORA-\d{5}/i,
      /Microsoft SQL Native Client error/i,
      /SQLITE_ERROR/i,
      /unterminated quoted string/i,
      /pg_query\(\)/i,
      /sqlite3\.OperationalError/i,
    ]

    const foundError = sqlErrors.find((regex) => regex.test(response.body))
    if (foundError) {
      report({
        title: `SQL Injection in ${endpoint}`,
        description: `The endpoint ${endpoint} is vulnerable to SQL injection. The payload "${payload}" (${description}) triggered a database error in the response, confirming that user input is concatenated directly into SQL queries without sanitization.`,
        severity: 'CRITICAL',
        cvss: 9.8,
        category: 'Injection',
        cwe: 'CWE-89',
        owasp: 'A03:2021',
        endpoint,
        evidence: {
          payload,
          description,
          requestUrl: url,
          responseStatus: response.status,
          errorPattern: foundError.toString(),
          responseSnippet: response.body.slice(0, 500),
        },
        poc: `curl "${url}"`,
      })
      break // one finding per endpoint
    }

    // Time-based detection
    if (payload.includes('SLEEP') || payload.includes('WAITFOR')) {
      if (response.timing > 4500) {
        report({
          title: `Blind SQL Injection (time-based) in ${endpoint}`,
          description: `The endpoint ${endpoint} appears vulnerable to blind SQL injection. A time-delay payload caused the response to take ${response.timing}ms (normal baseline is much faster), indicating the SQL query is being executed.`,
          severity: 'CRITICAL',
          cvss: 9.8,
          category: 'Injection',
          cwe: 'CWE-89',
          owasp: 'A03:2021',
          endpoint,
          evidence: {
            payload,
            responseTime: response.timing,
            expectedDelay: 5000,
          },
          poc: `curl -w "\\nTime: %{time_total}s\\n" "${url}"`,
        })
        break
      }
    }

    await sleep(100)
  }
}

async function testXss(baseUrl: string, endpoint: string, report: (f: Finding) => void) {
  for (const { payload, description } of XSS_PAYLOADS) {
    const url = `${baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}q=${encodeURIComponent(payload)}`
    const response = await httpRequest(url, { timeout: 5000 })

    // Check if payload is reflected without encoding
    if (response.body.includes(payload)) {
      // Verify it's not just in a JSON string (which browsers don't execute)
      const contentType = response.headers['content-type'] || ''
      if (contentType.includes('html') || !contentType.includes('json')) {
        report({
          title: `Reflected XSS in ${endpoint}`,
          description: `The endpoint ${endpoint} reflects user input without proper encoding. The payload "${payload}" (${description}) appears unescaped in the HTML response, allowing execution of arbitrary JavaScript in the victim's browser.`,
          severity: 'HIGH',
          cvss: 7.5,
          category: 'Cross-Site Scripting',
          cwe: 'CWE-79',
          owasp: 'A07:2021',
          endpoint,
          evidence: {
            payload,
            description,
            reflected: true,
            contentType,
            responseSnippet: extractContext(response.body, payload, 100),
          },
          poc: `Open in browser: ${url}`,
        })
        break
      }
    }

    // Template injection check
    if (payload === '{{7*7}}' && response.body.includes('49')) {
      report({
        title: `Server-Side Template Injection in ${endpoint}`,
        description: `The endpoint ${endpoint} evaluates template expressions. The payload "{{7*7}}" was evaluated to "49", indicating server-side template injection which can lead to remote code execution.`,
        severity: 'CRITICAL',
        cvss: 9.8,
        category: 'Injection',
        cwe: 'CWE-1336',
        owasp: 'A03:2021',
        endpoint,
        evidence: { payload, evaluated: '49', responseSnippet: response.body.slice(0, 300) },
        poc: `curl "${url}" | grep 49`,
      })
      break
    }

    await sleep(100)
  }
}

async function testSsrf(baseUrl: string, endpoint: string, report: (f: Finding) => void) {
  // Only test endpoints that might accept URLs (common patterns)
  if (!endpoint.match(/url|link|redirect|callback|webhook|fetch|load|import|src/i)) return

  for (const { payload, description } of SSRF_PAYLOADS) {
    const url = `${baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}url=${encodeURIComponent(payload)}`
    const response = await httpRequest(url, { timeout: 8000 })

    // Look for internal data in response
    const ssrfIndicators = [
      /ami-id/i, /instance-id/i, // AWS metadata
      /root:.*:0:0:/i, // /etc/passwd
      /SSH-\d/i, // SSH banner
      /internal.*server/i,
    ]

    const found = ssrfIndicators.find((regex) => regex.test(response.body))
    if (found) {
      report({
        title: `Server-Side Request Forgery (SSRF) in ${endpoint}`,
        description: `The endpoint ${endpoint} follows user-supplied URLs without validation. The payload "${payload}" (${description}) returned internal data, indicating the server can be tricked into making requests to internal resources.`,
        severity: 'HIGH',
        cvss: 8.6,
        category: 'Server-Side Request Forgery',
        cwe: 'CWE-918',
        owasp: 'A10:2021',
        endpoint,
        evidence: {
          payload,
          description,
          indicator: found.toString(),
          responseSnippet: response.body.slice(0, 300),
        },
        poc: `curl "${url}"`,
      })
      break
    }

    await sleep(100)
  }
}

function extractContext(body: string, needle: string, contextChars: number): string {
  const idx = body.indexOf(needle)
  if (idx === -1) return ''
  const start = Math.max(0, idx - contextChars)
  const end = Math.min(body.length, idx + needle.length + contextChars)
  return body.slice(start, end)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
