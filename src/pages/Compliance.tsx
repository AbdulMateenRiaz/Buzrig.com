import { useState, useEffect } from 'react'
import { ShieldCheck, CheckCircle, AlertCircle, XCircle, Download, Loader2 } from 'lucide-react'
import { api } from '../lib/api'

const mockFrameworks = [
  { id: '1', name: 'SOC 2 Type II', totalControls: 42, passing: 38, failing: 2, warning: 2, compliancePercent: 90 },
  { id: '2', name: 'PCI-DSS v4.0', totalControls: 78, passing: 70, failing: 4, warning: 4, compliancePercent: 90 },
  { id: '3', name: 'HIPAA', totalControls: 54, passing: 50, failing: 1, warning: 3, compliancePercent: 93 },
]

export default function Compliance() {
  const [frameworks, setFrameworks] = useState<any[]>(mockFrameworks)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getComplianceFrameworks().then((res) => {
      if (res.success && res.data && res.data.length > 0) setFrameworks(res.data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-surface-900">Compliance</h1>
          <p className="text-xs text-surface-500 mt-0.5">Continuous compliance mapping</p>
        </div>
        <button className="btn-secondary text-xs"><Download className="h-3.5 w-3.5" />Export</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-surface-400" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {frameworks.map((fw) => {
            const pct = fw.compliancePercent ?? Math.round((fw.passing / fw.totalControls) * 100)
            return (
              <div key={fw.id || fw.name} className="card">
                <div className="flex items-center gap-2.5 mb-5">
                  <ShieldCheck className="h-4 w-4 text-brand-500" />
                  <h3 className="text-sm font-medium text-surface-900">{fw.name}</h3>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-surface-500">Compliance</span>
                    <span className="text-surface-900 font-semibold">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-200 overflow-hidden">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-emerald-500"><CheckCircle className="h-3 w-3" />{fw.passing}</span>
                  <span className="flex items-center gap-1 text-brand-500"><XCircle className="h-3 w-3" />{fw.failing}</span>
                  <span className="flex items-center gap-1 text-amber-500"><AlertCircle className="h-3 w-3" />{fw.warning}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
