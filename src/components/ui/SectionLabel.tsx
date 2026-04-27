import type { ReactNode } from 'react'

interface SectionLabelProps {
  children: ReactNode
  className?: string
}

export function SectionLabel({ children, className = '' }: SectionLabelProps) {
  return (
    <p
      className={`text-xs uppercase ${className}`}
      style={{ color: 'var(--text-ghost)', letterSpacing: '0.18em' }}
    >
      {children}
    </p>
  )
}
