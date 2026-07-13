import { useState, useEffect } from 'react'
import { GitPullRequest, GitMerge, Clock, Code, ExternalLink, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import EmptyState from '../components/EmptyState'

const mockRemediations = [
  { id: 'PR-312', vulnerability: { title: 'SQL Injection in /api/users/search', severity: 'CRITICAL' }, repo: 'acme/backend', branch: 'fix/sqli-users-search', status: 'PR_OPEN', linesAdded: 12, linesRemoved: 3, createdAt: '2024-06-15T14:38:00Z', description: 'Replaced raw SQL with parameterized prepared statement.' },
  { id: 'PR-311', vulnerability: { title: 'IDOR on invoice download', severity: 'HIGH' }, repo: 'acme/backend', branch: 'fix/idor-invoice', status: 'MERGED', linesAdded: 28, linesRemoved: 5, createdAt: '2024-06-15T09:00:00Z', description: 'Added ownership check middleware.' },
  { id: 'PR-310', vulnerability: { title: 'Stored XSS via display name', severity: 'HIGH' }, repo: 'acme/frontend', branch: 'fix/xss-display-name', status: 'IN_REVIEW', linesAdded: 8, linesRemoved: 2, createdAt: '2024-06-14T18:00:00Z', description: 'Applied DOMPurify sanitization.' },
]

function getStatusIcon(status: string) {
  switch (status) {
    case 'PR_OPEN': return <GitPullRequest className="h-4 w-4 text-brand-500" />
    case 'MERGED': return <GitMerge className="h-4 w-4 text-purple-500" />
    case 'IN_REVIEW': return <Clock className="h-4 w-4 text-amber-500" />
    default: return <GitPullRequest className="h-4 w-4 text-surface-400" />
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'PR_OPEN': return 'text-red-600 bg-red-50 border-red-200'
    case 'MERGED': return 'text-purple-600 bg-purple-50 border-purple-200'
    case 'IN_REVIEW': return 'text-amber-600 bg-amber-50 border-amber-200'
    default: return 'text-surface-500 bg-surface-100 border-surface-200'
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function Remediations() {
  const [remediations, setRemediations] = useState<any[]>(mockRemediations)
  const [stats, setStats] = useState({ totalMerged: 47, avgHoursToMerge: 2.3 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getRemediations(),
      api.getRemediationStats(),
    ]).then(([remRes, statsRes]) => {
      if (remRes.success && remRes.data && remRes.data.length > 0) setRemediations(remRes.data)
      if (statsRes.success && statsRes.data) setStats(statsRes.data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-lg font-semibold text-surface-900">Remediations</h1>
        <p className="text-xs text-surface-500 mt-0.5">Auto-generated pull requests</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card py-5 text-center">
          <p className="text-2xl font-bold text-surface-900">{stats.totalMerged}</p>
          <p className="text-[11px] text-surface-500 mt-1">Merged</p>
        </div>
        <div className="card py-5 text-center">
          <p className="text-2xl font-bold text-amber-500">{remediations.filter((r) => r.status === 'IN_REVIEW').length}</p>
          <p className="text-[11px] text-surface-500 mt-1">In Review</p>
        </div>
        <div className="card py-5 text-center">
          <p className="text-2xl font-bold text-surface-700">{stats.avgHoursToMerge}h</p>
          <p className="text-[11px] text-surface-500 mt-1">Avg. Fix Time</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-surface-400" /></div>
      ) : remediations.length === 0 ? (
        <EmptyState icon={GitPullRequest} title="No remediations yet" description="Remediations are auto-generated when vulnerabilities are found" />
      ) : (
        <div className="space-y-2">
          {remediations.map((rem) => (
            <div key={rem.id} className="card py-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5">{getStatusIcon(rem.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <h3 className="text-sm font-medium text-surface-900">{rem.vulnerability?.title || ''}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${getStatusBadge(rem.status)}`}>{(rem.status || '').toLowerCase().replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs text-surface-500 mb-2.5">{rem.description}</p>
                  <div className="flex items-center gap-4 text-[11px] text-surface-400">
                    {rem.repo && <span className="flex items-center gap-1"><Code className="h-3 w-3" />{rem.repo}</span>}
                    {rem.branch && <span className="font-mono">{rem.branch}</span>}
                    {rem.linesAdded && <span className="text-emerald-600">+{rem.linesAdded}</span>}
                    {rem.linesRemoved && <span className="text-red-500">-{rem.linesRemoved}</span>}
                    <span>{rem.createdAt ? timeAgo(rem.createdAt) : ''}</span>
                  </div>
                </div>
                {rem.prUrl && (
                  <a href={rem.prUrl} target="_blank" rel="noopener noreferrer" className="rounded p-1.5 text-surface-400 hover:text-surface-700 transition-colors">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
