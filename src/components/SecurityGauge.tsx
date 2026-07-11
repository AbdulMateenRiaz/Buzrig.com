interface SecurityGaugeProps {
  score: number
  maxScore?: number
}

export default function SecurityGauge({ score, maxScore = 100 }: SecurityGaugeProps) {
  const percentage = (score / maxScore) * 100
  const radius = 80
  const strokeWidth = 10
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference * 0.75 // 270 degree arc
  const rotation = 135 // start from bottom-left

  function getColor() {
    if (percentage >= 80) return '#0d9488' // teal
    if (percentage >= 60) return '#d97706' // amber
    return '#e02020' // red
  }

  function getLabel() {
    if (percentage >= 80) return 'Good'
    if (percentage >= 60) return 'Fair'
    return 'Critical'
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {/* Background arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
            transform={`rotate(${rotation} 100 100)`}
          />
          {/* Score arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(${rotation} 100 100)`}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-surface-900">{score}</span>
          <span className="text-xs text-surface-500 mt-0.5">/ {maxScore}</span>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: getColor() }} />
        <span className="text-sm font-medium text-surface-700">{getLabel()}</span>
      </div>
    </div>
  )
}
