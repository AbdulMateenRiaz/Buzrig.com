import { useState } from 'react'
import { Globe, Key, Bell, Users, Webhook, Plus, Trash2, CheckCircle } from 'lucide-react'
import { useAuth } from '../lib/auth'

export default function Settings() {
  const { user, org } = useAuth()
  const [activeTab, setActiveTab] = useState('targets')

  const tabs = [
    { id: 'targets', label: 'Targets', icon: Globe },
    { id: 'integrations', label: 'Integrations', icon: Webhook },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'api', label: 'API Keys', icon: Key },
  ]

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-surface-900">Settings</h1>
        <p className="text-xs text-surface-500 mt-0.5">
          Manage your organization: <span className="font-medium text-surface-700">{org?.name || 'My Team'}</span>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-surface-500 hover:text-surface-700'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="page-enter">
        {activeTab === 'targets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-surface-600">Add the domains, APIs, and repos you want to scan.</p>
              <button className="btn-primary text-xs"><Plus className="h-3.5 w-3.5" />Add Target</button>
            </div>
            {['api.acme.com', 'app.acme.com', 'auth.acme.com'].map((t) => (
              <div key={t} className="flex items-center justify-between rounded-xl border border-surface-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-surface-400" />
                  <div>
                    <p className="font-mono text-sm text-surface-900">{t}</p>
                    <p className="text-[11px] text-surface-400">Web Application - Production</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-medium text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded">Active</span>
                  <button className="text-surface-300 hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="space-y-4">
            <p className="text-sm text-surface-600">Connect your tools to receive alerts and auto-create tickets.</p>
            {[
              { name: 'GitHub', desc: 'Auto-create PRs with fixes', connected: true },
              { name: 'Slack', desc: 'Real-time vulnerability alerts', connected: true },
              { name: 'Jira', desc: 'Create tickets for findings', connected: false },
              { name: 'PagerDuty', desc: 'Critical finding on-call alerts', connected: false },
            ].map((i) => (
              <div key={i.name} className="flex items-center justify-between rounded-xl border border-surface-200 bg-white px-5 py-4 shadow-sm">
                <div>
                  <p className="text-sm font-medium text-surface-900">{i.name}</p>
                  <p className="text-[11px] text-surface-400">{i.desc}</p>
                </div>
                {i.connected ? (
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-500">
                    <CheckCircle className="h-3.5 w-3.5" />Connected
                  </span>
                ) : (
                  <button className="btn-secondary text-xs py-1.5 px-3">Connect</button>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-surface-600">Manage who has access to your organization.</p>
              <button className="btn-primary text-xs"><Plus className="h-3.5 w-3.5" />Invite Member</button>
            </div>
            <div className="rounded-xl border border-surface-200 bg-white shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-100 bg-surface-50">
                    <th className="text-left px-5 py-3 text-[10px] font-medium text-surface-500 uppercase tracking-wider">Member</th>
                    <th className="text-left px-5 py-3 text-[10px] font-medium text-surface-500 uppercase tracking-wider">Role</th>
                    <th className="text-left px-5 py-3 text-[10px] font-medium text-surface-500 uppercase tracking-wider">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  <tr>
                    <td className="px-5 py-3">
                      <p className="text-sm text-surface-900">{user?.firstName} {user?.lastName}</p>
                      <p className="text-[11px] text-surface-400">{user?.email}</p>
                    </td>
                    <td className="px-5 py-3"><span className="badge-info">Owner</span></td>
                    <td className="px-5 py-3 text-xs text-surface-400">Now</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <p className="text-sm text-surface-600">Choose what alerts you receive and how.</p>
            {[
              { label: 'Critical vulnerabilities', desc: 'Get alerted immediately when critical findings are discovered', on: true },
              { label: 'High vulnerabilities', desc: 'Alert within 1 hour of discovery', on: true },
              { label: 'Remediation PRs', desc: 'Notify when a fix PR is auto-generated', on: true },
              { label: 'Scan completions', desc: 'Summary email when a scan finishes', on: false },
              { label: 'Weekly digest', desc: 'Weekly summary of security posture', on: false },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between rounded-xl border border-surface-200 bg-white px-5 py-4 shadow-sm">
                <div>
                  <p className="text-sm font-medium text-surface-900">{n.label}</p>
                  <p className="text-[11px] text-surface-400">{n.desc}</p>
                </div>
                <div className={`h-5 w-9 rounded-full transition-colors relative cursor-pointer ${n.on ? 'bg-brand-500' : 'bg-surface-300'}`}>
                  <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${n.on ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-surface-600">API keys for programmatic access to Buzrig.</p>
              <button className="btn-primary text-xs"><Plus className="h-3.5 w-3.5" />Generate Key</button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-surface-200 bg-white px-5 py-4 shadow-sm">
              <div>
                <p className="text-sm font-medium text-surface-900">Production Key</p>
                <p className="font-mono text-[11px] text-surface-400">pk_live_••••••••••••3a9f</p>
                <p className="text-[10px] text-surface-400 mt-1">Created Jul 14, 2026</p>
              </div>
              <button className="text-[11px] text-red-500 hover:text-red-600 font-medium">Revoke</button>
            </div>
            <div className="rounded-xl border border-surface-200 bg-surface-50 p-5">
              <p className="text-xs text-surface-500 leading-relaxed">
                API keys give full access to your organization data. Keep them secret. Use environment variables, never commit to code.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
