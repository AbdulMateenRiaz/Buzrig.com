import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Github, CheckCircle } from 'lucide-react'
import Logo from '../components/Logo'
import { useAuth } from '../lib/auth'

export default function Signup() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signup({ email, password, firstName, lastName })
    setLoading(false)

    if (result.success) {
      navigate('/app/dashboard')
    } else {
      setError(result.error || 'Signup failed')
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-center px-16 bg-surface-50 border-r border-surface-200">
        <div className="max-w-xs">
          <Shield className="h-6 w-6 text-brand-500 mb-8" />
          <h2 className="text-2xl font-bold text-surface-900 leading-tight mb-6">
            Autonomous security testing that ships fixes
          </h2>
          <ul className="space-y-3">
            {[
              'First results within hours',
              'Code fixes as pull requests',
              'SOC 2, HIPAA, PCI-DSS ready',
              'No credit card required',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-surface-600">
                <CheckCircle className="h-3.5 w-3.5 text-accent-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-7/12">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-10 lg:hidden">
            <Logo size="md" />
          </div>

          <div className="rounded-xl border border-surface-200 bg-white p-8 shadow-sm">
            <h1 className="text-lg font-semibold text-surface-900 text-center mb-1">Create account</h1>
            <p className="text-sm text-surface-500 text-center mb-8">14-day free trial</p>

            <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/github`} className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-surface-300 bg-white py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors mb-6">
              <Github className="h-4 w-4" />
              Sign up with GitHub
            </a>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-surface-400">or</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-xs font-medium text-surface-600 mb-1.5">First name</label>
                  <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Alex" className="input-field" required />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-xs font-medium text-surface-600 mb-1.5">Last name</label>
                  <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Chen" className="input-field" required />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-surface-600 mb-1.5">Work email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alex@company.com" className="input-field" required />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-surface-600 mb-1.5">Password</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" className="input-field" required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full mt-2 disabled:opacity-50">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="mt-4 text-center text-[11px] text-surface-400">
              By signing up you agree to our <a href="#" className="underline hover:text-surface-600">Terms</a> and <a href="#" className="underline hover:text-surface-600">Privacy</a>
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-surface-500">
            Have an account?{' '}
            <Link to="/login" className="text-brand-500 hover:text-brand-600 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
