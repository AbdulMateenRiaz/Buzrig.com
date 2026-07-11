import { Globe, Key, Bell, Users, Webhook } from 'lucide-react'

export default function Settings() {
  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-lg font-semibold text-surface-900">Settings</h1>
        <p className="text-xs text-surface-500 mt-0.5">Targets, integrations, and preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center gap-2.5 mb-5">
            <Globe className="h-4 w-4 text-brand-500" />
            <h3 className="text-sm font-medium text-surface-900">Attack Surface</h3>
          </div>
          <div className="space-y-2">
            {['api.acme.com', 'app.acme.com', 'auth.acme.com'].map((t) => (
              <div key={t} className="flex items-center justify-between rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5">
                <span className="font-mono text-xs text-surface-700">{t}</span>
                <span className="text-[10px] font-medium text-emerald-500 uppercase">Active</span>
              </div>
            ))}
            <button className="w-full rounded-lg border border-dashed border-surface-300 py-2.5 text-xs text-surface-400 hover:text-surface-600 hover:border-surface-400 transition-colors">+ Add Target</button>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2.5 mb-5">
            <Webhook className="h-4 w-4 text-brand-500" />
            <h3 className="text-sm font-medium text-surface-900">Integrations</h3>
          </div>
          <div className="space-y-2">
            {[
              { name: 'GitHub', connected: true },
              { name: 'Slack', connected: true },
              { name: 'Jira', connected: false },
              { name: 'PagerDuty', connected: false },
            ].map((i) => (
              <div key={i.name} className="flex items-center justify-between rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5">
                <span className="text-xs text-surface-700">{i.name}</span>
                <span className={`text-[10px] font-medium uppercase ${i.connected ? 'text-emerald-500' : 'text-surface-400'}`}>
                  {i.connected ? 'Connected' : 'Not connected'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2.5 mb-5">
            <Key className="h-4 w-4 text-brand-500" />
            <h3 className="text-sm font-medium text-surface-900">API Keys</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5">
              <div>
                <p className="text-xs text-surface-700">Production Key</p>
                <p className="font-mono text-[11px] text-surface-400">pk_live_••••••••3a9f</p>
              </div>
              <button className="text-[11px] text-brand-500 hover:text-brand-600 font-medium">Revoke</button>
            </div>
            <button className="w-full rounded-lg border border-dashed border-surface-300 py-2.5 text-xs text-surface-400 hover:text-surface-600 hover:border-surface-400 transition-colors">+ Generate Key</button>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2.5 mb-5">
            <Bell className="h-4 w-4 text-brand-500" />
            <h3 className="text-sm font-medium text-surface-900">Notifications</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Critical findings', sub: 'Immediate', on: true },
              { label: 'High findings', sub: 'Within 1 hour', on: true },
              { label: 'Remediation PRs', sub: 'On creation', on: true },
              { label: 'Scan completions', sub: 'Summary', on: false },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-surface-700">{n.label}</p>
                  <p className="text-[11px] text-surface-400">{n.sub}</p>
                </div>
                <div className={`h-5 w-9 rounded-full transition-colors relative cursor-pointer ${n.on ? 'bg-brand-500' : 'bg-surface-300'}`}>
                  <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${n.on ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-5">
            <Users className="h-4 w-4 text-brand-500" />
            <h3 className="text-sm font-medium text-surface-900">Team</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200 text-left">
                <th className="pb-3 pr-4 text-[10px] font-medium text-surface-400 uppercase tracking-wider">Name</th>
                <th className="pb-3 pr-4 text-[10px] font-medium text-surface-400 uppercase tracking-wider">Email</th>
                <th className="pb-3 pr-4 text-[10px] font-medium text-surface-400 uppercase tracking-wider">Role</th>
                <th className="pb-3 text-[10px] font-medium text-surface-400 uppercase tracking-wider">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {[
                { name: 'Alex Chen', email: 'alex@acme.com', role: 'Admin', active: 'Now' },
                { name: 'Sarah Kim', email: 'sarah@acme.com', role: 'Security', active: '2h ago' },
                { name: 'James Park', email: 'james@acme.com', role: 'Developer', active: '1d ago' },
              ].map((m) => (
                <tr key={m.email} className="hover:bg-surface-50">
                  <td className="py-3 pr-4 text-sm text-surface-700">{m.name}</td>
                  <td className="py-3 pr-4 text-xs text-surface-500">{m.email}</td>
                  <td className="py-3 pr-4"><span className="badge-info">{m.role}</span></td>
                  <td className="py-3 text-xs text-surface-400">{m.active}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
