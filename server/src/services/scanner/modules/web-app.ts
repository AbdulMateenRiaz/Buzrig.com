import type { ScanModule, ScanContext, Finding } from '../types.js'
import { httpRequest } from '../http-client.js'
import { logger } from '../../../lib/logger.js'

/**
 * General web application scanner — checks TLS, redirects, form security.
 */
export const WebAppScanner: ScanModule = {
  name: 'Web Application',
  description: 'Tests general web application security: TLS, redirects, form handling',

  async run(ctx: ScanContext, report: (finding: Finding) => void) {
    const baseUrl = ctx.targetValue.startsWith('http')
      ? ctx.targetValue
      : `https://${ctx.targetValue}`

    logger.debug({ target: baseUrl }, 'Running web app scan')

    await testHttpsRedirect(ctx.targetValue, report)
    await testOpenRedirect(baseUrl, report)
    await testDirectoryListing(baseUrl, report)
    await testSensitiveFiles(baseUrl, report)
  },
}

async function testHttpsRedirect(domain: string, report: (f: Finding) => void) {
  const cleanDomain = domain.replace(/^https?:\/\//, '')
  const httpUrl = `http://${cleanDomain}`

  const response = await httpRequest(httpUrl, { followRedirects: false, timeout: 5000 })

  if (response.status > 0 && response.status !== 301 && response.status !== 308) {
    // HTTP is accessible without redirect to HTTPS
    report({
      title: 'HTTP traffic not redirected to HTTPS',
      description: `The application is accessible over plain HTTP (${httpUrl}) without redirecting to HTTPS. This allows man-in-the-middle attacks on users who navigate to the HTTP version.`,
      severity: 'MEDIUM',
      cvss: 5.4,
      category: 'Cryptographic Failures',
      cwe: 'CWE-319',
      owasp: 'A02:2021',
      endpoint: '/',
      evidence: { httpStatus: response.status, redirectLocation: response.headers['location'] || 'none' },
      poc: `curl -sI ${httpUrl}`,
    })
  }
}

async function testOpenRedirect(baseUrl: string, report: (f: Finding) => void) {
  const redirectParams = ['redirect', 'url', 'next', 'return', 'returnTo', 'redirect_uri', 'callback']
  const maliciousUrl = 'https://evil-attacker.com/phish'

  for (const param of redirectParams) {
    // Try on common endpoints
    for (const path of ['/login', '/auth/callback', '/redirect', '/']) {
      const testUrl = `${baseUrl}${path}?${param}=${encodeURIComponent(maliciousUrl)}`
      const response = await httpRequest(testUrl, { followRedirects: false, timeout: 5000 })

      const location = response.headers['location'] || ''
      if (location.includes('evil-attacker.com')) {
        report({
          title: `Open redirect via ${param} parameter`,
          description: `The application redirects users to external URLs based on the "${param}" parameter without validation. An attacker can craft phishing links that appear to originate from the trusted domain.`,
          severity: 'MEDIUM',
          cvss: 5.4,
          category: 'Broken Access Control',
          cwe: 'CWE-601',
          owasp: 'A01:2021',
          endpoint: path,
          evidence: { parameter: param, injectedUrl: maliciousUrl, redirectedTo: location },
          poc: `curl -sI "${testUrl}"`,
        })
        return // one finding is enough
      }
    }
  }
}

async function testDirectoryListing(baseUrl: string, report: (f: Finding) => void) {
  const directories = ['/static/', '/uploads/', '/images/', '/files/', '/assets/', '/public/']

  for (const dir of directories) {
    const response = await httpRequest(`${baseUrl}${dir}`, { timeout: 5000 })

    if (response.status === 200 && response.body.match(/Index of|Directory listing|Parent Directory/i)) {
      report({
        title: `Directory listing enabled at ${dir}`,
        description: `The directory ${dir} has directory listing enabled, exposing all files within it. Attackers can discover sensitive files, backup archives, or configuration files.`,
        severity: 'LOW',
        cvss: 3.7,
        category: 'Security Misconfiguration',
        cwe: 'CWE-548',
        owasp: 'A05:2021',
        endpoint: dir,
        evidence: { statusCode: response.status, responseSnippet: response.body.slice(0, 200) },
        poc: `curl ${baseUrl}${dir}`,
      })
    }

    await sleep(50)
  }
}

async function testSensitiveFiles(baseUrl: string, report: (f: Finding) => void) {
  const sensitiveFiles = [
    { path: '/.env', desc: 'Environment variables file' },
    { path: '/backup.sql', desc: 'Database backup' },
    { path: '/dump.sql', desc: 'Database dump' },
    { path: '/database.sql', desc: 'Database export' },
    { path: '/wp-config.php.bak', desc: 'WordPress config backup' },
    { path: '/config.yml', desc: 'Configuration file' },
    { path: '/docker-compose.yml', desc: 'Docker configuration' },
    { path: '/.htpasswd', desc: 'Password file' },
    { path: '/id_rsa', desc: 'SSH private key' },
    { path: '/.ssh/id_rsa', desc: 'SSH private key' },
  ]

  for (const { path, desc } of sensitiveFiles) {
    const response = await httpRequest(`${baseUrl}${path}`, { timeout: 5000 })

    if (response.status === 200 && response.body.length > 10) {
      // Verify it's not a generic 200 page
      const looksLikeError = response.body.match(/not found|404|error/i)
      if (!looksLikeError) {
        report({
          title: `Sensitive file accessible: ${path}`,
          description: `The file ${path} (${desc}) is directly accessible via the web server. This may expose credentials, database contents, or private keys.`,
          severity: 'HIGH',
          cvss: 7.5,
          category: 'Security Misconfiguration',
          cwe: 'CWE-538',
          owasp: 'A05:2021',
          endpoint: path,
          evidence: { statusCode: response.status, contentLength: response.body.length },
          poc: `curl ${baseUrl}${path}`,
        })
      }
    }

    await sleep(50)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
