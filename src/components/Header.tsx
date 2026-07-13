import { Bell, Search, User, Menu, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-surface-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="rounded p-1.5 text-surface-400 hover:text-surface-700 lg:hidden">
          <Menu className="h-4 w-4" />
        </button>
        <div className="relative hidden sm:block w-60 lg:w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-lg border border-surface-200 bg-surface-50 py-1.5 pl-9 pr-4 text-xs text-surface-700 placeholder:text-surface-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-100 transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button className="relative rounded-lg p-2 text-surface-400 hover:text-surface-700 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-500" />
        </button>
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-surface-500">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-100 border border-surface-200">
            <User className="h-3.5 w-3.5" />
          </div>
          {user && (
            <span className="hidden md:block text-xs text-surface-600">{user.firstName || user.email}</span>
          )}
        </div>
        <button onClick={handleLogout} className="rounded-lg p-2 text-surface-400 hover:text-red-500 transition-colors" title="Logout">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
