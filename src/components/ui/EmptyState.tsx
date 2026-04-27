import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  cta?: ReactNode
  accent?: boolean
}

export function EmptyState({ icon, title, description, cta, accent = true }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{
          background: accent ? 'var(--accent-surface)' : '#f4f4f5',
          border: `1px solid ${accent ? 'var(--accent-border)' : 'rgba(0,0,0,0.09)'}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        {icon}
      </div>
      <div className="space-y-1.5 max-w-[22ch]">
        <p className="font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>{title}</p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-faint)' }}>
          {description}
        </p>
      </div>
      {cta}
    </div>
  )
}
