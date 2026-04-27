'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Upload, Search, Filter, ChevronDown,
  Copy, ExternalLink, Loader2, CheckCheck, RefreshCw, X
} from 'lucide-react'
import Link from 'next/link'
import type { OutreachTarget } from '@/lib/prospecting-types'
import { OUTREACH_STATUS_LABELS, SOURCE_LABELS, LIFECYCLE_LABELS } from '@/lib/prospecting-types'
import { PROGRAMAS_30X } from '@/lib/programas-30x'

// ── GenerationPanel ────────────────────────────────────────────

function GenerationPanel({ target, onClose }: { target: OutreachTarget; onClose: () => void }) {
  const [programaSlug, setProgramaSlug] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const generate = async () => {
    setLoading(true)
    setCopied(false)
    try {
      const res = await fetch('/api/b2b/outreach/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, programa_slug: programaSlug || undefined }),
      })
      const data = await res.json()
      if (data.mensaje) {
        setMensaje(data.mensaje)
        if (!programaSlug && data.programa_slug) setProgramaSlug(data.programa_slug)
      }
    } finally {
      setLoading(false)
    }
  }

  const copy = () => {
    navigator.clipboard.writeText(mensaje)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const waLink = target.contacto_whatsapp
    ? `https://wa.me/${target.contacto_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`
    : null

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      style={{
        position: 'sticky', top: 24,
        background: 'var(--bg)',
        border: '1px solid var(--br)',
        borderRadius: 12,
        padding: 22,
        minWidth: 320, maxWidth: 380,
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 2 }}>
            {target.empresa}
          </p>
          <p style={{ fontSize: 12, color: 'var(--t-subtle)' }}>
            {[target.contacto_nombre, target.contacto_cargo].filter(Boolean).join(' · ') || 'Sin contacto'}
          </p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t-ghost)', padding: 4 }}>
          <X size={15} />
        </button>
      </div>

      {/* Program selector */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, color: 'var(--t-ghost)', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
          Programa
        </label>
        <div style={{ position: 'relative' }}>
          <select
            value={programaSlug}
            onChange={e => setProgramaSlug(e.target.value)}
            style={{
              width: '100%', padding: '8px 32px 8px 10px',
              borderRadius: 8, border: '1px solid var(--br)',
              background: 'var(--bg)', color: 'var(--fg)',
              fontSize: 13, appearance: 'none', cursor: 'pointer',
            }}
          >
            <option value="">Auto-detectar por cargo</option>
            {PROGRAMAS_30X.map((p: { slug: string; nombre: string; precio_usd: number }) => (
              <option key={p.slug} value={p.slug}>{p.nombre} — ${p.precio_usd > 0 ? p.precio_usd.toLocaleString() : 'a la medida'}</option>
            ))}
          </select>
          <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--t-ghost)' }} />
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={generate}
        disabled={loading}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '9px 0', borderRadius: 8, marginBottom: 14,
          background: 'var(--fg)', color: 'var(--bg)',
          fontSize: 13, fontWeight: 500, border: 'none', cursor: loading ? 'default' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <MessageSquare size={14} />}
        {loading ? 'Generando...' : mensaje ? 'Regenerar' : 'Generar mensaje'}
      </button>

      {/* Message output */}
      <AnimatePresence>
        {mensaje && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <textarea
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
              rows={6}
              style={{
                width: '100%', padding: '10px 12px',
                borderRadius: 8, border: '1px solid var(--br)',
                background: 'rgba(12,12,9,0.02)', color: 'var(--fg)',
                fontSize: 13, lineHeight: 1.6, resize: 'vertical',
                fontFamily: 'inherit', boxSizing: 'border-box',
                marginBottom: 10,
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={copy}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 0', borderRadius: 8,
                  border: '1px solid var(--br)',
                  background: 'transparent', color: 'var(--fg)',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer',
                }}
              >
                {copied ? <CheckCheck size={13} color="#15803d" /> : <Copy size={13} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px 0', borderRadius: 8,
                    background: '#25D366', color: 'white',
                    fontSize: 12, fontWeight: 500, textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={13} />
                  Abrir WA
                </a>
              )}
            </div>
            {!target.contacto_whatsapp && (
              <p style={{ fontSize: 11, color: 'var(--t-ghost)', marginTop: 8, textAlign: 'center' }}>
                Sin número de WhatsApp registrado
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── TargetRow ──────────────────────────────────────────────────

function TargetRow({ target, selected, onSelect }: {
  target: OutreachTarget
  selected: boolean
  onSelect: () => void
}) {
  const statusMeta = OUTREACH_STATUS_LABELS[target.outreach_status as keyof typeof OUTREACH_STATUS_LABELS]
  const sourceMeta = SOURCE_LABELS[target.source]
  const lifecycleMeta = target.lifecycle_stage ? LIFECYCLE_LABELS[target.lifecycle_stage] : null

  return (
    <motion.div
      layout
      onClick={onSelect}
      style={{
        display: 'grid', gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        padding: '13px 16px',
        borderBottom: '1px solid var(--br)',
        cursor: 'pointer',
        background: selected ? 'rgba(12,12,9,0.04)' : 'transparent',
        transition: 'background 120ms ease',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(12,12,9,0.02)' }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {target.empresa}
          </span>
          <span style={{
            fontSize: 10, padding: '1px 6px', borderRadius: 4,
            background: `${sourceMeta?.color}15`,
            color: sourceMeta?.color ?? 'var(--t-ghost)',
            flexShrink: 0,
          }}>
            {sourceMeta?.label ?? target.source}
          </span>
          {lifecycleMeta && (
            <span style={{
              fontSize: 10, padding: '1px 6px', borderRadius: 4,
              background: `${lifecycleMeta.color}15`,
              color: lifecycleMeta.color,
              flexShrink: 0,
            }}>
              {lifecycleMeta.label}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--t-subtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
          {[target.contacto_nombre, target.contacto_cargo].filter(Boolean).join(' · ') || 'Sin contacto'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--t-ghost)' }}>
            {target.context_badge}
          </span>
          {(target.total_contacts ?? 0) > 1 && (
            <span style={{
              fontSize: 9, padding: '1px 5px', borderRadius: 3,
              background: 'rgba(12,12,9,0.06)', color: 'var(--t-ghost)',
              flexShrink: 0,
            }}>
              {target.total_contacts} contactos
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, paddingLeft: 12 }}>
        <span style={{
          fontSize: 10, padding: '2px 7px', borderRadius: 4,
          background: `${statusMeta?.color}18`,
          color: statusMeta?.color ?? 'var(--t-ghost)',
        }}>
          {statusMeta?.label ?? target.outreach_status}
        </span>
        <MessageSquare size={13} color="var(--t-ghost)" />
      </div>
    </motion.div>
  )
}

// ── OutreachClient (main) ──────────────────────────────────────

type Filters = { source: string; status: string; search: string; lifecycle: string; multiContact: boolean }

export function OutreachClient({ initialTargets }: { initialTargets: OutreachTarget[] }) {
  const [targets, setTargets] = useState(initialTargets)
  const [selected, setSelected] = useState<OutreachTarget | null>(null)
  const [filters, setFilters] = useState<Filters>({ source: '', status: '', search: '', lifecycle: '', multiContact: false })
  const [refreshing, setRefreshing] = useState(false)

  const filtered = useMemo(() => {
    return targets.filter(t => {
      if (filters.source && t.source !== filters.source) return false
      if (filters.status && t.outreach_status !== filters.status) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (!t.empresa.toLowerCase().includes(q) &&
            !(t.contacto_nombre ?? '').toLowerCase().includes(q) &&
            !(t.contacto_email ?? '').toLowerCase().includes(q)) return false
      }
      if (filters.lifecycle === 'customer' && t.lifecycle_stage !== 'customer') return false
      if (filters.lifecycle === 'multi' && (t.total_contacts ?? 0) < 2) return false
      if (filters.lifecycle === 'luma' && !t.has_luma) return false
      if (filters.lifecycle === 'clase_gratis' && !t.has_clase_gratis) return false
      if (filters.lifecycle === 'interesados' && !['opportunity', 'salesqualifiedlead', 'marketingqualifiedlead'].includes(t.lifecycle_stage ?? '')) return false
      if (filters.multiContact && (t.total_contacts ?? 0) < 2) return false
      return true
    })
  }, [targets, filters])

  const refresh = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/b2b/outreach/targets')
      if (res.ok) { const data = await res.json(); setTargets(data) }
    } finally {
      setRefreshing(false)
    }
  }

  const counts = useMemo(() => {
    const bySource: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    let customers = 0, multi = 0, luma = 0, claseGratis = 0, interesados = 0
    for (const t of targets) {
      bySource[t.source] = (bySource[t.source] ?? 0) + 1
      byStatus[t.outreach_status] = (byStatus[t.outreach_status] ?? 0) + 1
      if (t.lifecycle_stage === 'customer') customers++
      if ((t.total_contacts ?? 0) >= 2) multi++
      if (t.has_luma) luma++
      if (t.has_clase_gratis) claseGratis++
      if (['opportunity', 'salesqualifiedlead', 'marketingqualifiedlead'].includes(t.lifecycle_stage ?? '')) interesados++
    }
    return { bySource, byStatus, lifecycle: { customer: customers, multi, luma, clase_gratis: claseGratis, interesados } }
  }, [targets])

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
      {/* Main panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header */}
        <div style={{
          padding: '24px 24px 0',
          borderBottom: '1px solid var(--br)',
          paddingBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 3 }}>Outreach</h1>
              <p style={{ fontSize: 13, color: 'var(--t-subtle)' }}>
                {filtered.length} contactos{targets.length !== filtered.length ? ` de ${targets.length}` : ''}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={refresh}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 7,
                  border: '1px solid var(--br)', background: 'transparent',
                  fontSize: 12, color: 'var(--t-subtle)', cursor: 'pointer',
                }}
              >
                <RefreshCw size={12} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
                Actualizar
              </button>
              <Link
                href="/pipeline/outreach/hubspot/import"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 7,
                  background: 'var(--fg)', color: 'var(--bg)',
                  fontSize: 12, fontWeight: 500, textDecoration: 'none',
                }}
              >
                <Upload size={12} />
                Sincronizar HubSpot
              </Link>
            </div>
          </div>

          {/* Source stats */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {Object.entries(SOURCE_LABELS).map(([key, meta]) => {
              const count = counts.bySource[key] ?? 0
              if (count === 0 && key !== 'pipeline') return null
              const active = filters.source === key
              return (
                <button
                  key={key}
                  onClick={() => setFilters(f => ({ ...f, source: f.source === key ? '' : key }))}
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 12,
                    border: `1px solid ${active ? meta.color : 'var(--br)'}`,
                    background: active ? `${meta.color}12` : 'transparent',
                    color: active ? meta.color : 'var(--t-subtle)',
                    cursor: 'pointer', fontWeight: active ? 600 : 400,
                  }}
                >
                  {meta.label} <span style={{ opacity: 0.6 }}>{count}</span>
                </button>
              )
            })}
          </div>

          {/* Lifecycle filter tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {([
              { key: '', label: 'Todo', count: targets.length },
              { key: 'customer', label: 'Clientes', count: counts.lifecycle.customer },
              { key: 'multi', label: 'Multi-empresa', count: counts.lifecycle.multi },
              { key: 'luma', label: 'Luma', count: counts.lifecycle.luma },
              { key: 'clase_gratis', label: 'Clase gratis', count: counts.lifecycle.clase_gratis },
              { key: 'interesados', label: 'Interesados', count: counts.lifecycle.interesados },
            ] as const).map(({ key, label, count }) => {
              const active = filters.lifecycle === key
              const meta = key && key !== 'multi' && key !== 'interesados' ? LIFECYCLE_LABELS[key] : null
              const activeColor = meta?.color ?? 'var(--fg)'
              return (
                <button
                  key={key}
                  onClick={() => setFilters(f => ({ ...f, lifecycle: f.lifecycle === key ? '' : key }))}
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 12,
                    border: `1px solid ${active ? activeColor : 'var(--br)'}`,
                    background: active && meta ? `${activeColor}12` : active ? 'rgba(12,12,9,0.06)' : 'transparent',
                    color: active ? activeColor : 'var(--t-subtle)',
                    cursor: 'pointer', fontWeight: active ? 600 : 400,
                  }}
                >
                  {label} <span style={{ opacity: 0.6 }}>{count}</span>
                </button>
              )
            })}
          </div>

          {/* Search + status filter */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t-ghost)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Buscar empresa, contacto o email..."
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                style={{
                  width: '100%', padding: '8px 10px 8px 30px',
                  borderRadius: 8, border: '1px solid var(--br)',
                  background: 'var(--bg)', color: 'var(--fg)',
                  fontSize: 13, boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <Filter size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t-ghost)', pointerEvents: 'none' }} />
              <select
                value={filters.status}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                style={{
                  padding: '8px 28px 8px 28px',
                  borderRadius: 8, border: '1px solid var(--br)',
                  background: 'var(--bg)', color: 'var(--fg)',
                  fontSize: 13, appearance: 'none', cursor: 'pointer',
                }}
              >
                <option value="">Todos los estados</option>
                {Object.entries(OUTREACH_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label} ({counts.byStatus[k] ?? 0})</option>
                ))}
              </select>
              <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--t-ghost)' }} />
            </div>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: 'var(--t-ghost)', marginBottom: 8 }}>Sin contactos</p>
              <p style={{ fontSize: 12, color: 'var(--t-ghost)' }}>
                {targets.length === 0
                  ? 'Importa contactos de HubSpot o agrega leads al pipeline.'
                  : 'Ajusta los filtros para ver más resultados.'}
              </p>
            </div>
          ) : (
            filtered.map(t => (
              <TargetRow
                key={t.id}
                target={t}
                selected={selected?.id === t.id}
                onSelect={() => setSelected(prev => prev?.id === t.id ? null : t)}
              />
            ))
          )}
        </div>
      </div>

      {/* Generation panel */}
      <AnimatePresence>
        {selected && (
          <div style={{ padding: 20, borderLeft: '1px solid var(--br)', overflowY: 'auto', width: 380, flexShrink: 0 }}>
            <GenerationPanel target={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
