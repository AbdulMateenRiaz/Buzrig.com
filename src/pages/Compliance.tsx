import { ShieldCheck, CheckCircle, AlertCircle, XCircle, Download } from 'lucide-react'

const frameworks = [
  { name: 'SOC 2 Type II', controls: 42, passing: 38, failing: 2, warning: 2 },
  { name: 'PCI-DSS v4.0', controls: 78, passing: 70, failing: 4, warning: 4 },
  { name: 'HIPAA', controls: 54, passing: 50, failing: 1, warning: 3 },
]

const controls = [
  { id: 'CC6.1', framework: 'SOC 2', name: 'Logical Access Controls', status: 'pass', findings: 0 },
  { id: 'CC7.2', framework: 'SOC 2', name: 'System Monitoring', status: 'warning', findings: 1 },
  { id: 'Req-6.4', framework: 'PCI-DSS', name: 'Coding Vulnerabilities', status: 'fail', findings: 3 },
  { id: 'Req-11.3', framework: 'PCI-DSS', name: 'Penetration Testing', status: 'pass', findings: 0 },
  { id: '164.312(a)', framework: 'HIPAA', name: 'Access Control', status: 'fail', findings: 2 },
]

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'pass': return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
    case 'warning': return <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
    case 'fail': return <XCircle className="h-3.5 w-3.5 text-brand-500" />
    default: return <AlertCircle className="h-3.5 w-3.5 text-surface-400" />
  }
}

export default function Compliance() {
  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-surface-900">Compliance</h1>
          <p className="text-xs text-surface-500 mt-0.5">Continuous compliance mapping</p>
        </div>
        <button className="btn-secondary text-xs"><Download className="h-3.5 w-3.5" />Export</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {frameworks.map((fw) => {
          const pct = Math.round((fw.passing / fw.controls) * 100)
          return (
            <div key={fw.name} className="card">
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

      <div className="card">
        <h3 className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-4">Controls</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 text-left">
              <th className="pb-3 pr-4 w-8"></th>
              <th className="pb-3 pr-4 text-[10px] font-medium text-surface-400 uppercase tracking-wider">ID</th>
              <th className="pb-3 pr-4 text-[10px] font-medium text-surface-400 uppercase tracking-wider">Framework</th>
              <th className="pb-3 pr-4 text-[10px] font-medium text-surface-400 uppercase tracking-wider">Control</th>
              <th className="pb-3 text-[10px] font-medium text-surface-400 uppercase tracking-wider">Findings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {controls.map((c) => (
              <tr key={c.id} className="hover:bg-surface-50 transition-colors">
                <td className="py-3 pr-4"><StatusIcon status={c.status} /></td>
                <td className="py-3 pr-4 font-mono text-xs text-surface-500">{c.id}</td>
                <td className="py-3 pr-4 text-xs text-surface-400">{c.framework}</td>
                <td className="py-3 pr-4 text-sm text-surface-700">{c.name}</td>
                <td className="py-3 text-xs">{c.findings > 0 ? <span className="text-brand-500 font-medium">{c.findings}</span> : <span className="text-surface-300">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
