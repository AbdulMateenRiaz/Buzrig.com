import { useState, useEffect } from 'react'
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import EmptyState from '../components/EmptyState'

const mockChains = [
  {
    id: 'AC-001', name: 'IDOR → SSRF → Full Database Access', impact: 'Complete database exfiltration', finalSeverity: 'CRITICAL', status: 'ACTIVE',
    summary: 'An IDOR on the invoice endpoint leaks internal URLs. These feed into an SSRF in the PDF generator, accessing the cloud metadata service and extracting database credentials.',
    nodes: [
      { vulnerability: { title: 'IDOR on /api/invoices', severity: 'MEDIUM', category: 'Access Control' } },
      { vulnerability: { title: 'SSRF in PDF Generator', severity: 'MEDIUM', category: 'SSRF' } },
      { vulnerability: { title: 'Metadata Access', severity: 'HIGH', category: 'Info Disclosure' } },
      { vulnerability: { title: 'DB Credential Theft', severity: 'CRITICAL', category: 'Credentials' } },
    ],
  },
  {
    id: 'AC-002', name: 'Weak JWT → Token Forge → Admin Takeover', impact: 'Full admin access', finalSeverity: 'CRITICAL', status: 'ACTIVE',
    summary: 'JWT secret is crackable in seconds. Forged admin tokens bypass role validation on admin endpoints.',
    nodes: [
      { vulnerability: { title: 'Weak JWT Secret', severity: 'HIGH', category: 'Cryptography' } },
      { vulnerability: { title: 'Token Forgery', severity: 'HIGH', category: 'Auth Bypass' } },
      { vulnerability: { title: 'Admin API Access', severity: 'CRITICAL', category: 'Escalation' } },
    ],
  },
]

function getNodeBg(severity: string) {
  switch (severity) {
    case 'CRITICAL': return 'border-red-200 bg-red-50'
    case 'HIGH': return 'border-orange-200 bg-orange-50'
    case 'MEDIUM': return 'border-amber-200 bg-amber-50'
    default: return 'border-surface-200 bg-surface-50'
  }
}

function getNodeText(severity: string) {
  switch (severity) {
    case 'CRITICAL': return 'text-red-700'
    case 'HIGH': return 'text-orange-700'
    case 'MEDIUM': return 'text-amber-700'
    default: return 'text-surface-600'
  }
}

export default function AttackChain() {
  const [chains, setChains] = useState<any[]>(mockChains)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getAttackChains().then((res) => {
      if (res.success && res.data && res.data.length > 0) setChains(res.data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-lg font-semibold text-surface-900">Attack Chains</h1>
        <p className="text-xs text-surface-500 mt-0.5">Multi-step exploit paths</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card py-5 text-center">
          <p className="text-2xl font-bold text-brand-500">{chains.length}</p>
          <p className="text-[11px] text-surface-500 mt-1">Active Chains</p>
        </div>
        <div className="card py-5 text-center">
          <p className="text-2xl font-bold text-orange-500">{chains.reduce((a, c) => a + (c.nodes?.length || 0), 0)}</p>
          <p className="text-[11px] text-surface-500 mt-1">Linked Vulns</p>
        </div>
        <div className="card py-5 text-center">
          <p className="text-2xl font-bold text-emerald-500">2</p>
          <p className="text-[11px] text-surface-500 mt-1">Resolved (30d)</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-surface-400" /></div>
      ) : chains.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No attack chains discovered" description="Attack chains are auto-discovered after scans complete" />
      ) : (
        <div className="space-y-4">
          {chains.map((chain) => (
            <div key={chain.id} className="card">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <AlertTriangle className={`h-4 w-4 ${chain.finalSeverity === 'CRITICAL' ? 'text-brand-500' : 'text-orange-500'}`} />
                    <h3 className="text-sm font-semibold text-surface-900">{chain.name}</h3>
                    <span className={chain.finalSeverity === 'CRITICAL' ? 'badge-critical' : 'badge-high'}>{(chain.finalSeverity || '').toLowerCase()}</span>
                  </div>
                  <p className="text-xs text-surface-500">{chain.impact}</p>
                </div>
                <span className="text-[11px] text-surface-400 font-mono">{chain.id?.slice(0, 8)}</span>
              </div>

              <div className="overflow-x-auto mb-5">
                <div className="flex items-center gap-2 min-w-max py-2">
                  {(chain.nodes || []).map((node: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className={`rounded-lg border p-4 min-w-[160px] max-w-[180px] ${getNodeBg(node.vulnerability?.severity || '')}`}>
                        <span className={`text-[10px] font-medium uppercase tracking-wider block mb-1 ${getNodeText(node.vulnerability?.severity || '')}`}>{node.vulnerability?.category || ''}</span>
                        <p className={`text-xs font-medium ${getNodeText(node.vulnerability?.severity || '')}`}>{node.vulnerability?.title || ''}</p>
                      </div>
                      {idx < (chain.nodes?.length || 0) - 1 && <ArrowRight className="h-4 w-4 text-surface-300 shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>

              {chain.summary && (
                <div className="rounded-lg bg-surface-50 border border-surface-200 p-4">
                  <p className="text-[10px] font-medium text-surface-400 uppercase tracking-wider mb-1">AI Analysis</p>
                  <p className="text-xs text-surface-600 leading-relaxed">{chain.summary || chain.aiAnalysis}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
