import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'

/**
 * This page handles the redirect after GitHub OAuth.
 * The backend redirects here with ?accessToken=...&refreshToken=... in the URL.
 */
export default function AuthCallback() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const accessToken = params.get('accessToken')
    const refreshToken = params.get('refreshToken')

    if (accessToken && refreshToken) {
      // Store tokens
      api.setToken(accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      // Redirect to dashboard
      navigate('/app/dashboard', { replace: true })
    } else {
      // No tokens — redirect to login with error
      navigate('/login', { replace: true })
    }
  }, [params, navigate])

  return (
    <div className="flex h-screen items-center justify-center bg-surface-50">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-surface-300 border-t-brand-500 mx-auto mb-4" />
        <p className="text-sm text-surface-500">Signing you in...</p>
      </div>
    </div>
  )
}
