import { AlertTriangle, ArrowRight, Database, Key, Globe, Shield } from 'lucide-react'

interface ChainNode {
  id: string
  label: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: string
  icon: typeof Globe
}

interface AttackChainData {
  id: string
  name: string
  impact: string
  finalSeverity: 'critical' | 'high'
  nodes: ChainNode[]
  summary: string
}

const attackChains: AttackChainData[] = [
  {
    id: 'AC-001',
    name: 'IDOR → SSRF → Full Database Access',
    impact: 'Complete database exfiltration via chained issues',
    finalSeverity: 'critical',
    summary: 'An IDOR on the invoice endpoint leaks internal URLs. These feed into an SSRF in the PDF generator, accessing the cloud metadata service and extracting database credentials.',
    nodes: [
      { id: '1', label: 'IDOR on /api/invoices', severity: 'medium', type: 'Access Control', icon: Key },
      { id: '2', label: 'SSRF in PDF Generator', severity: 'medium', type: 'SSRF', icon: Globe },
      { id: '3', label: 'Metadata Access', severity: 'high', type: 'Info Disclosure', icon: Shield },
      { id: '4', label: 'DB Credential Theft', severity: 'critical', type: 'Credentials', icon: Database },
    ],
  },
  {
    id: 'AC-002',
    name: 'Weak JWT → Token Forge → Admin Takeover',
    impact: 'Full admin access from unauthenticated state',
    finalSeverity: 'critical',
    summary: 'JWT secret is crackable in seconds. Forged admin tokens bypass role validation on admin endpoints.',
    nodes: [
      { id: '1', label: 'Weak JWT Secret', severity: 'high', type: 'Cryptography', icon: Key },
      { id: '2', label: 'Token Forgery', severity: 'high', type: 'Auth Bypass', icon: Shield },
      { id: '3', label: 'Admin API Access', severity: 'critical', type: 'Escalation', icon: Database },
    ],
  },
]

function getNodeBg(severity: string) {
  switch (severity) {
    case 'critical': return 'border-red-200 bg-red-50'
    case 'high': return 'border-orange-200 bg-orange-50'
    case 'medium': return 'border-amber-200 bg-amber-50'
    case 'low': return 'border-sky-200 bg-sky-50'
    default: return 'border-surface-200 bg-surface-50'
  }
}

function getNodeText(severity: string) {
  switch (severity) {
    case 'critical': return 'text-red-700'
    case 'high': return 'text-orange-700'
    case 'medium': return 'text-amber-700'
    case 'low': return 'text-sky-700'
    default: return 'text-surface-600'
  }
}

export default function AttackChain() {
  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-lg font-semibold text-surface-900">Attack Chains</h1>
        <p className="text-xs text-surface-500 mt-0.5">Multi-step exploit paths</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card py-5 text-center">
          <p className="text-2xl font-bold text-brand-500">{attackChains.length}</p>
          <p className="text-[11px] text-surface-500 mt-1">Active Chains</p>
        </div>
        <div className="card py-5 text-center">
          <p className="text-2xl font-bold text-orange-500">{attackChains.reduce((a, c) => a + c.nodes.length, 0)}</p>
          <p className="text-[11px] text-surface-500 mt-1">Linked Vulns</p>
        </div>
        <div className="card py-5 text-center">
          <p className="text-2xl font-bold text-emerald-500">2</p>
          <p className="text-[11px] text-surface-500 mt-1">Resolved (30d)</p>
        </div>
      </div>

      <div className="space-y-4">
        {attackChains.map((chain) => (
          <div key={chain.id} className="card">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <AlertTriangle className={`h-4 w-4 ${chain.finalSeverity === 'critical' ? 'text-brand-500' : 'text-orange-500'}`} />
                  <h3 className="text-sm font-semibold text-surface-900">{chain.name}</h3>
                  <span className={chain.finalSeverity === 'critical' ? 'badge-critical' : 'badge-high'}>{chain.finalSeverity}</span>
                </div>
                <p className="text-xs text-surface-500">{chain.impact}</p>
              </div>
              <span className="text-[11px] text-surface-400 font-mono">{chain.id}</span>
            </div>

            <div className="overflow-x-auto mb-5">
              <div className="flex items-center gap-2 min-w-max py-2">
                {chain.nodes.map((node, idx) => (
                  <div key={node.id} className="flex items-center gap-2">
                    <div className={`rounded-lg border p-4 min-w-[160px] max-w-[180px] ${getNodeBg(node.severity)}`}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <node.icon className={`h-3 w-3 ${getNodeText(node.severity)}`} />
                        <span className={`text-[10px] font-medium uppercase tracking-wider ${getNodeText(node.severity)}`}>{node.type}</span>
                      </div>
                      <p className={`text-xs font-medium ${getNodeText(node.severity)}`}>{node.label}</p>
                    </div>
                    {idx < chain.nodes.length - 1 && <ArrowRight className="h-4 w-4 text-surface-300 shrink-0" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-surface-50 border border-surface-200 p-4">
              <p className="text-[10px] font-medium text-surface-400 uppercase tracking-wider mb-1">AI Analysis</p>
              <p className="text-xs text-surface-600 leading-relaxed">{chain.summary}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
