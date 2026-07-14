import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Mail, CheckCircle, ArrowLeft } from 'lucide-react'
import Logo from '../components/Logo'

export default function Demo() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // For now, just mark as submitted (in production, this would email you)
    setTimeout(() => {
      setSubmitted(true)
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-surface-50 px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="flex justify-center mb-10">
          <Logo size="md" />
        </div>

        {submitted ? (
          <div className="rounded-xl border border-surface-200 bg-white p-12 shadow-sm text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle className="h-7 w-7 text-emerald-500" />
              </div>
            </div>
            <h1 className="text-xl font-semibold text-surface-900 mb-2">Request received!</h1>
            <p className="text-sm text-surface-500 mb-6">
              We'll get back to you within 24 hours to schedule a demo.
            </p>
            <Link to="/" className="text-sm text-brand-500 hover:text-brand-600 font-medium">
              ← Back to home
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-surface-200 bg-white p-8 md:p-12 shadow-sm">
            <div className="text-center mb-10">
              <h1 className="text-2xl font-bold text-surface-900 mb-2">Book a Demo</h1>
              <p className="text-sm text-surface-500">
                See how Buzrig can replace your annual pentest with continuous, AI-powered security testing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 shrink-0">
                  <Calendar className="h-4 w-4 text-brand-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-900">30-minute walkthrough</p>
                  <p className="text-xs text-surface-500">Live demo tailored to your stack</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 shrink-0">
                  <Mail className="h-4 w-4 text-brand-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-900">Response within 24h</p>
                  <p className="text-xs text-surface-500">Direct from our founding team</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1.5">Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="input-field" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1.5">Company</label>
                  <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" className="input-field" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1.5">Work email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="input-field" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1.5">What are you looking to solve?</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us about your security needs..." className="input-field min-h-[100px] resize-none" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                {loading ? 'Sending...' : 'Request Demo'}
              </button>
            </form>
          </div>
        )}

        <p className="mt-6 text-center">
          <Link to="/" className="text-sm text-surface-400 hover:text-surface-600 flex items-center justify-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
