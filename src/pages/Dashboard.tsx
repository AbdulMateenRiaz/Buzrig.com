import { Bug, GitPullRequest, AlertTriangle, Clock, TrendingDown, TrendingUp } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import SecurityGauge from '../components/SecurityGauge'
import ActivityFeed from '../components/ActivityFeed'

const trendData = [
  { date: 'Jan', critical: 8, high: 12, medium: 18 },
  { date: 'Feb', critical: 6, high: 14, medium: 15 },
  { date: 'Mar', critical: 9, high: 11, medium: 20 },
  { date: 'Apr', critical: 4, high: 9, medium: 16 },
  { date: 'May', critical: 3, high: 7, medium: 12 },
  { date: 'Jun', critical: 2, high: 5, medium: 10 },
]

const recentFindings = [
  { id: 'VLN-089', title: 'SQL Injection in /api/users/search', severity: 'critical', target: 'api.acme.com', found: '2h ago', status: 'PR Open' },
  { id: 'VLN-088', title: 'IDOR on invoice download', severity: 'high', target: 'app.acme.com', found: '5h ago', status: 'Merged' },
  { id: 'VLN-087', title: 'Stored XSS via display name', severity: 'high', target: 'app.acme.com', found: '8h ago', status: 'Review' },
  { id: 'VLN-086', title: 'Missing rate limit on password reset', severity: 'medium', target: 'auth.acme.com', found: '1d ago', status: 'PR Open' },
]

function getSeverityBadge(severity: string) {
  const map: Record<string, string> = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' }
  return map[severity] || 'badge-info'
}

export default function Dashboard() {
  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-surface-900">Dashboard</h1>
        <p className="text-sm text-surface-500 mt-0.5">Last scan completed 12 minutes ago</p>
      </div>

      {/* Hero: Security Score + Stats */}
      <div className="card-static">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Gauge */}
          <div className="flex flex-col items-center">
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-4">Security Score</p>
            <SecurityGauge score={82} />
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-48 bg-surface-200" />
          <div className="lg:hidden w-full h-px bg-surface-200" />

          {/* Supporting Stats */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                <Bug className="h-4 w-4 text-brand-500" />
                <span className="text-xs text-surface-500">Open Vulnerabilities</span>
              </div>
              <p className="text-3xl font-bold text-surface-900">23</p>
              <span className="text-[11px] font-medium text-accent-500 flex items-center justify-center lg:justify-start gap-0.5 mt-1">
                <TrendingDown className="h-3 w-3" />-12% this month
              </span>
            </div>

            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                <GitPullRequest className="h-4 w-4 text-accent-500" />
                <span className="text-xs text-surface-500">PRs Merged</span>
              </div>
              <p className="text-3xl font-bold text-surface-900">47</p>
              <span className="text-[11px] font-medium text-accent-500 flex items-center justify-center lg:justify-start gap-0.5 mt-1">
                <TrendingUp className="h-3 w-3" />+8 this week
              </span>
            </div>

            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-surface-500">Attack Chains</span>
              </div>
              <p className="text-3xl font-bold text-surface-900">5</p>
              <span className="text-[11px] font-medium text-brand-500 flex items-center justify-center lg:justify-start gap-0.5 mt-1">
                <TrendingUp className="h-3 w-3" />+2 new
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card-static">
        <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-6">Vulnerability Trend</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="critGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="highGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ea580c" stopOpacity={0.08} />
                <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '11px', color: '#374151', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Area type="monotone" dataKey="critical" stroke="#dc2626" strokeWidth={2} fill="url(#critGrad)" />
            <Area type="monotone" dataKey="high" stroke="#ea580c" strokeWidth={1.5} fill="url(#highGrad)" />
            <Area type="monotone" dataKey="medium" stroke="#d97706" strokeWidth={1} fill="transparent" strokeDasharray="4 4" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-6 mt-4 justify-center">
          <div className="flex items-center gap-2 text-[11px] text-surface-500">
            <div className="h-2 w-4 rounded-full bg-red-500" />Critical
          </div>
          <div className="flex items-center gap-2 text-[11px] text-surface-500">
            <div className="h-2 w-4 rounded-full bg-orange-500" />High
          </div>
          <div className="flex items-center gap-2 text-[11px] text-surface-500">
            <div className="h-0.5 w-4 border-t-2 border-dashed border-amber-500" />Medium
          </div>
        </div>
      </div>

      {/* Activity Feed + Findings side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
        <div className="lg:col-span-2 card-static">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider">Recent Findings</h3>
            <button className="text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors">View all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-200 text-left">
                  <th className="pb-3 pr-4 text-[10px] font-medium text-surface-400 uppercase tracking-wider">ID</th>
                  <th className="pb-3 pr-4 text-[10px] font-medium text-surface-400 uppercase tracking-wider">Finding</th>
                  <th className="pb-3 pr-4 text-[10px] font-medium text-surface-400 uppercase tracking-wider">Severity</th>
                  <th className="pb-3 pr-4 text-[10px] font-medium text-surface-400 uppercase tracking-wider">Target</th>
                  <th className="pb-3 pr-4 text-[10px] font-medium text-surface-400 uppercase tracking-wider">Found</th>
                  <th className="pb-3 text-[10px] font-medium text-surface-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {recentFindings.map((f) => (
                  <tr key={f.id} className="hover:bg-surface-50 transition-colors">
                    <td className="py-3.5 pr-4 font-mono text-[11px] text-surface-400">{f.id}</td>
                    <td className="py-3.5 pr-4 text-sm text-surface-700">{f.title}</td>
                    <td className="py-3.5 pr-4"><span className={getSeverityBadge(f.severity)}>{f.severity}</span></td>
                    <td className="py-3.5 pr-4 font-mono text-[11px] text-surface-400">{f.target}</td>
                    <td className="py-3.5 pr-4 text-[11px] text-surface-400"><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{f.found}</span></td>
                    <td className="py-3.5"><span className="badge-info">{f.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
