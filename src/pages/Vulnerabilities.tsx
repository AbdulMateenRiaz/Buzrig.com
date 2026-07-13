import { useState, useEffect } from 'react'
import { Filter, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import EmptyState from '../components/EmptyState'

const mockVulns = [
  { id: 'VLN-089', title: 'SQL Injection in /api/users/search', severity: 'CRITICAL', cvss: 9.8, target: { value: 'api.acme.com' }, category: 'Injection', status: 'OPEN' },
  { id: 'VLN-088', title: 'Broken Access Control — IDOR on invoice download', severity: 'HIGH', cvss: 8.1, target: { value: 'app.acme.com' }, category: 'Access Control', status: 'REMEDIATION' },
  { id: 'VLN-087', title: 'Stored XSS via user display name', severity: 'HIGH', cvss: 7.5, target: { value: 'app.acme.com' }, category: 'XSS', status: 'OPEN' },
  { id: 'VLN-086', title: 'Missing rate limiting on password reset', severity: 'MEDIUM', cvss: 5.9, target: { value: 'auth.acme.com' }, category: 'Misconfiguration', status: 'REMEDIATION' },
  { id: 'VLN-085', title: 'Information disclosure in error responses', severity: 'LOW', cvss: 3.7, target: { value: 'api.acme.com' }, category: 'Misconfiguration', status: 'VERIFIED_FIXED' },
]

function getSeverityBadge(severity: string) {
  const map: Record<string, string> = { CRITICAL: 'badge-critical', HIGH: 'badge-high', MEDIUM: 'badge-medium', LOW: 'badge-low', critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' }
  return map[severity] || 'badge-info'
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'OPEN': return 'text-red-600 bg-red-50 border-red-200'
    case 'REMEDIATION': case 'IN_PROGRESS': return 'text-amber-600 bg-amber-50 border-amber-200'
    case 'VERIFIED_FIXED': return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    default: return 'text-surface-500 bg-surface-100 border-surface-200'
  }
}

export default function Vulnerabilities() {
  const [vulns, setVulns] = useState<any[]>(mockVulns)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getVulnerabilities().then((res) => {
      if (res.success && res.data && res.data.length > 0) setVulns(res.data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-surface-900">Vulnerabilities</h1>
          <p className="text-xs text-surface-500 mt-0.5">All findings across your attack surface</p>
        </div>
        <button className="btn-secondary text-xs"><Filter className="h-3.5 w-3.5" />Filters</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-surface-400" /></div>
      ) : vulns.length === 0 ? (
        <EmptyState icon={Filter} title="No vulnerabilities found" description="Run a scan to discover vulnerabilities in your targets" />
      ) : (
        <div className="space-y-2">
          {vulns.map((v) => (
            <div key={v.id} className="card py-5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                <span className={getSeverityBadge(v.severity)}>{(v.severity || '').toLowerCase()}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${getStatusStyle(v.status)}`}>{(v.status || '').toLowerCase().replace('_', ' ')}</span>
              </div>
              <h3 className="text-sm font-medium text-surface-900 mb-2">{v.title}</h3>
              <div className="flex items-center gap-4 text-[11px] text-surface-400">
                <span className="font-mono">{v.id?.slice(0, 8)}</span>
                {v.cvss && <span>CVSS {v.cvss}</span>}
                <span className="font-mono">{v.target?.value || ''}</span>
                <span>{v.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
