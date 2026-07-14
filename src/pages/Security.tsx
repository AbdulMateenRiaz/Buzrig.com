import { Link } from 'react-router-dom'
import { Shield, Lock, Eye, Server, Key, CheckCircle } from 'lucide-react'
import Logo from '../components/Logo'

const practices = [
  { icon: Lock, title: 'Encryption', description: 'All data encrypted at rest (AES-256) and in transit (TLS 1.3). Database connections use SSL.' },
  { icon: Eye, title: 'Access Control', description: 'Role-based access control with organization-level isolation. API keys are hashed, never stored in plaintext.' },
  { icon: Server, title: 'Infrastructure', description: 'Hosted on SOC 2 compliant infrastructure. Automated backups every 6 hours with point-in-time recovery.' },
  { icon: Key, title: 'Authentication', description: 'bcrypt password hashing (12 rounds). JWT tokens with 15-minute expiry. Refresh token rotation on every use.' },
  { icon: Shield, title: 'Non-Destructive Scanning', description: 'Our scanner never modifies data, drops tables, or causes service disruption. All payloads are designed to be safe.' },
  { icon: CheckCircle, title: 'Audit Logging', description: 'Immutable audit trail of all actions. Every scan, login, and configuration change is logged and retained.' },
]

export default function Security() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-surface-200 py-4 px-6">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <Link to="/"><Logo size="sm" /></Link>
          <Link to="/" className="text-sm text-surface-500 hover:text-surface-900">← Home</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-3">Security</p>
          <h1 className="text-3xl font-bold text-surface-900 mb-3">How we protect your data</h1>
          <p className="text-sm text-surface-500 max-w-lg mx-auto">
            We practice what we preach. Security is core to everything we build.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {practices.map((p) => (
            <div key={p.title} className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 border border-brand-100 shrink-0">
                <p.icon className="h-5 w-5 text-brand-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-surface-900 mb-1">{p.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{p.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-surface-200 bg-surface-50 p-8 text-center">
          <h2 className="text-lg font-semibold text-surface-900 mb-2">Report a Vulnerability</h2>
          <p className="text-sm text-surface-500 mb-4">
            Found a security issue in Buzrig? We appreciate responsible disclosure.
          </p>
          <a href="mailto:security@buzrig.com" className="text-sm text-brand-500 hover:text-brand-600 font-medium">
            security@buzrig.com
          </a>
        </div>
      </div>
    </div>
  )
}
