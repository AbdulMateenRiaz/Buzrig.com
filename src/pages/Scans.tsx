import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Plus, Globe, Server, Code, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import EmptyState from '../components/EmptyState'

const mockScans = [
  { id: 'SCN-042', target: { value: 'api.acme.com', type: 'API_ENDPOINT' }, scanType: 'FULL', status: 'RUNNING', progress: 67, findingsCount: 3, createdAt: '2024-06-15T14:32:00Z' },
  { id: 'SCN-041', target: { value: 'app.acme.com', type: 'WEB_APPLICATION' }, scanType: 'FULL', status: 'RUNNING', progress: 89, findingsCount: 7, createdAt: '2024-06-15T12:01:00Z' },
  { id: 'SCN-040', target: { value: 'auth.acme.com', type: 'API_ENDPOINT' }, scanType: 'OWASP_TOP_10', status: 'COMPLETED', progress: 100, findingsCount: 2, createdAt: '2024-06-15T09:00:00Z' },
]

function getIcon(type: string) {
  if (type === 'API_ENDPOINT') return Server
  if (type === 'SOURCE_CODE') return Code
  return Globe
}

function getStatusColor(status: string) {
  switch (status) {
    case 'RUNNING': return 'text-accent-500'
    case 'COMPLETED': return 'text-surface-400'
    case 'PAUSED': return 'text-amber-500'
    case 'QUEUED': return 'text-blue-500'
    default: return 'text-surface-400'
  }
}

function getBarColor(status: string) {
  switch (status) {
    case 'RUNNING': return 'bg-brand-500'
    case 'COMPLETED': return 'bg-surface-300'
    case 'PAUSED': return 'bg-amber-400'
    default: return 'bg-surface-300'
  }
}

export default function Scans() {
  const [scans, setScans] = useState<any[]>(mockScans)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getScans().then((res) => {
      if (res.success && res.data && res.data.length > 0) setScans(res.data)
      setLoading(false)
    })
  }, [])

  const handlePause = async (id: string) => {
    await api.pauseScan(id)
    setScans((prev) => prev.map((s) => s.id === id ? { ...s, status: 'PAUSED' } : s))
  }

  const handleResume = async (id: string) => {
    await api.resumeScan(id)
    setScans((prev) => prev.map((s) => s.id === id ? { ...s, status: 'RUNNING' } : s))
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-surface-900">Scans</h1>
          <p className="text-xs text-surface-500 mt-0.5">Active penetration testing scans</p>
        </div>
        <button className="btn-primary text-xs"><Plus className="h-3.5 w-3.5" />New Scan</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-surface-400" /></div>
      ) : scans.length === 0 ? (
        <EmptyState icon={Globe} title="No scans yet" description="Start your first scan to discover vulnerabilities" actionLabel="New Scan" onAction={() => {}} />
      ) : (
        <div className="space-y-2">
          {scans.map((scan) => {
            const Icon = getIcon(scan.target?.type || '')
            return (
              <div key={scan.id} className="card flex items-center gap-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-100 border border-surface-200">
                  <Icon className="h-4 w-4 text-surface-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-surface-900 truncate">{scan.target?.value || scan.target}</p>
                    <span className="text-[10px] text-surface-400 bg-surface-100 px-1.5 py-0.5 rounded">{scan.scanType || 'FULL'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-surface-400 mt-0.5">
                    <span className="font-mono">{scan.id?.slice(0, 8)}</span>
                    <span>{scan.findingsCount} findings</span>
                  </div>
                </div>
                <div className="w-32">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className={getStatusColor(scan.status)}>{scan.status?.toLowerCase()}</span>
                    <span className="text-surface-400">{scan.progress}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-surface-200 overflow-hidden">
                    <div className={`h-full rounded-full ${getBarColor(scan.status)}`} style={{ width: `${scan.progress}%` }} />
                  </div>
                </div>
                <div>
                  {scan.status === 'RUNNING' && <button onClick={() => handlePause(scan.id)} className="rounded p-1.5 text-surface-400 hover:text-surface-700"><Pause className="h-3.5 w-3.5" /></button>}
                  {scan.status === 'PAUSED' && <button onClick={() => handleResume(scan.id)} className="rounded p-1.5 text-surface-400 hover:text-accent-500"><Play className="h-3.5 w-3.5" /></button>}
                  {scan.status === 'COMPLETED' && <button className="rounded p-1.5 text-surface-400 hover:text-surface-700"><RotateCcw className="h-3.5 w-3.5" /></button>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
