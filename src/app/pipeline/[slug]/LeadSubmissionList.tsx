'use client'

import { MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react'
import type { Lead, LeadSubmission } from '@/lib/b2b-types'

interface LeadSubmissionListProps {
  lead: Lead
  submissions: LeadSubmission[]
  activeSubmissionId: string | undefined
  onSelect: (sub: LeadSubmission) => void
}

export function LeadSubmissionList({ lead, submissions, activeSubmissionId, onSelect }: LeadSubmissionListProps) {
  if (submissions.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '16px 0',
        borderTop: '1px solid var(--br)',
      }}>
        <AlertCircle size={13} strokeWidth={2} color="var(--t-ghost)" />
        <p style={{ fontSize: 13, color: 'var(--t-faint)', letterSpacing: '-0.01em' }}>
          Comparte el link de diagnóstico para recibir respuestas.
        </p>
      </div>
    )
  }

  return (
    <div>
      {submissions.map(sub => {
        const isActive = activeSubmissionId === sub.id
        const msgCount = (sub.chat_transcript ?? []).filter(m => m.role === 'user').length

        return (
          <button
            key={sub.id}
            onClick={() => onSelect(sub)}
            style={{
              width: '100%', textAlign: 'left' as const, cursor: 'pointer',
              display: 'grid',
              gridTemplateColumns: '1fr auto auto auto',
              gap: '1.5rem',
              alignItems: 'center',
              padding: '14px 0',
              borderBottom: '1px solid rgba(12,12,9,0.07)',
              background: isActive ? 'rgba(12,12,9,0.025)' : 'transparent',
              border: 'none',
              borderRadius: 4,
              margin: '0 -8px',
              paddingLeft: 8,
              paddingRight: 8,
              transition: 'background 160ms ease',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(12,12,9,0.018)' }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
          >
            {/* Name + cargo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive ? 'var(--fg)' : 'rgba(12,12,9,0.07)',
                color: isActive ? '#ffffff' : 'var(--fg)',
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: 13, fontWeight: 700, flexShrink: 0,
                transition: 'background 160ms ease, color 160ms ease',
              }}>
                {sub.nombre.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: 600, letterSpacing: '-0.02em',
                  color: 'var(--fg)', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                }}>
                  {sub.nombre}
                </div>
                <div style={{ fontSize: 12, color: 'var(--t-subtle)', marginTop: 1, letterSpacing: '-0.01em' }}>
                  {sub.cargo}
                </div>
              </div>
            </div>

            {/* Areas */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const, justifyContent: 'flex-end', maxWidth: 180 }}>
              {sub.areas.slice(0, 2).map(a => (
                <span
                  key={a}
                  style={{
                    fontSize: 11, padding: '3px 8px', borderRadius: 4,
                    background: 'rgba(12,12,9,0.05)', color: 'var(--t-subtle)',
                    border: '1px solid var(--br)',
                    whiteSpace: 'nowrap' as const,
                  }}
                >
                  {a}
                </span>
              ))}
            </div>

            {/* Msg count */}
            {msgCount > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--t-faint)' }}>
                <MessageSquare size={11} strokeWidth={2} />
                <span style={{ fontSize: 12, fontFamily: 'var(--font-geist-mono), monospace' }}>{msgCount}</span>
              </div>
            ) : <div />}

            {/* Approved insight */}
            {sub.insight_aprobado ? (
              <CheckCircle2 size={13} color="var(--c-success)" />
            ) : (
              <div style={{ width: 13 }} />
            )}
          </button>
        )
      })}
    </div>
  )
}
