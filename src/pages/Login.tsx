import { Link } from 'react-router-dom'
import { Github } from 'lucide-react'
import Logo from '../components/Logo'

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <Logo size="md" />
        </div>

        <div className="rounded-xl border border-surface-200 bg-white p-8 shadow-sm">
          <h1 className="text-lg font-semibold text-surface-900 text-center mb-1">Welcome back</h1>
          <p className="text-sm text-surface-500 text-center mb-8">Sign in to your account</p>

          <button className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-surface-300 bg-white py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors mb-6">
            <Github className="h-4 w-4" />
            Continue with GitHub
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-surface-400">or</span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-surface-600 mb-1.5">Email</label>
              <input id="email" type="email" placeholder="you@company.com" className="input-field" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-surface-600">Password</label>
                <a href="#" className="text-xs text-brand-500 hover:text-brand-600 transition-colors">Forgot?</a>
              </div>
              <input id="password" type="password" placeholder="••••••••" className="input-field" />
            </div>
            <button type="submit" className="btn-primary w-full mt-2">Sign In</button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-surface-500">
          No account?{' '}
          <Link to="/signup" className="text-brand-500 hover:text-brand-600 font-medium transition-colors">Start free trial</Link>
        </p>
      </div>
    </div>
  )
}
