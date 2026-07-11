import { Play, Pause, RotateCcw, Plus, Globe, Server, Code } from 'lucide-react'

const scans = [
  { id: 'SCN-042', target: 'api.acme.com', type: 'Web App', status: 'running', progress: 67, findings: 3, started: '14:32 today', icon: Globe },
  { id: 'SCN-041', target: 'app.acme.com', type: 'Web App', status: 'running', progress: 89, findings: 7, started: '12:01 today', icon: Globe },
  { id: 'SCN-040', target: 'auth.acme.com', type: 'API', status: 'completed', progress: 100, findings: 2, started: '09:00 today', icon: Server },
  { id: 'SCN-039', target: 'acme/backend', type: 'Source', status: 'completed', progress: 100, findings: 5, started: 'Yesterday', icon: Code },
  { id: 'SCN-038', target: 'staging.acme.com', type: 'Web App', status: 'paused', progress: 34, findings: 1, started: 'Yesterday', icon: Globe },
]

function getStatusColor(status: string) {
  switch (status) {
    case 'running': return 'text-accent-500'
    case 'completed': return 'text-surface-400'
    case 'paused': return 'text-amber-500'
    default: return 'text-surface-400'
  }
}

function getBarColor(status: string) {
  switch (status) {
    case 'running': return 'bg-brand-500'
    case 'completed': return 'bg-surface-300'
    case 'paused': return 'bg-amber-400'
    default: return 'bg-surface-300'
  }
}

export default function Scans() {
  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-surface-900">Scans</h1>
          <p className="text-xs text-surface-500 mt-0.5">Active penetration testing scans</p>
        </div>
        <button className="btn-primary text-xs"><Plus className="h-3.5 w-3.5" />New Scan</button>
      </div>

      <div className="space-y-2">
        {scans.map((scan) => (
          <div key={scan.id} className="card flex items-center gap-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-100 border border-surface-200">
              <scan.icon className="h-4 w-4 text-surface-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-surface-900 truncate">{scan.target}</p>
                <span className="text-[10px] text-surface-400 bg-surface-100 px-1.5 py-0.5 rounded">{scan.type}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-surface-400 mt-0.5">
                <span className="font-mono">{scan.id}</span>
                <span>{scan.started}</span>
                <span>{scan.findings} findings</span>
              </div>
            </div>
            <div className="w-32">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className={getStatusColor(scan.status)}>{scan.status}</span>
                <span className="text-surface-400">{scan.progress}%</span>
              </div>
              <div className="h-1 rounded-full bg-surface-200 overflow-hidden">
                <div className={`h-full rounded-full ${getBarColor(scan.status)}`} style={{ width: `${scan.progress}%` }} />
              </div>
            </div>
            <div>
              {scan.status === 'running' && <button className="rounded p-1.5 text-surface-400 hover:text-surface-700"><Pause className="h-3.5 w-3.5" /></button>}
              {scan.status === 'paused' && <button className="rounded p-1.5 text-surface-400 hover:text-accent-500"><Play className="h-3.5 w-3.5" /></button>}
              {scan.status === 'completed' && <button className="rounded p-1.5 text-surface-400 hover:text-surface-700"><RotateCcw className="h-3.5 w-3.5" /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
