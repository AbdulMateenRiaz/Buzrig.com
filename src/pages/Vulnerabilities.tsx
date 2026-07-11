import { Filter } from 'lucide-react'

const vulnerabilities = [
  { id: 'VLN-089', title: 'SQL Injection in /api/users/search', severity: 'critical', cvss: 9.8, target: 'api.acme.com', category: 'Injection', attackChain: true, status: 'open' },
  { id: 'VLN-088', title: 'Broken Access Control — IDOR on invoice download', severity: 'high', cvss: 8.1, target: 'app.acme.com', category: 'Access Control', attackChain: true, status: 'remediation' },
  { id: 'VLN-087', title: 'Stored XSS via user display name', severity: 'high', cvss: 7.5, target: 'app.acme.com', category: 'XSS', attackChain: false, status: 'open' },
  { id: 'VLN-086', title: 'Missing rate limiting on password reset', severity: 'medium', cvss: 5.9, target: 'auth.acme.com', category: 'Misconfiguration', attackChain: false, status: 'remediation' },
  { id: 'VLN-085', title: 'Information disclosure in error responses', severity: 'low', cvss: 3.7, target: 'api.acme.com', category: 'Misconfiguration', attackChain: false, status: 'fixed' },
  { id: 'VLN-084', title: 'Weak JWT signing secret', severity: 'critical', cvss: 9.1, target: 'auth.acme.com', category: 'Cryptography', attackChain: true, status: 'open' },
]

function getSeverityBadge(severity: string) {
  const map: Record<string, string> = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' }
  return map[severity] || 'badge-info'
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'open': return 'text-red-600 bg-red-50 border-red-200'
    case 'remediation': return 'text-amber-600 bg-amber-50 border-amber-200'
    case 'fixed': return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    default: return 'text-surface-500 bg-surface-100 border-surface-200'
  }
}

export default function Vulnerabilities() {
  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-surface-900">Vulnerabilities</h1>
          <p className="text-xs text-surface-500 mt-0.5">All findings across your attack surface</p>
        </div>
        <button className="btn-secondary text-xs"><Filter className="h-3.5 w-3.5" />Filters</button>
      </div>

      <div className="space-y-2">
        {vulnerabilities.map((v) => (
          <div key={v.id} className="card py-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <span className={getSeverityBadge(v.severity)}>{v.severity}</span>
              {v.attackChain && <span className="text-[10px] text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded font-medium">Chain</span>}
              <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${getStatusStyle(v.status)}`}>{v.status}</span>
            </div>
            <h3 className="text-sm font-medium text-surface-900 mb-2">{v.title}</h3>
            <div className="flex items-center gap-4 text-[11px] text-surface-400">
              <span className="font-mono">{v.id}</span>
              <span>CVSS {v.cvss}</span>
              <span className="font-mono">{v.target}</span>
              <span>{v.category}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
