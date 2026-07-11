import { Bug, GitPullRequest, Radar, CheckCircle, AlertTriangle } from 'lucide-react'

const activities = [
  { time: '14:38', icon: GitPullRequest, color: 'text-emerald-500 bg-emerald-50', text: 'PR #312 opened', detail: 'fix/sqli-users-search → acme/backend' },
  { time: '14:35', icon: Bug, color: 'text-brand-500 bg-brand-50', text: 'SQL Injection discovered', detail: 'api.acme.com/api/users/search — CVSS 9.8' },
  { time: '14:32', icon: Radar, color: 'text-blue-500 bg-blue-50', text: 'Scan in progress', detail: 'api.acme.com — 47 endpoints, 67% complete' },
  { time: '13:55', icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50', text: 'PR #311 merged', detail: 'fix/idor-invoice → acme/backend' },
  { time: '13:20', icon: AlertTriangle, color: 'text-amber-500 bg-amber-50', text: 'Attack chain identified', detail: 'IDOR → SSRF → DB Access on app.acme.com' },
  { time: '12:45', icon: Bug, color: 'text-orange-500 bg-orange-50', text: 'IDOR vulnerability found', detail: 'app.acme.com/api/invoices/:id — CVSS 8.1' },
  { time: '12:01', icon: Radar, color: 'text-blue-500 bg-blue-50', text: 'Scan started', detail: 'app.acme.com — Full OWASP coverage' },
]

export default function ActivityFeed() {
  return (
    <div className="card-static">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider">Agent Activity</h3>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] text-surface-400">Live</span>
        </div>
      </div>
      <div className="space-y-4">
        {activities.map((a, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${a.color} shrink-0`}>
              <a.icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-surface-800 font-medium">{a.text}</p>
              <p className="text-[11px] text-surface-400 truncate">{a.detail}</p>
            </div>
            <span className="text-[11px] text-surface-400 tabular-nums shrink-0">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
