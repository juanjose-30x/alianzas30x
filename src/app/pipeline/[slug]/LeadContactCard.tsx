import { User, Mail, Phone, DollarSign, Globe, ExternalLink } from 'lucide-react'
import type { Lead } from '@/lib/b2b-types'

export function LeadContactCard({ lead }: { lead: Lead }) {
  const rows = [
    lead.contacto_nombre && {
      icon: <User size={12} color="var(--t-faint)" strokeWidth={2} />,
      label: 'Contacto',
      value: lead.contacto_nombre,
      sub: lead.contacto_cargo,
    },
    lead.contacto_email && {
      icon: <Mail size={12} color="var(--t-faint)" strokeWidth={2} />,
      label: 'Email',
      value: (
        <a
          href={`mailto:${lead.contacto_email}`}
          style={{ color: 'var(--fg)', textDecoration: 'none' }}
        >
          {lead.contacto_email}
        </a>
      ),
    },
    lead.contacto_whatsapp && {
      icon: <Phone size={12} color="var(--t-faint)" strokeWidth={2} />,
      label: 'WhatsApp',
      value: (
        <a
          href={`https://wa.me/${lead.contacto_whatsapp.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--fg)', textDecoration: 'none' }}
        >
          {lead.contacto_whatsapp} <ExternalLink size={9} strokeWidth={2} />
        </a>
      ),
    },
    lead.deal_value_usd && {
      icon: <DollarSign size={12} color="var(--c-success)" strokeWidth={2} />,
      label: 'Deal value',
      value: (
        <span style={{
          fontFamily: 'var(--font-geist-mono), monospace',
          fontWeight: 800, fontSize: 16, color: 'var(--c-success)',
          letterSpacing: '-0.04em',
        }}>
          ${lead.deal_value_usd.toLocaleString()}
          <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 4, color: 'var(--c-success)', opacity: 0.7 }}>USD</span>
        </span>
      ),
    },
    lead.website && {
      icon: <Globe size={12} color="var(--t-faint)" strokeWidth={2} />,
      label: 'Web',
      value: (
        <a
          href={lead.website}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--fg)', textDecoration: 'none' }}
        >
          {lead.website.replace(/^https?:\/\//, '')} <ExternalLink size={9} strokeWidth={2} />
        </a>
      ),
    },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string | null }[]

  if (rows.length === 0) return null

  return (
    <div style={{ borderTop: '1px solid var(--br)' }}>
      {rows.map((row, i) => (
        <div
          key={i}
          style={{
            display: 'grid', gridTemplateColumns: '16px 100px 1fr',
            alignItems: 'center', gap: 12,
            padding: '12px 0',
            borderBottom: '1px solid var(--br)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>{row.icon}</div>
          <span style={{ fontSize: 12, color: 'var(--t-faint)', letterSpacing: '-0.01em' }}>{row.label}</span>
          <div>
            <div style={{ fontSize: 13, color: 'var(--fg)', letterSpacing: '-0.01em', fontWeight: 500 }}>
              {row.value}
            </div>
            {row.sub && (
              <div style={{ fontSize: 11, color: 'var(--t-subtle)', marginTop: 2 }}>{row.sub}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
