import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-surface-200 py-4 px-6">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Link to="/"><Logo size="sm" /></Link>
          <Link to="/" className="text-sm text-surface-500 hover:text-surface-900">← Home</Link>
        </div>
      </nav>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-surface-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-surface-400 mb-10">Last updated: July 2026</p>

        <div className="prose prose-sm text-surface-600 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly: name, email, company name when you create an account. We also collect usage data including scan results, vulnerability findings, and remediation activity within your organization's workspace.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">2. How We Use Your Information</h2>
            <p>We use your information to provide and improve our security testing services, generate vulnerability reports, create remediation code, and communicate with you about your account and our services.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">3. Data Security</h2>
            <p>All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Scan results and vulnerability data are isolated per organization. We never share your security findings with third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">4. Data Retention</h2>
            <p>We retain your data for the duration of your subscription. Upon account deletion, all associated data including scan results, vulnerabilities, and remediation history is permanently deleted within 30 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">5. Third-Party Services</h2>
            <p>We integrate with GitHub (for pull request creation), OpenAI (for remediation code generation — no customer data is stored by OpenAI), and Stripe (for payment processing).</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">6. Your Rights</h2>
            <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us at privacy@buzrig.com. EU/UK users have additional rights under GDPR.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-surface-900 mb-3">7. Contact</h2>
            <p>For privacy-related inquiries: privacy@buzrig.com</p>
          </section>
        </div>
      </div>
    </div>
  )
}
