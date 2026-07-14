import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

export default function Terms() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-surface-200 py-4 px-6">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Link to="/"><Logo size="sm" /></Link>
          <Link to="/" className="text-sm text-surface-500 hover:text-surface-900">← Home</Link>
        </div>
      </nav>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-surface-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-surface-400 mb-10">Last updated: July 2026</p>

        <div className="prose prose-sm text-surface-600 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">1. Service Description</h2>
            <p>Buzrig provides autonomous AI-powered penetration testing services including vulnerability scanning, attack chain analysis, proof-of-concept generation, and automated code remediation via pull requests.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">2. Acceptable Use</h2>
            <p>You may only use Buzrig to test systems you own or have explicit written authorization to test. Unauthorized testing of third-party systems is prohibited and may result in immediate account termination.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">3. Authorization & Responsibility</h2>
            <p>By initiating a scan, you confirm you have legal authority to perform security testing on the target. You are responsible for ensuring scans comply with applicable laws and regulations in your jurisdiction.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">4. Service Availability</h2>
            <p>We target 99.9% uptime for our scanning infrastructure. Scheduled maintenance windows will be communicated at least 48 hours in advance. We are not liable for downtime caused by third-party providers.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">5. Limitation of Liability</h2>
            <p>Buzrig performs non-destructive security testing. However, we cannot guarantee zero impact on your systems. You acknowledge that security testing carries inherent risk and agree to hold Buzrig harmless for any unintended service disruption.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">6. Subscription & Billing</h2>
            <p>Subscriptions are billed monthly. You may cancel at any time. Upon cancellation, access continues until the end of the current billing period. No refunds for partial months.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">7. Intellectual Property</h2>
            <p>Generated remediation code is provided under MIT license — you own it. Vulnerability reports and scan data belong to your organization. Buzrig retains rights to its scanning algorithms and AI models.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">8. Contact</h2>
            <p>For questions about these terms: legal@buzrig.com</p>
          </section>
        </div>
      </div>
    </div>
  )
}
