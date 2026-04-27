import type { ReactNode } from 'react'

interface StatBlockProps {
  value: ReactNode
  label: string
  color?: string
  mono?: boolean
}

export function StatBlock({ value, label, color = 'var(--foreground)', mono = true }: StatBlockProps) {
  return (
    <div>
      <div
        className="text-xl font-bold tabular-nums leading-none"
        style={{
          color,
          fontFamily: mono ? 'var(--font-geist-mono), monospace' : undefined,
          letterSpacing: '-0.025em',
        }}
      >
        {value}
      </div>
      <div
        className="text-xs mt-1.5 uppercase"
        style={{ color: 'var(--text-ghost)', letterSpacing: '0.12em' }}
      >
        {label}
      </div>
    </div>
  )
}
