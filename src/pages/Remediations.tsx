import { GitPullRequest, GitMerge, Clock, Code, ExternalLink } from 'lucide-react'

const remediations = [
  { id: 'PR-312', vulnerability: 'SQL Injection in /api/users/search', repo: 'acme/backend', branch: 'fix/sqli-users-search', status: 'open', added: 12, removed: 3, created: '2h ago', description: 'Replaced raw SQL with parameterized prepared statement.' },
  { id: 'PR-311', vulnerability: 'IDOR on invoice download', repo: 'acme/backend', branch: 'fix/idor-invoice', status: 'merged', added: 28, removed: 5, created: '5h ago', description: 'Added ownership check middleware before serving invoice PDFs.' },
  { id: 'PR-310', vulnerability: 'Stored XSS via display name', repo: 'acme/frontend', branch: 'fix/xss-display-name', status: 'review', added: 8, removed: 2, created: '8h ago', description: 'Applied DOMPurify sanitization to user display names.' },
  { id: 'PR-309', vulnerability: 'Missing rate limiting', repo: 'acme/auth-service', branch: 'fix/ratelimit-reset', status: 'open', added: 35, removed: 0, created: '1d ago', description: 'Added sliding-window rate limiter to password reset.' },
]

function getStatusIcon(status: string) {
  switch (status) {
    case 'open': return <GitPullRequest className="h-4 w-4 text-brand-500" />
    case 'merged': return <GitMerge className="h-4 w-4 text-purple-500" />
    case 'review': return <Clock className="h-4 w-4 text-amber-500" />
    default: return <GitPullRequest className="h-4 w-4 text-surface-400" />
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'open': return 'text-red-600 bg-red-50 border-red-200'
    case 'merged': return 'text-purple-600 bg-purple-50 border-purple-200'
    case 'review': return 'text-amber-600 bg-amber-50 border-amber-200'
    default: return 'text-surface-500 bg-surface-100 border-surface-200'
  }
}

export default function Remediations() {
  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-lg font-semibold text-surface-900">Remediations</h1>
        <p className="text-xs text-surface-500 mt-0.5">Auto-generated pull requests</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card py-5 text-center">
          <p className="text-2xl font-bold text-surface-900">47</p>
          <p className="text-[11px] text-surface-500 mt-1">Merged</p>
        </div>
        <div className="card py-5 text-center">
          <p className="text-2xl font-bold text-amber-500">3</p>
          <p className="text-[11px] text-surface-500 mt-1">In Review</p>
        </div>
        <div className="card py-5 text-center">
          <p className="text-2xl font-bold text-surface-700">2.3h</p>
          <p className="text-[11px] text-surface-500 mt-1">Avg. Fix Time</p>
        </div>
      </div>

      <div className="space-y-2">
        {remediations.map((rem) => (
          <div key={rem.id} className="card py-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5">{getStatusIcon(rem.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h3 className="text-sm font-medium text-surface-900">{rem.vulnerability}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${getStatusBadge(rem.status)}`}>{rem.status}</span>
                </div>
                <p className="text-xs text-surface-500 mb-2.5">{rem.description}</p>
                <div className="flex items-center gap-4 text-[11px] text-surface-400">
                  <span className="flex items-center gap-1"><Code className="h-3 w-3" />{rem.repo}</span>
                  <span className="font-mono">{rem.branch}</span>
                  <span className="text-emerald-600">+{rem.added}</span>
                  <span className="text-red-500">-{rem.removed}</span>
                  <span>{rem.created}</span>
                </div>
              </div>
              <button className="rounded p-1.5 text-surface-400 hover:text-surface-700 transition-colors">
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
