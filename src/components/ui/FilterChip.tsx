'use client'

interface FilterChipProps {
  label: string
  active: boolean
  onClick: () => void
  color?: string
}

export function FilterChip({ label, active, onClick, color = '#09090b' }: FilterChipProps) {
  const isHexColor = color.startsWith('#')

  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-medium"
      style={{
        transition: 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background 120ms ease, color 100ms ease, border-color 100ms ease',
        ...(active
          ? {
              background: isHexColor ? `${color}14` : 'rgba(0,0,0,0.08)',
              color: color,
              border: `1px solid ${isHexColor ? `${color}35` : 'rgba(0,0,0,0.18)'}`,
              letterSpacing: '-0.01em',
              fontWeight: 600,
            }
          : {
              background: '#ffffff',
              color: 'var(--text-subtle)',
              border: '1px solid rgba(0,0,0,0.09)',
              letterSpacing: '-0.01em',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }),
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.borderColor = 'rgba(0,0,0,0.18)'
          e.currentTarget.style.color = 'var(--foreground)'
        }
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.transform = 'scale(1)'
        if (!active) {
          el.style.borderColor = 'rgba(0,0,0,0.09)'
          el.style.color = 'var(--text-subtle)'
        }
      }}
      onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)' }}
      onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
    >
      {label}
    </button>
  )
}
