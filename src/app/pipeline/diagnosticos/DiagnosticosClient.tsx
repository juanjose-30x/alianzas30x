'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, ChevronRight, Mail, Phone, MessageSquare } from 'lucide-react'
import type { MinimedSubmission, AgriglobalSubmission } from '@/lib/diagnosticos-supabase'
import { listContainer, listItem } from '@/lib/motion'

const AREA_LABELS: Record<string, string> = {
  ventas: 'Ventas', logistica: 'Logística', mercadeo: 'Mercadeo', visual: 'Visual',
  tecnologia: 'Tecnología', seguridad: 'Seguridad', financiero: 'Financiero',
  'gestion-humana': 'Gestión Humana', compras: 'Compras', proyectos: 'Proyectos',
  'servicio-al-cliente': 'Servicio al Cliente', presidencia: 'Presidencia',
}

const ROL_LABELS: Record<string, string> = {
  ceo: 'CEO / Founder', comercial: 'Dir. Comercial',
  marketing: 'Dir. Marketing', financiera: 'Dir. Financiera',
}

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

type Tab = 'minimed' | 'agriglobal'

export default function DiagnosticosClient({
  minimed, agriglobal,
}: {
  minimed: MinimedSubmission[]
  agriglobal: AgriglobalSubmission[]
}) {
  const [tab, setTab]         = useState<Tab>('minimed')
  const [search, setSearch]   = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const minimedFiltered = minimed.filter(s =>
    s.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    (s.cargo ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const agriglobalFiltered = agriglobal.filter(s =>
    s.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    (s.rol ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const total    = tab === 'minimed' ? minimed.length : agriglobal.length
  const insights = tab === 'minimed'
    ? minimed.filter(s => s.insight_aprobado).length
    : agriglobal.filter(s => s.insight_aprobado).length
  const filtered = tab === 'minimed' ? minimedFiltered : agriglobalFiltered

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh' }}>

      {/* NAV */}
      <header style={S.nav}>
        <div style={S.navInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--fg)' }}>30X</span>
            <span style={{ color: 'var(--t-ghost)', fontSize: 14, fontWeight: 300 }}>/</span>
            <span style={{ color: 'var(--t-subtle)', fontSize: 13, letterSpacing: '-0.01em' }}>Diagnósticos</span>
          </div>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 2, background: 'rgba(12,12,9,0.06)', borderRadius: 8, padding: 3 }}>
            {(['minimed', 'agriglobal'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setExpanded(null) }}
                style={{
                  padding: '5px 14px', borderRadius: 6,
                  fontSize: 12, fontWeight: tab === t ? 600 : 400,
                  letterSpacing: '-0.01em', cursor: 'pointer',
                  background: tab === t ? 'var(--bg-card)' : 'transparent',
                  color: tab === t ? 'var(--fg)' : 'var(--t-subtle)',
                  border: tab === t ? '1px solid rgba(12,12,9,0.10)' : '1px solid transparent',
                  boxShadow: tab === t ? 'var(--sh-sm)' : 'none',
                  transition: 'all 150ms ease',
                  fontFamily: 'var(--font-geist), system-ui',
                }}
              >
                {t === 'minimed' ? 'Minimed' : 'AgriGlobal'}
                <span style={{
                  marginLeft: 6, fontSize: 10,
                  fontFamily: 'var(--font-geist-mono), monospace',
                  color: tab === t ? 'var(--t-muted)' : 'var(--t-ghost)',
                }}>
                  {t === 'minimed' ? minimed.length : agriglobal.length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div style={S.wrap}>

        {/* STATS */}
        <div style={{
          display: 'flex', gap: '4rem',
          paddingTop: '3rem', paddingBottom: '2.5rem',
          borderBottom: '1px solid rgba(12,12,9,0.09)',
        }}>
          {[
            { label: 'Total respuestas', value: total },
            { label: 'Insights aprobados', value: insights },
            { label: filtered.length !== total ? 'Filtrados' : 'Completados hoy', value: filtered.length !== total ? filtered.length : filtered.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString()).length },
          ].map(({ label, value }) => (
            <motion.div key={label} {...{ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}>
              <p className="label-caps" style={{ marginBottom: 8 }}>{label}</p>
              <span style={{
                fontSize: 42, fontWeight: 800, letterSpacing: '-0.055em', lineHeight: 1,
                fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--fg)',
              }}>
                {value}
              </span>
            </motion.div>
          ))}
        </div>

        {/* SEARCH */}
        <div style={{ padding: '16px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-card)',
            border: '1px solid rgba(12,12,9,0.10)',
            borderRadius: 8, padding: '7px 12px',
            maxWidth: 360, boxShadow: 'var(--sh-sm)',
          }}>
            <Search size={13} color="var(--t-faint)" strokeWidth={2} />
            <input
              style={{
                background: 'none', border: 'none', outline: 'none',
                fontSize: 13, color: 'var(--fg)', flex: 1, letterSpacing: '-0.01em',
                fontFamily: 'var(--font-geist), system-ui',
              }}
              placeholder={tab === 'minimed' ? 'Buscar nombre o cargo...' : 'Buscar nombre o rol...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* LIST */}
        <div style={{ paddingBottom: '6rem' }}>
          <p className="label-caps" style={{ padding: '4px 0 8px' }}>
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </p>

          {filtered.length === 0 ? (
            <div style={{ padding: '5rem 0', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: 'var(--t-faint)' }}>
                {total === 0
                  ? 'Sin respuestas aún'
                  : `Sin resultados para "${search}"`}
              </p>
            </div>
          ) : (
            <motion.div variants={listContainer} initial="hidden" animate="visible">
              {tab === 'minimed'
                ? minimedFiltered.map(sub => (
                    <MinimedRow
                      key={sub.id}
                      sub={sub}
                      isExpanded={expanded === sub.id}
                      onToggle={() => setExpanded(expanded === sub.id ? null : sub.id)}
                    />
                  ))
                : agriglobalFiltered.map(sub => (
                    <AgriglobalRow
                      key={sub.id}
                      sub={sub}
                      isExpanded={expanded === sub.id}
                      onToggle={() => setExpanded(expanded === sub.id ? null : sub.id)}
                    />
                  ))
              }
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── MINIMED ROW ──────────────────────────────────────────────────────

function MinimedRow({ sub, isExpanded, onToggle }: {
  sub: MinimedSubmission
  isExpanded: boolean
  onToggle: () => void
}) {
  const msgCount = (sub.chat_transcript ?? []).filter(m => m.role === 'user').length

  return (
    <motion.div variants={listItem} style={{ borderBottom: '1px solid rgba(12,12,9,0.07)' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'grid',
          gridTemplateColumns: '32px 1fr auto auto auto',
          gap: '1.25rem', alignItems: 'center',
          padding: '13px 6px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left', borderRadius: 6,
          transition: 'background 140ms ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(12,12,9,0.03)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        {/* Avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: 'rgba(12,12,9,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: 'var(--fg)',
          fontFamily: 'var(--font-geist-mono), monospace',
        }}>
          {(sub.nombre ?? '?').charAt(0).toUpperCase()}
        </div>

        {/* Name + cargo */}
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 600, letterSpacing: '-0.02em',
            color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {sub.nombre}
          </div>
          <div style={{ fontSize: 11, color: 'var(--t-subtle)', marginTop: 1, letterSpacing: '-0.01em' }}>
            {sub.cargo}{sub.headcount ? ` · ${sub.headcount} personas` : ''}
          </div>
        </div>

        {/* Area chips */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
          {(sub.areas ?? []).slice(0, 2).map(a => (
            <span key={a} style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 100,
              background: 'rgba(12,12,9,0.07)', color: 'var(--t-muted)',
              letterSpacing: '0.01em', fontWeight: 500, whiteSpace: 'nowrap',
            }}>
              {AREA_LABELS[a] ?? a}
            </span>
          ))}
          {(sub.areas ?? []).length > 2 && (
            <span style={{ fontSize: 10, color: 'var(--t-faint)', alignSelf: 'center' }}>
              +{sub.areas.length - 2}
            </span>
          )}
        </div>

        {/* Msg count */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: 14, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1,
            fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--fg)',
          }}>
            {msgCount}
          </div>
          <div className="label-caps" style={{ marginTop: 2 }}>msgs</div>
        </div>

        {/* Date + chevron */}
        <div style={{ textAlign: 'right', minWidth: 70 }}>
          <div style={{ fontSize: 11, color: 'var(--t-faint)' }}>
            {new Date(sub.created_at).toLocaleDateString('es-CO')}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 3 }}>
            {isExpanded
              ? <ChevronDown size={13} color="var(--t-ghost)" />
              : <ChevronRight size={13} color="var(--t-ghost)" />}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '4px 6px 20px',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem',
            }}>
              {/* Left */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Contact */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {sub.email && (
                    <a href={`mailto:${sub.email}`}
                      style={contactStyle}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--fg)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--t-subtle)' }}
                    >
                      <Mail size={12} strokeWidth={1.75} /> {sub.email}
                    </a>
                  )}
                  {sub.telefono && (
                    <a href={`https://wa.me/${sub.telefono.replace(/\D/g, '')}`}
                      target="_blank" rel="noreferrer"
                      style={contactStyle}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--fg)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--t-subtle)' }}
                    >
                      <Phone size={12} strokeWidth={1.75} /> {sub.telefono}
                    </a>
                  )}
                </div>

                {/* Retos */}
                {(sub.retos_chips ?? []).length > 0 && (
                  <div>
                    <p className="label-caps" style={{ marginBottom: 8 }}>Retos identificados</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {sub.retos_chips.map((r, i) => (
                        <span key={i} style={chipStyle}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Herramientas */}
                {(sub.herramientas ?? []).filter(h => h !== 'ninguna').length > 0 && (
                  <div>
                    <p className="label-caps" style={{ marginBottom: 8 }}>Herramientas de IA</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {sub.herramientas.filter(h => h !== 'ninguna').map((h, i) => (
                        <span key={i} style={{
                          fontSize: 11, padding: '3px 9px', borderRadius: 100, fontWeight: 500,
                          background: 'rgba(233,255,123,0.15)',
                          border: '1px solid rgba(180,210,0,0.30)',
                          color: '#4a5c00',
                        }}>
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: transcript */}
              {(sub.chat_transcript ?? []).length > 1 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <MessageSquare size={11} color="var(--t-faint)" />
                    <p className="label-caps">Conversación</p>
                  </div>
                  <Transcript messages={sub.chat_transcript} accentBg="rgba(12,12,9,0.05)" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── AGRIGLOBAL ROW ───────────────────────────────────────────────────

function AgriglobalRow({ sub, isExpanded, onToggle }: {
  sub: AgriglobalSubmission
  isExpanded: boolean
  onToggle: () => void
}) {
  const msgCount = (sub.chat_transcript ?? []).filter(m => m.role === 'user').length

  return (
    <motion.div variants={listItem} style={{ borderBottom: '1px solid rgba(12,12,9,0.07)' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'grid',
          gridTemplateColumns: '32px 1fr auto auto auto',
          gap: '1.25rem', alignItems: 'center',
          padding: '13px 6px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left', borderRadius: 6,
          transition: 'background 140ms ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(12,12,9,0.03)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        {/* Avatar — green tint for AgriGlobal */}
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: 'rgba(52,211,153,0.13)',
          border: '1px solid rgba(52,211,153,0.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#166534',
          fontFamily: 'var(--font-geist-mono), monospace',
        }}>
          {(sub.nombre ?? '?').charAt(0).toUpperCase()}
        </div>

        {/* Name + rol */}
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 600, letterSpacing: '-0.02em',
            color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {sub.nombre}
          </div>
          <div style={{ fontSize: 11, color: 'var(--t-subtle)', marginTop: 1, letterSpacing: '-0.01em' }}>
            {ROL_LABELS[sub.rol] ?? sub.rol}
          </div>
        </div>

        {/* Programa badge */}
        <span style={{
          fontSize: 10, padding: '3px 9px', borderRadius: 100, fontWeight: 500,
          background: 'rgba(52,211,153,0.10)',
          border: '1px solid rgba(52,211,153,0.22)',
          color: '#166534', whiteSpace: 'nowrap',
        }}>
          {sub.programa}
        </span>

        {/* Msg count */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: 14, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1,
            fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--fg)',
          }}>
            {msgCount}
          </div>
          <div className="label-caps" style={{ marginTop: 2 }}>msgs</div>
        </div>

        {/* Date + chevron */}
        <div style={{ textAlign: 'right', minWidth: 70 }}>
          <div style={{ fontSize: 11, color: 'var(--t-faint)' }}>
            {new Date(sub.created_at).toLocaleDateString('es-CO')}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 3 }}>
            {isExpanded
              ? <ChevronDown size={13} color="var(--t-ghost)" />
              : <ChevronRight size={13} color="var(--t-ghost)" />}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '4px 6px 20px',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem',
            }}>
              {/* Left */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {sub.email && (
                    <a href={`mailto:${sub.email}`}
                      style={contactStyle}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--fg)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--t-subtle)' }}
                    >
                      <Mail size={12} strokeWidth={1.75} /> {sub.email}
                    </a>
                  )}
                  {sub.telefono && (
                    <a href={`https://wa.me/${sub.telefono.replace(/\D/g, '')}`}
                      target="_blank" rel="noreferrer"
                      style={contactStyle}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--fg)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--t-subtle)' }}
                    >
                      <Phone size={12} strokeWidth={1.75} /> {sub.telefono}
                    </a>
                  )}
                </div>

                {(sub.retos_chips ?? []).length > 0 && (
                  <div>
                    <p className="label-caps" style={{ marginBottom: 8 }}>Retos identificados</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {sub.retos_chips.map((r, i) => (
                        <span key={i} style={{
                          fontSize: 11, padding: '3px 9px', borderRadius: 100, fontWeight: 500,
                          background: 'rgba(52,211,153,0.08)',
                          border: '1px solid rgba(52,211,153,0.20)',
                          color: '#166534',
                        }}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: transcript */}
              {(sub.chat_transcript ?? []).length > 1 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <MessageSquare size={11} color="var(--t-faint)" />
                    <p className="label-caps">Conversación</p>
                  </div>
                  <Transcript messages={sub.chat_transcript} accentBg="rgba(52,211,153,0.07)" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── SHARED ───────────────────────────────────────────────────────────

function Transcript({
  messages,
  accentBg,
}: {
  messages: { role: 'user' | 'assistant'; content: string }[]
  accentBg: string
}) {
  return (
    <div style={{
      maxHeight: 240, overflowY: 'auto',
      display: 'flex', flexDirection: 'column', gap: 6,
      paddingRight: 4,
    }}>
      {messages.filter((_, i) => i > 0).map((msg, i) => (
        <div key={i} style={{
          display: 'flex',
          justifyContent: msg.role === 'assistant' ? 'flex-start' : 'flex-end',
        }}>
          <div style={{
            maxWidth: '82%', padding: '7px 10px', borderRadius: 8,
            fontSize: 12, lineHeight: 1.5, letterSpacing: '-0.01em',
            ...(msg.role === 'assistant'
              ? { background: 'rgba(12,12,9,0.05)', color: 'var(--t-muted)' }
              : {
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(12,12,9,0.10)',
                  color: 'var(--fg)',
                  boxShadow: 'var(--sh-sm)',
                }),
          }}>
            {msg.content}
          </div>
        </div>
      ))}
    </div>
  )
}

const contactStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  fontSize: 12, color: 'var(--t-subtle)',
  textDecoration: 'none',
  transition: 'color 120ms ease',
}

const chipStyle: React.CSSProperties = {
  fontSize: 11, padding: '3px 9px', borderRadius: 100, fontWeight: 500,
  background: 'rgba(12,12,9,0.06)',
  border: '1px solid rgba(12,12,9,0.09)',
  color: 'var(--t-muted)',
}
