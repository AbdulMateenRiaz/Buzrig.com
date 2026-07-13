import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import Logo from '../components/Logo'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success) {
        setSubmitted(true)
      } else {
        setError(data.error?.message || 'Something went wrong')
      }
    } catch {
      setError('Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <Logo size="md" />
        </div>

        <div className="rounded-xl border border-surface-200 bg-white p-8 shadow-sm">
          {submitted ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                  <Mail className="h-6 w-6 text-brand-500" />
                </div>
              </div>
              <h1 className="text-lg font-semibold text-surface-900 mb-2">Check your email</h1>
              <p className="text-sm text-surface-500 mb-6">
                If an account exists for <strong>{email}</strong>, we've sent a password reset link.
              </p>
              <Link to="/login" className="text-sm text-brand-500 hover:text-brand-600 font-medium">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-surface-900 text-center mb-1">Forgot password?</h1>
              <p className="text-sm text-surface-500 text-center mb-8">
                Enter your email and we'll send you a reset link
              </p>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-surface-600 mb-1.5">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="input-field"
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center">
          <Link to="/login" className="text-sm text-surface-500 hover:text-surface-700 flex items-center justify-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
