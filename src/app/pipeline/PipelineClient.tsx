'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, TrendingUp, ChevronRight } from 'lucide-react'
import type { Lead } from '@/lib/b2b-types'
import { LEAD_STATUS_LABELS } from '@/lib/b2b-types'
import { listContainer, listItem, EASE_EXPO } from '@/lib/motion'

type LeadWithCount = Lead & { submissions_count: number }

const S = {
  nav: {
    position: 'sticky' as const, top: 0, zIndex: 40,
    background: 'rgba(243,242,238,0.88)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(12,12,9,0.09)',
  },
  navInner: {
    maxWidth: '80rem', margin: '0 auto',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 2.5rem', height: 52,
  },
  wrap: { maxWidth: '80rem', margin: '0 auto', padding: '0 2.5rem' },
}

export default function PipelineClient({ leads }: { leads: LeadWithCount[] }) {
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filtered = leads.filter(l => {
    const ms = l.empresa.toLowerCase().includes(search.toLowerCase()) || l.slug.toLowerCase().includes(search.toLowerCase())
    const mf = filterStatus === 'all' || l.status === filterStatus
    return ms && mf
  })

  const totalDeal   = leads.filter(l => l.status !== 'cerrado_perdido').reduce((a, l) => a + (l.deal_value_usd ?? 0), 0)
  const activeLeads = leads.filter(l => !['cerrado_ganado', 'cerrado_perdido'].includes(l.status)).length
  const readyLeads  = leads.filter(l => l.status === 'diagnostico_completo').length
  const wonLeads    = leads.filter(l => l.status === 'cerrado_ganado').length

  const metricRows: Array<{ n: number; label: string; color: string; trend?: string; trendUp?: boolean }> = [
    { n: leads.length,  label: 'Leads totales',   color: 'var(--fg)' },
    { n: activeLeads,   label: 'En proceso',       color: 'var(--fg)' },
    { n: readyLeads,    label: 'Para propuesta',   color: 'var(--c-purple)',  trend: readyLeads > 0 ? `${readyLeads} listos` : undefined, trendUp: true },
    { n: wonLeads,      label: 'Cerrados ganados', color: 'var(--c-success)', trend: wonLeads > 0 ? 'ganados' : undefined, trendUp: true },
  ]

  const dealFormatted = totalDeal >= 1000000
    ? `$${(totalDeal / 1000000).toFixed(1)}M`
    : totalDeal >= 1000
    ? `$${(totalDeal / 1000).toFixed(0)}k`
    : `$${totalDeal}`

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh' }}>

      {/* ── NAV ── */}
      <header style={S.nav}>
        <div style={S.navInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 13, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--fg)',
            }}>
              30X
            </span>
            <span style={{ color: 'var(--t-ghost)', fontSize: 14, fontWeight: 300 }}>/</span>
            <span style={{ color: 'var(--t-subtle)', fontSize: 13, letterSpacing: '-0.01em' }}>
              Pipeline B2B
            </span>
          </div>

          <a href="/pipeline/nuevo" className="btn-primary">
            <Plus size={13} strokeWidth={2.5} /> Nuevo lead
          </a>
        </div>
      </header>

      <div style={S.wrap}>

        {/* ── HERO ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 280px',
          gap: '5rem',
          alignItems: 'end',
          paddingTop: '4.5rem',
          paddingBottom: '3rem',
          borderBottom: '1px solid rgba(12,12,9,0.09)',
        }}>
          {/* Left: oversized deal value */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="label-caps" style={{ marginBottom: '1.5rem' }}>
              Pipeline activo — {new Date().getFullYear()}
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, lineHeight: 1 }}>
              <span
                className="text-display"
                style={{
                  fontSize: 'clamp(4.5rem, 10vw, 8rem)',
                  color: totalDeal > 0 ? 'var(--fg)' : 'var(--t-ghost)',
                  fontFamily: 'var(--font-geist-mono), monospace',
                }}
              >
                {dealFormatted}
              </span>
              <span style={{
                fontSize: 13, color: 'var(--t-faint)',
                marginBottom: 10, letterSpacing: '0.06em',
              }}>
                USD
              </span>
            </div>
            <p style={{ marginTop: 12, fontSize: 13, color: 'var(--t-subtle)', letterSpacing: '-0.01em' }}>
              en oportunidades activas
            </p>
          </motion.div>

          {/* Right: vertical stats table */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18, duration: 0.45 }}
          >
            {metricRows.map(({ n, label, color, trend, trendUp }, i) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 0',
                  borderTop: '1px solid rgba(12,12,9,0.09)',
                  borderBottom: i === metricRows.length - 1 ? '1px solid rgba(12,12,9,0.09)' : undefined,
                }}
              >
                <div>
                  <span style={{ fontSize: 12, color: 'var(--t-subtle)', letterSpacing: '-0.01em' }}>
                    {label}
                  </span>
                  {trend && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
                      <TrendingUp size={10} color={trendUp ? 'var(--c-success)' : 'var(--c-danger)'} />
                      <span style={{ fontSize: 10, color: trendUp ? 'var(--c-success)' : 'var(--c-danger)', letterSpacing: '0.02em' }}>
                        {trend}
                      </span>
                    </div>
                  )}
                </div>
                <span style={{
                  fontSize: 20, fontWeight: 800,
                  color, fontFamily: 'var(--font-geist-mono), monospace',
                  letterSpacing: '-0.04em',
                }}>
                  {n}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── FILTERS ── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 10, flexWrap: 'wrap' as const,
          padding: '14px 0',
          borderBottom: '1px solid rgba(12,12,9,0.09)',
        }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-card)',
            border: '1px solid rgba(12,12,9,0.10)',
            borderRadius: 8, padding: '7px 12px',
            flex: '1 1 180px', boxShadow: 'var(--sh-sm)',
          }}>
            <Search size={13} color="var(--t-faint)" strokeWidth={2} />
            <input
              style={{
                background: 'none', border: 'none', outline: 'none',
                fontSize: 13, color: 'var(--fg)', flex: 1, letterSpacing: '-0.01em',
              }}
              placeholder="Buscar empresa o slug..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Status filter pills */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
            {(['all', ...Object.keys(LEAD_STATUS_LABELS)] as const).map(s => {
              const info = s === 'all'
                ? { label: 'Todos', color: '#09090b' }
                : LEAD_STATUS_LABELS[s as keyof typeof LEAD_STATUS_LABELS]
              const active = filterStatus === s
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  style={{
                    padding: '5px 12px', borderRadius: 6,
                    fontSize: 12, fontWeight: active ? 600 : 400,
                    letterSpacing: '-0.01em', cursor: 'pointer',
                    transition: 'all 130ms ease',
                    background: active ? info.color : 'transparent',
                    color: active ? '#ffffff' : 'var(--t-subtle)',
                    border: active ? `1px solid ${info.color}` : '1px solid transparent',
                    fontFamily: 'var(--font-geist), system-ui',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--fg)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--t-subtle)' }}
                >
                  {info.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── LEAD LIST ── */}
        <motion.div
          variants={listContainer}
          initial="hidden"
          animate="visible"
          style={{ paddingBottom: '6rem' }}
        >
          {/* Count header */}
          <div style={{
            padding: '12px 0 4px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span className="label-caps">
              {filtered.length} lead{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div style={{ padding: '5rem 0', textAlign: 'center' as const }}>
              <p style={{ fontSize: 14, color: 'var(--t-faint)' }}>
                {leads.length === 0 ? 'Sin leads aún' : `Sin resultados para "${search}"`}
              </p>
              {leads.length === 0 && (
                <a href="/pipeline/nuevo" className="btn-primary" style={{ marginTop: 24 }}>
                  <Plus size={13} /> Crear primer lead
                </a>
              )}
            </div>
          ) : filtered.map(lead => {
            const status = LEAD_STATUS_LABELS[lead.status]
            return (
              <motion.a
                key={lead.id}
                href={`/pipeline/${lead.slug}`}
                variants={listItem}
                className="lead-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto auto 16px',
                  gap: '1.75rem',
                  alignItems: 'center',
                  padding: '14px 12px 14px 16px',
                  borderBottom: '1px solid rgba(12,12,9,0.07)',
                  textDecoration: 'none',
                  borderRadius: 8,
                  margin: '0 -4px',
                  borderLeft: `3px solid ${status.color}`,
                  transition: 'background 150ms ease, border-color 150ms ease, transform 150ms ease',
                }}
                whileHover={{ y: -1, transition: { duration: 0.15, ease: EASE_EXPO } }}
              >
                {/* Company info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    background: `${status.color}14`,
                    border: `1px solid ${status.color}28`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: status.color,
                    fontFamily: 'var(--font-geist-mono), monospace',
                    letterSpacing: '-0.02em',
                  }}>
                    {lead.empresa.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600, letterSpacing: '-0.02em',
                      color: 'var(--fg)', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                    }}>
                      {lead.empresa}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 2, alignItems: 'center' }}>
                      {lead.industria && (
                        <span style={{ fontSize: 11, color: 'var(--t-faint)', letterSpacing: '-0.01em' }}>
                          {lead.industria}
                        </span>
                      )}
                      {lead.industria && lead.contacto_nombre && (
                        <span style={{ fontSize: 11, color: 'var(--t-ghost)' }}>·</span>
                      )}
                      {lead.contacto_nombre && (
                        <span style={{ fontSize: 11, color: 'var(--t-faint)', letterSpacing: '-0.01em' }}>
                          {lead.contacto_nombre}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status label */}
                <span style={{
                  fontSize: 11, color: status.color, fontWeight: 500,
                  letterSpacing: '-0.01em', whiteSpace: 'nowrap' as const,
                  background: `${status.color}12`,
                  border: `1px solid ${status.color}24`,
                  padding: '3px 8px', borderRadius: 100,
                }}>
                  {status.label}
                </span>

                {/* Submissions */}
                {lead.submissions_count > 0 ? (
                  <div style={{ textAlign: 'right' as const }}>
                    <div style={{
                      fontSize: 15, fontWeight: 800, color: 'var(--fg)',
                      fontFamily: 'var(--font-geist-mono), monospace',
                      letterSpacing: '-0.04em', lineHeight: 1,
                    }}>
                      {lead.submissions_count}
                    </div>
                    <div className="label-caps" style={{ marginTop: 2 }}>diag.</div>
                  </div>
                ) : <div />}

                {/* Deal value */}
                {lead.deal_value_usd ? (
                  <div style={{ textAlign: 'right' as const, minWidth: 72 }}>
                    <div style={{
                      fontSize: 15, fontWeight: 800, color: 'var(--c-success)',
                      fontFamily: 'var(--font-geist-mono), monospace',
                      letterSpacing: '-0.04em', lineHeight: 1,
                    }}>
                      ${lead.deal_value_usd.toLocaleString()}
                    </div>
                    <div className="label-caps" style={{ marginTop: 2 }}>USD</div>
                  </div>
                ) : <div />}

                {/* Arrow */}
                <ChevronRight size={13} color="var(--t-ghost)" style={{ flexShrink: 0 }} />
              </motion.a>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}
