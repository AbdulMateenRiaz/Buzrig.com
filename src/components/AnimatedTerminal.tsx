import { useState, useEffect } from 'react'

const lines = [
  { text: '$ penagent scan --target api.acme.com', type: 'command' as const, delay: 0 },
  { text: '[14:32:01] Scanning 47 endpoints...', type: 'info' as const, delay: 800 },
  { text: '[14:32:14] Testing /api/users/search for injection flaws', type: 'info' as const, delay: 1600 },
  { text: '[14:32:18] ⚠ SQL Injection found — CVSS 9.8', type: 'warning' as const, delay: 2400 },
  { text: '[14:32:19] Generating proof-of-concept exploit...', type: 'info' as const, delay: 3200 },
  { text: '[14:32:22] ✓ Exploit verified — data exfiltration possible', type: 'error' as const, delay: 4000 },
  { text: '[14:32:24] Writing remediation patch...', type: 'info' as const, delay: 4800 },
  { text: '[14:32:31] ✓ PR #312 opened → fix/sqli-users-search', type: 'success' as const, delay: 5600 },
  { text: '[14:32:31] Fix: Parameterized query + input validation', type: 'success' as const, delay: 6200 },
]

export default function AnimatedTerminal() {
  const [visibleLines, setVisibleLines] = useState(0)

  useEffect(() => {
    const timers = lines.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay + 500)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  function getColor(type: string) {
    switch (type) {
      case 'command': return 'text-white'
      case 'info': return 'text-surface-400'
      case 'warning': return 'text-amber-400'
      case 'error': return 'text-red-400'
      case 'success': return 'text-emerald-400'
      default: return 'text-surface-400'
    }
  }

  return (
    <div className="rounded-xl border border-surface-200 bg-surface-900 overflow-hidden shadow-2xl shadow-surface-900/10">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-800 border-b border-surface-700">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <span className="text-[11px] text-surface-400 ml-2 font-mono">penagent — api.acme.com</span>
      </div>
      {/* Content */}
      <div className="p-4 font-mono text-[12px] leading-relaxed h-[240px] overflow-hidden">
        {lines.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            className={`${getColor(line.type)} animate-[fadeIn_0.3s_ease-out]`}
          >
            {line.text}
          </div>
        ))}
        {visibleLines < lines.length && (
          <span className="inline-block w-2 h-4 bg-white/70 animate-pulse ml-0.5" />
        )}
      </div>
    </div>
  )
}
