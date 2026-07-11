interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  const dimensions = {
    sm: { box: 'h-6 w-6', text: 'text-xs', icon: 14 },
    md: { box: 'h-8 w-8', text: 'text-sm', icon: 18 },
    lg: { box: 'h-10 w-10', text: 'text-base', icon: 22 },
  }
  const d = dimensions[size]

  return (
    <div className="flex items-center gap-2">
      {/* Geometric "PA" lettermark in a shield-inspired shape */}
      <div className={`${d.box} relative flex items-center justify-center rounded-lg bg-brand-500`}>
        <svg
          width={d.icon}
          height={d.icon}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Stylized shield with slash — represents both protection and penetration */}
          <path
            d="M12 2L4 6V12C4 16.42 7.4 20.48 12 21.5C16.6 20.48 20 16.42 20 12V6L12 2Z"
            fill="white"
            fillOpacity="0.2"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Diagonal slash — the "pen" in pentest */}
          <path
            d="M15 7L9 17"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Dot — precision */}
          <circle cx="15" cy="7" r="1.5" fill="white" />
        </svg>
      </div>
      {showText && (
        <span className={`${d.text} font-bold tracking-tight text-surface-900`}>
          PENAGENT
        </span>
      )}
    </div>
  )
}
