import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Radar,
  Bug,
  GitPullRequest,
  ShieldCheck,
  Settings,
  Link2,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import Logo from './Logo'

const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Scans', href: '/app/scans', icon: Radar },
  { name: 'Vulnerabilities', href: '/app/vulnerabilities', icon: Bug },
  { name: 'Attack Chains', href: '/app/attack-chains', icon: Link2 },
  { name: 'Remediations', href: '/app/remediations', icon: GitPullRequest },
  { name: 'Compliance', href: '/app/compliance', icon: ShieldCheck },
  { name: 'Settings', href: '/app/settings', icon: Settings },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-56 flex-col bg-white border-r border-surface-200 transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-14 items-center justify-between px-5 border-b border-surface-200">
          <Logo size="sm" />
          <button onClick={onClose} className="rounded p-1 text-surface-400 hover:text-surface-700 lg:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-100',
                  isActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-surface-500 hover:bg-surface-100 hover:text-surface-800'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-surface-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="h-2 w-2 rounded-full bg-accent-500" />
              <div className="absolute inset-0 h-2 w-2 animate-ping rounded-full bg-accent-500 opacity-50" />
            </div>
            <div>
              <p className="text-xs font-medium text-surface-700">Agent Active</p>
              <p className="text-[11px] text-surface-400">3 targets monitored</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
