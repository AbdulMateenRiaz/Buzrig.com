import type { Severity } from '@prisma/client'

export interface ScanContext {
  scanId: string
  orgId: string
  targetId: string
  targetValue: string  // domain or URL
  targetType: string
  config: Record<string, unknown>
}

export interface Finding {
  title: string
  description: string
  severity: Severity
  cvss: number | null
  category: string
  cwe: string | null
  owasp: string | null
  endpoint: string | null
  evidence: Record<string, unknown> | null
  poc: string | null
}

export interface ScanModule {
  name: string
  description: string
  run(ctx: ScanContext, report: (finding: Finding) => void): Promise<void>
}

export interface HttpResponse {
  status: number
  headers: Record<string, string>
  body: string
  url: string
  timing: number
}

export interface HttpRequestOptions {
  method?: string
  headers?: Record<string, string>
  body?: string
  timeout?: number
  followRedirects?: boolean
}
