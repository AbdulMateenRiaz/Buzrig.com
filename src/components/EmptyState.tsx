import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Illustration container */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-brand-50 rounded-full blur-xl opacity-50" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 border border-surface-200">
          <Icon className="h-7 w-7 text-surface-400" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-surface-900 mb-1">{title}</h3>
      <p className="text-sm text-surface-500 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary text-xs">
          {actionLabel}
        </button>
      )}
    </div>
  )
}
