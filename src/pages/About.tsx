import { Link } from 'react-router-dom'
import { Shield, Target, Zap, Users } from 'lucide-react'
import Logo from '../components/Logo'

const team = [
  {
    name: 'Abdul Mateen Riaz',
    role: 'Founder & CEO',
    bio: 'Building the future of autonomous security testing. Passionate about making enterprise-grade pentesting accessible to every engineering team.',
    linkedin: '#',
  },
]

const values = [
  { icon: Shield, title: 'Security First', description: 'We protect customer data with the same rigor we bring to finding vulnerabilities.' },
  { icon: Target, title: 'Zero False Positives', description: 'Every finding is verified with a proof-of-concept. We never waste your engineers\' time.' },
  { icon: Zap, title: 'Ship the Fix', description: 'Finding bugs is easy. We go further — generating production-ready code patches.' },
  { icon: Users, title: 'Developer Experience', description: 'Security tools should integrate into developer workflows, not create new ones.' },
]

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-surface-200 py-4 px-6">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <Link to="/"><Logo size="sm" /></Link>
          <Link to="/" className="text-sm text-surface-500 hover:text-surface-900">← Home</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-3">About Buzrig</p>
          <h1 className="text-3xl font-bold text-surface-900 mb-4">
            Replacing annual pentests with<br />continuous AI-powered security
          </h1>
          <p className="text-base text-surface-500 max-w-xl mx-auto leading-relaxed">
            We believe every company deserves the security testing quality of a top-tier researcher — continuously, not once a year. Buzrig makes that possible with AI.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-6 bg-surface-50 border-y border-surface-200">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-xl font-bold text-surface-900 text-center mb-12">Our Principles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((v) => (
              <div key={v.title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 border border-brand-100 shrink-0">
                  <v.icon className="h-5 w-5 text-brand-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-surface-900 mb-1">{v.title}</h3>
                  <p className="text-sm text-surface-500 leading-relaxed">{v.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-xl font-bold text-surface-900 text-center mb-12">Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {team.map((member) => (
              <div key={member.name} className="rounded-xl border border-surface-200 bg-white p-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 border border-surface-200 mx-auto mb-4">
                  <span className="text-xl font-bold text-surface-400">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-surface-900">{member.name}</h3>
                <p className="text-xs text-brand-500 font-medium mb-3">{member.role}</p>
                <p className="text-xs text-surface-500 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-surface-900">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Interested in what we're building?</h2>
          <p className="text-sm text-surface-400 mb-6">We're looking for design partners and early adopters.</p>
          <Link to="/demo" className="btn-primary">Book a Demo</Link>
        </div>
      </section>
    </div>
  )
}
