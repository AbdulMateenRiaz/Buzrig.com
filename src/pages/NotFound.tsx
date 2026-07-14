import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import Logo from '../components/Logo'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-6">
      <div className="text-center">
        <div className="flex justify-center mb-8">
          <Logo size="md" />
        </div>
        <p className="text-6xl font-bold text-surface-200 mb-4">404</p>
        <h1 className="text-xl font-semibold text-surface-900 mb-2">Page not found</h1>
        <p className="text-sm text-surface-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary">
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  )
}
