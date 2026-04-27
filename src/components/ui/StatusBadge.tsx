import type { LeadStatus } from '@/lib/b2b-types'
import { LEAD_STATUS_LABELS } from '@/lib/b2b-types'

interface StatusBadgeProps {
  status: LeadStatus
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { label, color } = LEAD_STATUS_LABELS[status]
  const isSmall = size === 'sm'

  return (
    <span
      className={isSmall ? 'text-[11px] px-1.5 py-px rounded' : 'text-xs px-2 py-0.5 rounded-md'}
      style={{
        background: `${color}12`,
        color,
        border: `1px solid ${color}22`,
        fontWeight: 500,
        letterSpacing: '-0.01em',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  )
}
