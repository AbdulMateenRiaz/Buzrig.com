import { logger } from '../../lib/logger.js'
import type { HttpResponse, HttpRequestOptions } from './types.js'

/**
 * Safe HTTP client for scanning.
 * Implements timeouts, size limits, and error handling
 * to prevent hangs or excessive resource consumption.
 */
export async function httpRequest(
  url: string,
  options: HttpRequestOptions = {}
): Promise<HttpResponse> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = 10000,
    followRedirects = true,
  } = options

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  const startTime = Date.now()

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'User-Agent': 'PenAgent-Scanner/1.0 (Security Testing)',
        ...headers,
      },
      body: body || undefined,
      signal: controller.signal,
      redirect: followRedirects ? 'follow' : 'manual',
    })

    // Limit response body to 1MB to prevent memory issues
    const maxBodySize = 1024 * 1024
    const responseBody = await response.text()
    const truncatedBody = responseBody.length > maxBodySize
      ? responseBody.slice(0, maxBodySize)
      : responseBody

    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key.toLowerCase()] = value
    })

    return {
      status: response.status,
      headers: responseHeaders,
      body: truncatedBody,
      url: response.url,
      timing: Date.now() - startTime,
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        status: 0,
        headers: {},
        body: '',
        url,
        timing: Date.now() - startTime,
      }
    }
    logger.debug({ url, error: (error as Error).message }, 'HTTP request failed')
    return {
      status: 0,
      headers: {},
      body: '',
      url,
      timing: Date.now() - startTime,
    }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Send a request with a potentially malicious payload
 * and compare against a baseline response to detect vulnerabilities.
 */
export async function probeEndpoint(
  baseUrl: string,
  path: string,
  payloads: Array<{ payload: string; description: string }>,
  options: HttpRequestOptions = {}
): Promise<Array<{ payload: string; description: string; response: HttpResponse; suspicious: boolean }>> {
  const results: Array<{ payload: string; description: string; response: HttpResponse; suspicious: boolean }> = []

  // First, get baseline response
  const baseline = await httpRequest(`${baseUrl}${path}`, options)

  for (const { payload, description } of payloads) {
    // Inject payload into the path or query
    const testUrl = path.includes('?')
      ? `${baseUrl}${path}&test=${encodeURIComponent(payload)}`
      : `${baseUrl}${path}?q=${encodeURIComponent(payload)}`

    const response = await httpRequest(testUrl, options)

    // Detect suspicious behavior
    const suspicious = detectAnomaly(baseline, response, payload)

    results.push({ payload, description, response, suspicious })

    // Rate limit: 100ms between requests to avoid DoS
    await sleep(100)
  }

  return results
}

function detectAnomaly(baseline: HttpResponse, test: HttpResponse, payload: string): boolean {
  // Status code change (e.g., 200 → 500 suggests injection)
  if (baseline.status === 200 && test.status === 500) return true

  // Error messages in response suggesting injection worked
  const errorPatterns = [
    /SQL syntax/i,
    /mysql_/i,
    /pg_query/i,
    /ORA-\d+/i,
    /SQLITE_/i,
    /syntax error/i,
    /unterminated/i,
    /unexpected token/i,
    /stack trace/i,
    /at Object\./i,
    /at Module\./i,
  ]
  if (errorPatterns.some((p) => p.test(test.body) && !p.test(baseline.body))) return true

  // Reflected payload (potential XSS)
  if (test.body.includes(payload) && !baseline.body.includes(payload)) return true

  // Significant response time difference (potential timing attack vector)
  if (test.timing > baseline.timing * 3 && test.timing > 3000) return true

  return false
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
