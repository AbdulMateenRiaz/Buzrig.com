import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  GitPullRequest,
  Brain,
  ArrowRight,
  CheckCircle,
  Lock,
  Scan,
  Terminal,
  Shield,
  Menu,
  X,
} from 'lucide-react'
import Logo from '../components/Logo'
import AnimatedTerminal from '../components/AnimatedTerminal'
import ComparisonTable from '../components/ComparisonTable'
import CountUp from '../components/CountUp'

const features = [
  { icon: Brain, title: 'Attack-Chain Reasoning', description: 'Chains low-severity findings into critical exploits using multi-step reasoning, just like a senior researcher.' },
  { icon: GitPullRequest, title: 'Auto-Remediation PRs', description: 'Verified vulnerabilities come with production-ready code fixes submitted directly as pull requests.' },
  { icon: Shield, title: 'Continuous Testing', description: 'Every deployment triggers automated security validation. No more gaps between annual engagements.' },
  { icon: Lock, title: 'Compliance Ready', description: 'Findings mapped to SOC 2, HIPAA, and PCI-DSS. Audit-ready reports generated instantly.' },
]

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-surface-200">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo size="sm" />
          <div className="hidden items-center gap-8 md:flex">
            <a href="#how-it-works" className="text-sm text-surface-500 hover:text-surface-900 transition-colors">Platform</a>
            <a href="#comparison" className="text-sm text-surface-500 hover:text-surface-900 transition-colors">Compare</a>
            <a href="#features" className="text-sm text-surface-500 hover:text-surface-900 transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-surface-500 hover:text-surface-900 transition-colors">Pricing</a>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-sm text-surface-600 hover:text-surface-900 transition-colors">Log In</Link>
            <Link to="/demo" className="btn-primary py-2 px-4 text-xs">Get a Demo</Link>
          </div>
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-lg p-2 text-surface-500 hover:bg-surface-100"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-surface-200 bg-white px-6 py-4 space-y-3">
            <a href="#how-it-works" className="block text-sm text-surface-600 py-2">Platform</a>
            <a href="#comparison" className="block text-sm text-surface-600 py-2">Compare</a>
            <a href="#features" className="block text-sm text-surface-600 py-2">Features</a>
            <a href="#pricing" className="block text-sm text-surface-600 py-2">Pricing</a>
            <div className="pt-3 border-t border-surface-200 flex gap-3">
              <Link to="/login" className="btn-secondary flex-1 text-xs">Log In</Link>
              <Link to="/demo" className="btn-primary flex-1 text-xs">Get a Demo</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — Copy */}
            <div>
              <p className="mb-4 text-xs font-semibold text-brand-500 uppercase tracking-widest">
                Autonomous Penetration Testing
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-surface-900 leading-[1.1]">
                Security testing that
                <br />
                <span className="bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">
                  actually fixes the code
                </span>
              </h1>
              <p className="mt-6 max-w-md text-base text-surface-500 leading-relaxed">
                Buzrig continuously discovers vulnerabilities, verifies them with proof-of-concept exploits, and opens pull requests with the fix.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/signup" className="btn-primary px-6 py-3 text-sm">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/app/dashboard" className="btn-secondary px-6 py-3 text-sm">
                  View Live Demo
                </Link>
              </div>
              <p className="mt-4 text-xs text-surface-400">
                No credit card · 14-day trial · SOC 2 compliant
              </p>
            </div>
            {/* Right — Animated Terminal */}
            <div className="hidden lg:block">
              <AnimatedTerminal />
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist CTA */}
      <section className="border-y border-surface-200 py-12 bg-surface-50">
        <div className="mx-auto max-w-xl px-6 text-center">
          <p className="text-xs font-medium text-surface-500 uppercase tracking-widest mb-3">
            Early Access
          </p>
          <h3 className="text-lg font-semibold text-surface-900 mb-2">Join 200+ teams on the waitlist</h3>
          <p className="text-sm text-surface-500 mb-6">Get early access and be the first to try new features.</p>
          <form className="flex gap-2 max-w-sm mx-auto" onSubmit={(e) => { e.preventDefault(); const btn = (e.target as HTMLFormElement).querySelector('button'); if(btn) btn.textContent = 'Added!'; }}>
            <input type="email" placeholder="you@company.com" className="input-field flex-1" required />
            <button type="submit" className="btn-primary text-xs whitespace-nowrap px-4">Join Waitlist</button>
          </form>
        </div>
      </section>

      {/* Stats with Count-Up */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-surface-900"><CountUp end={12000} suffix="+" /></p>
            <p className="text-xs text-surface-500 mt-1">Vulns Discovered</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-surface-900"><CountUp end={8400} suffix="+" /></p>
            <p className="text-xs text-surface-500 mt-1">Fixes Merged</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-surface-900">2.3h</p>
            <p className="text-xs text-surface-500 mt-1">Mean Time to Fix</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-surface-900">&lt;0.1%</p>
            <p className="text-xs text-surface-500 mt-1">False Positive Rate</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-28 px-6 border-t border-surface-200">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-3">Platform</p>
            <h2 className="text-3xl font-bold text-surface-900">From scan to merged fix in hours</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: '01', icon: Scan, title: 'Continuous Scanning', desc: 'Agent autonomously probes web apps, APIs, and cloud infrastructure 24/7.' },
              { step: '02', icon: Terminal, title: 'Verified Exploits', desc: 'Every finding includes a working proof-of-concept. Zero noise.' },
              { step: '03', icon: GitPullRequest, title: 'Auto-Fix PRs', desc: 'Production-ready remediation code submitted as a pull request.' },
            ].map((item) => (
              <div key={item.step}>
                <div className="text-4xl font-bold text-surface-200 mb-4">{item.step}</div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 border border-brand-100 mb-4">
                  <item.icon className="h-5 w-5 text-brand-500" />
                </div>
                <h3 className="text-base font-semibold text-surface-900 mb-2">{item.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section id="comparison" className="py-28 px-6 bg-surface-50 border-y border-surface-200">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-3">Why Buzrig</p>
            <h2 className="text-3xl font-bold text-surface-900">How we compare</h2>
            <p className="mt-3 text-sm text-surface-500">The differentiation is clear in 10 seconds.</p>
          </div>
          <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
            <ComparisonTable />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-3">Capabilities</p>
            <h2 className="text-3xl font-bold text-surface-900">Not a scanner. An AI researcher.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-surface-200 bg-white p-8 hover:shadow-md transition-shadow duration-200">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 border border-brand-100 mb-4">
                  <f.icon className="h-5 w-5 text-brand-500" />
                </div>
                <h3 className="text-base font-semibold text-surface-900 mb-2">{f.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-28 px-6 bg-surface-50 border-y border-surface-200">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-3xl font-bold text-surface-900">Simple, predictable pricing</h2>
            <p className="mt-3 text-surface-500 text-sm">Based on attack surface. No hidden fees.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Starter', price: '$499', features: ['3 targets', 'Weekly scans', 'Auto-fix PRs', 'Email alerts', 'SOC 2 reporting'], highlighted: false },
              { name: 'Professional', price: '$1,499', features: ['15 targets', 'Daily scans', 'Attack-chain AI', 'Multi-compliance', 'Slack + Jira integration', 'Priority support'], highlighted: true },
              { name: 'Enterprise', price: 'Custom', features: ['Unlimited targets', 'Continuous scanning', 'Custom exploit frameworks', 'Dedicated security analyst', 'On-prem deployment', 'SLA guarantees'], highlighted: false },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-xl border p-8 ${plan.highlighted ? 'border-brand-500 bg-white shadow-lg ring-1 ring-brand-100' : 'border-surface-200 bg-white'}`}>
                {plan.highlighted && <span className="inline-block mb-3 text-[10px] font-bold uppercase tracking-widest text-brand-500">Most Popular</span>}
                <h3 className="text-sm font-semibold text-surface-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-surface-900">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="text-sm text-surface-400">/mo</span>}
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-surface-600">
                      <CheckCircle className="h-3.5 w-3.5 text-accent-500 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link to={plan.price === 'Custom' ? '/demo' : '/signup'} className={`mt-8 w-full rounded-lg py-2.5 text-sm font-semibold transition-all block text-center ${plan.highlighted ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm' : 'border border-surface-300 text-surface-700 hover:bg-surface-100'}`}>
                  {plan.price === 'Custom' ? 'Contact Sales' : 'Start Trial'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-28 px-6">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl font-bold text-surface-900">Common questions</h2>
          </div>
          <div className="space-y-6">
            {[
              {
                q: 'How is Buzrig different from Nessus, Qualys, or other scanners?',
                a: 'Traditional scanners find known CVEs and produce noisy reports with 30-60% false positive rates. Buzrig thinks like a human penetration tester - it chains vulnerabilities together, tests business logic, verifies every finding with a proof-of-concept, and submits the actual code fix as a pull request.',
              },
              {
                q: 'Is it safe to run on production systems?',
                a: 'Yes. Buzrig uses non-destructive testing techniques only. We never modify data, drop tables, or cause service disruption. All payloads are designed to prove exploitability without causing damage. We rate-limit requests to prevent any performance impact.',
              },
              {
                q: 'How does the AI generate code fixes?',
                a: 'When a vulnerability is verified, our AI analyzes the vulnerable code pattern, the exploit mechanism, and security best practices to generate a minimal, production-ready patch. It produces a complete pull request with explanation, risk assessment, and suggested test.',
              },
              {
                q: 'What compliance frameworks do you support?',
                a: 'We map findings to SOC 2 Type II, PCI-DSS v4.0, and HIPAA controls. Compliance reports are generated on demand and are designed to be audit-ready, accepted by major auditors.',
              },
              {
                q: 'How long does the first scan take?',
                a: 'Typically 1-4 hours depending on the size of your attack surface. You will receive findings in real-time as they are discovered - no waiting for the full scan to complete.',
              },
              {
                q: 'Do I need to install anything?',
                a: 'No. Buzrig is fully cloud-based and tests your applications externally, the same way an attacker would. For source code scanning, you connect your GitHub/GitLab repo via OAuth - no agents required.',
              },
            ].map((item) => (
              <div key={item.q} className="rounded-xl border border-surface-200 bg-white p-6">
                <h3 className="text-sm font-semibold text-surface-900 mb-2">{item.q}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 bg-surface-900">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white">Replace your annual pentest</h2>
          <p className="mt-4 text-surface-400 text-sm">Continuous security testing with automated code remediation.</p>
          <Link to="/signup" className="btn-primary mt-8 px-8 py-3 text-sm">
            Start Free Trial
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer with trust badges */}
      <footer className="border-t border-surface-200 py-12 px-6 bg-white">
        <div className="mx-auto max-w-6xl">
          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-8 pb-8 border-b border-surface-200">
            {['SOC 2 Type II', 'ISO 27001', 'GDPR', 'HIPAA'].map((badge) => (
              <div key={badge} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-200 bg-surface-50">
                <Shield className="h-3.5 w-3.5 text-surface-400" />
                <span className="text-[11px] font-medium text-surface-500">{badge}</span>
              </div>
            ))}
          </div>
          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <div className="flex items-center gap-6 text-xs text-surface-400">
              <Link to="/privacy" className="hover:text-surface-600 transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-surface-600 transition-colors">Terms</Link>
              <Link to="/security" className="hover:text-surface-600 transition-colors">Security</Link>
              <Link to="/about" className="hover:text-surface-600 transition-colors">About</Link>
              <Link to="/demo" className="hover:text-surface-600 transition-colors">Contact</Link>
            </div>
            <p className="text-xs text-surface-400">© 2024 Buzrig Inc.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
