import clsx from 'clsx'

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className, style }: SkeletonProps) {
  return <div className={clsx('skeleton', className)} style={style} />
}

export function SkeletonCard() {
  return (
    <div className="card-static space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="card-static space-y-4">
      <Skeleton className="h-4 w-32" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-48 flex-1" />
            <Skeleton className="h-5 w-16 rounded" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="card-static">
      <Skeleton className="h-4 w-32 mb-6" />
      <div className="flex items-end gap-2 h-[200px] pt-4">
        {[40, 60, 35, 80, 55, 70, 45, 65, 50, 75, 60, 40].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}
