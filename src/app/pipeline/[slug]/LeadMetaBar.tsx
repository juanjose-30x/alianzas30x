import type { Lead } from '@/lib/b2b-types'

export function LeadMetaBar({ lead }: { lead: Lead }) {
  const active = lead.diagnostico_activo

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0',
      borderTop: '1px solid var(--br)',
    }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)', letterSpacing: '-0.02em' }}>
          Formulario de diagnóstico
        </p>
        <p style={{ fontSize: 12, color: 'var(--t-subtle)', marginTop: 2, letterSpacing: '-0.01em' }}>
          {active
            ? 'Activo — los gerentes pueden acceder'
            : 'Cerrado — el link muestra acceso denegado'}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: active ? 'var(--c-success)' : 'var(--t-ghost)',
          boxShadow: active ? '0 0 0 2px rgba(21,128,61,0.18)' : 'none',
        }} />
        <span style={{
          fontSize: 12, letterSpacing: '-0.01em',
          color: active ? 'var(--c-success)' : 'var(--t-faint)',
        }}>
          {active ? 'Activo' : 'Cerrado'}
        </span>
      </div>
    </div>
  )
}
