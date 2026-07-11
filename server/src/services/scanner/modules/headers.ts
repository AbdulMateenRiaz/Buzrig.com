import type { ScanModule, ScanContext, Finding } from '../types.js'
import { httpRequest } from '../http-client.js'
import { logger } from '../../../lib/logger.js'

/**
 * Checks HTTP security headers.
 * Maps to OWASP A05:2021 Security Misconfiguration.
 */
export const HeaderScanner: ScanModule = {
  name: 'Security Headers',
  description: 'Checks for missing or misconfigured HTTP security headers',

  async run(ctx: ScanContext, report: (finding: Finding) => void) {
    const baseUrl = ctx.targetValue.startsWith('http')
      ? ctx.targetValue
      : `https://${ctx.targetValue}`

    logger.debug({ target: baseUrl }, 'Running header scan')

    const response = await httpRequest(baseUrl)
    if (response.status === 0) {
      logger.warn({ target: baseUrl }, 'Target unreachable for header scan')
      return
    }

    const headers = response.headers

    // ─── Strict-Transport-Security ─────────────────────────────────────────
    if (!headers['strict-transport-security']) {
      report({
        title: 'Missing Strict-Transport-Security header',
        description: 'The HTTP Strict-Transport-Security (HSTS) header is not set. This allows attackers to perform protocol downgrade attacks and redirect users to HTTP, enabling man-in-the-middle attacks.',
        severity: 'MEDIUM',
        cvss: 5.4,
        category: 'Security Misconfiguration',
        cwe: 'CWE-319',
        owasp: 'A05:2021',
        endpoint: '/',
        evidence: { missingHeader: 'Strict-Transport-Security', responseHeaders: headers },
        poc: `curl -sI ${baseUrl} | grep -i strict-transport`,
      })
    }

    // ─── Content-Security-Policy ───────────────────────────────────────────
    if (!headers['content-security-policy']) {
      report({
        title: 'Missing Content-Security-Policy header',
        description: 'No Content-Security-Policy (CSP) header is set. This makes the application more susceptible to XSS attacks as browsers cannot restrict the sources of loaded content.',
        severity: 'MEDIUM',
        cvss: 5.0,
        category: 'Security Misconfiguration',
        cwe: 'CWE-693',
        owasp: 'A05:2021',
        endpoint: '/',
        evidence: { missingHeader: 'Content-Security-Policy' },
        poc: null,
      })
    }

    // ─── X-Content-Type-Options ────────────────────────────────────────────
    if (headers['x-content-type-options'] !== 'nosniff') {
      report({
        title: 'Missing X-Content-Type-Options: nosniff',
        description: 'Without X-Content-Type-Options: nosniff, the browser may MIME-sniff the response body, potentially treating non-executable content as executable, leading to XSS.',
        severity: 'LOW',
        cvss: 3.1,
        category: 'Security Misconfiguration',
        cwe: 'CWE-16',
        owasp: 'A05:2021',
        endpoint: '/',
        evidence: { currentValue: headers['x-content-type-options'] || 'not set' },
        poc: null,
      })
    }

    // ─── X-Frame-Options ───────────────────────────────────────────────────
    if (!headers['x-frame-options'] && !headers['content-security-policy']?.includes('frame-ancestors')) {
      report({
        title: 'Missing clickjacking protection',
        description: 'Neither X-Frame-Options nor CSP frame-ancestors is set. The application can be embedded in iframes on malicious sites, enabling clickjacking attacks.',
        severity: 'MEDIUM',
        cvss: 4.3,
        category: 'Security Misconfiguration',
        cwe: 'CWE-1021',
        owasp: 'A05:2021',
        endpoint: '/',
        evidence: { missingHeaders: ['X-Frame-Options', 'CSP frame-ancestors'] },
        poc: `<iframe src="${baseUrl}" width="500" height="400"></iframe>`,
      })
    }

    // ─── Server header information leakage ─────────────────────────────────
    const serverHeader = headers['server']
    if (serverHeader && /\d+\.\d+/.test(serverHeader)) {
      report({
        title: 'Server version disclosed in headers',
        description: `The Server header reveals version information: "${serverHeader}". This helps attackers identify specific vulnerabilities for the server software version.`,
        severity: 'LOW',
        cvss: 2.6,
        category: 'Information Disclosure',
        cwe: 'CWE-200',
        owasp: 'A05:2021',
        endpoint: '/',
        evidence: { serverHeader },
        poc: `curl -sI ${baseUrl} | grep -i server`,
      })
    }

    // ─── Cookies without Secure/HttpOnly ───────────────────────────────────
    const setCookie = headers['set-cookie']
    if (setCookie) {
      if (!setCookie.toLowerCase().includes('httponly')) {
        report({
          title: 'Session cookie missing HttpOnly flag',
          description: 'Cookies are set without the HttpOnly flag, making them accessible to JavaScript. An XSS vulnerability could steal session tokens.',
          severity: 'MEDIUM',
          cvss: 5.3,
          category: 'Security Misconfiguration',
          cwe: 'CWE-1004',
          owasp: 'A05:2021',
          endpoint: '/',
          evidence: { setCookieHeader: setCookie },
          poc: 'document.cookie // accessible from JS if XSS exists',
        })
      }
      if (!setCookie.toLowerCase().includes('secure')) {
        report({
          title: 'Session cookie missing Secure flag',
          description: 'Cookies are set without the Secure flag, meaning they can be transmitted over unencrypted HTTP connections, exposing session tokens to network sniffing.',
          severity: 'MEDIUM',
          cvss: 5.3,
          category: 'Security Misconfiguration',
          cwe: 'CWE-614',
          owasp: 'A05:2021',
          endpoint: '/',
          evidence: { setCookieHeader: setCookie },
          poc: null,
        })
      }
    }
  },
}
