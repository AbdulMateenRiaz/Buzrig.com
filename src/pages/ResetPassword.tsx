import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import Logo from '../components/Logo'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(true)
      } else {
        setError(data.error?.message || 'Reset failed')
      }
    } catch {
      setError('Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50 px-6">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-surface-900 mb-2">Invalid reset link</h1>
          <p className="text-sm text-surface-500 mb-4">This link is invalid or has expired.</p>
          <Link to="/forgot-password" className="text-sm text-brand-500 hover:text-brand-600 font-medium">
            Request a new link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <Logo size="md" />
        </div>

        <div className="rounded-xl border border-surface-200 bg-white p-8 shadow-sm">
          {success ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
              <h1 className="text-lg font-semibold text-surface-900 mb-2">Password reset</h1>
              <p className="text-sm text-surface-500 mb-6">
                Your password has been updated. You can now sign in.
              </p>
              <Link to="/login" className="btn-primary inline-flex">
                Sign In
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-surface-900 text-center mb-1">Set new password</h1>
              <p className="text-sm text-surface-500 text-center mb-8">
                Choose a new password for your account
              </p>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-surface-600 mb-1.5">New password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="confirm" className="block text-xs font-medium text-surface-600 mb-1.5">Confirm password</label>
                  <input
                    id="confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Type password again"
                    className="input-field"
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
