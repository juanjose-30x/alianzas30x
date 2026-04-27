'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, ChevronDown, ExternalLink, CheckCircle2, Pencil, X, Loader2, Search } from 'lucide-react'
import type { Lead, LeadStatus } from '@/lib/b2b-types'
import { LEAD_STATUS_LABELS } from '@/lib/b2b-types'

interface LeadHeaderProps {
  lead: Lead
  currentStatus: LeadStatus
  onStatusChange: (status: LeadStatus) => void
  updatingStatus: boolean
  onLeadUpdate?: (updated: Partial<Lead>) => void
}

const INPUT: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 7,
  fontSize: 13, color: 'var(--fg)', outline: 'none',
  background: 'var(--bg-card)', border: '1px solid var(--br-mid)',
  fontFamily: 'var(--font-geist), system-ui', letterSpacing: '-0.01em',
}
const LABEL: React.CSSProperties = {
  fontSize: 11, color: 'var(--t-faint)', letterSpacing: '0.06em',
  textTransform: 'uppercase', display: 'block', marginBottom: 5,
}

export function LeadHeader({ lead, currentStatus, onStatusChange, updatingStatus, onLeadUpdate }: LeadHeaderProps) {
  const [copied, setCopied]                 = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [editing, setEditing]               = useState(false)

  // Edit draft state
  const [dEmpresa,   setDEmpresa]   = useState(lead.empresa)
  const [dIndustria, setDIndustria] = useState(lead.industria ?? '')
  const [dPais,      setDPais]      = useState(lead.pais ?? '')
  const [dWebsite,   setDWebsite]   = useState(lead.website ?? '')
  const [dCNombre,   setDCNombre]   = useState(lead.contacto_nombre ?? '')
  const [dCCargo,    setDCCargo]    = useState(lead.contacto_cargo ?? '')
  const [dCEmail,    setDCEmail]    = useState(lead.contacto_email ?? '')
  const [dCWA,       setDCWA]       = useState(lead.contacto_whatsapp ?? '')

  const [savingEdit, setSavingEdit]   = useState(false)
  const [scraping,   setScraping]     = useState(false)
  const [scraped,    setScraped]      = useState(false)

  const empresa        = lead.diagnostico_config.nombre_empresa_display || lead.empresa
  const origin         = typeof window !== 'undefined' ? window.location.origin : 'https://alianzas30x.vercel.app'
  const diagnosticoUrl = `${origin}/${lead.slug}/diagnostico`
  const propuestaUrl   = `/${lead.slug}/propuesta`
  const statusInfo     = LEAD_STATUS_LABELS[currentStatus]

  const copyLink = () => {
    navigator.clipboard.writeText(diagnosticoUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openEdit = () => {
    setDEmpresa(lead.empresa)
    setDIndustria(lead.industria ?? '')
    setDPais(lead.pais ?? '')
    setDWebsite(lead.website ?? '')
    setDCNombre(lead.contacto_nombre ?? '')
    setDCCargo(lead.contacto_cargo ?? '')
    setDCEmail(lead.contacto_email ?? '')
    setDCWA(lead.contacto_whatsapp ?? '')
    setScraped(false)
    setEditing(true)
  }

  const handleScrape = async () => {
    if (!dEmpresa && !dWebsite) return
    setScraping(true)
    setScraped(false)
    try {
      const res = await fetch('/api/b2b/scrape', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa: dEmpresa, website: dWebsite }),
      })
      const data = await res.json()
      if (data.industria) setDIndustria(data.industria)
      if (data.pais)      setDPais(data.pais)
      if (data.website && !dWebsite) setDWebsite(data.website)
      setScraped(true)
    } catch { /* silent */ }
    finally { setScraping(false) }
  }

  const saveEdit = async () => {
    setSavingEdit(true)
    try {
      const patch = {
        empresa: dEmpresa || lead.empresa,
        industria: dIndustria || null,
        pais: dPais || lead.pais,
        website: dWebsite || null,
        contacto_nombre: dCNombre || null,
        contacto_cargo: dCCargo || null,
        contacto_email: dCEmail || null,
        contacto_whatsapp: dCWA || null,
      }
      const res = await fetch(`/api/b2b/leads/${lead.slug}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (res.ok) {
        onLeadUpdate?.(patch)
        setEditing(false)
      }
    } catch { /* silent */ }
    finally { setSavingEdit(false) }
  }

  return (
    <div style={{ paddingTop: '4rem', paddingBottom: '3rem', borderBottom: '1px solid var(--br)' }}>

      {/* Status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: statusInfo.color, flexShrink: 0,
          boxShadow: `0 0 0 2px ${statusInfo.color}22`,
        }} />
        <span className="label-caps">{statusInfo.label}</span>
      </div>

      {/* Company name — editorial scale */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' as const, marginBottom: '1.25rem' }}>
        <h1 style={{
          fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color: 'var(--fg)',
          fontFamily: 'var(--font-geist), system-ui',
        }}>
          {empresa}
        </h1>

        {/* Edit button */}
        <button
          onClick={openEdit}
          title="Editar datos del lead"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 12px', borderRadius: 6,
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            background: 'var(--bg-card)', color: 'var(--t-subtle)',
            border: '1px solid var(--br-mid)', boxShadow: 'var(--sh-sm)',
            fontFamily: 'var(--font-geist), system-ui',
          }}
        >
          <Pencil size={11} strokeWidth={2} /> Editar
        </button>

        {/* Status picker */}
        <div style={{ position: 'relative' as const, flexShrink: 0 }}>
          <button
            onClick={() => setShowStatusMenu(v => !v)}
            disabled={updatingStatus}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 6,
              fontSize: 12, fontWeight: 500, letterSpacing: '-0.01em',
              cursor: 'pointer',
              background: 'var(--bg-card)',
              color: 'var(--t-subtle)',
              border: '1px solid var(--br-mid)',
              boxShadow: 'var(--sh-sm)',
              transition: 'border-color 130ms ease, color 130ms ease',
              fontFamily: 'var(--font-geist), system-ui',
            }}
          >
            {updatingStatus ? '…' : 'Cambiar estado'}
            <ChevronDown size={11} strokeWidth={2} />
          </button>

          <AnimatePresence>
            {showStatusMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  position: 'absolute' as const, right: 0, top: '100%', marginTop: 8,
                  borderRadius: 10, overflow: 'hidden' as const, zIndex: 50, minWidth: 210,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--br-mid)',
                  boxShadow: 'var(--sh-md)',
                  transformOrigin: 'top right',
                }}
              >
                {(Object.entries(LEAD_STATUS_LABELS) as [LeadStatus, { label: string; color: string }][]).map(([s, info]) => (
                  <button
                    key={s}
                    onClick={() => { onStatusChange(s); setShowStatusMenu(false) }}
                    style={{
                      width: '100%', textAlign: 'left' as const,
                      padding: '10px 14px', fontSize: 13,
                      display: 'flex', alignItems: 'center', gap: 10,
                      color: s === currentStatus ? info.color : 'var(--t-subtle)',
                      background: 'transparent',
                      border: 'none', cursor: 'pointer',
                      transition: 'background 100ms ease',
                      fontFamily: 'var(--font-geist), system-ui',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(12,12,9,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: info.color, flexShrink: 0 }} />
                    {info.label}
                    {s === currentStatus && <CheckCircle2 size={11} style={{ marginLeft: 'auto' }} />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Meta: industry, country, slug */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap' as const }}>
        {lead.industria && <span style={{ fontSize: 13, color: 'var(--t-subtle)', letterSpacing: '-0.01em' }}>{lead.industria}</span>}
        {lead.pais && <span style={{ fontSize: 13, color: 'var(--t-faint)' }}>{lead.pais}</span>}
        <span style={{ fontSize: 12, color: 'var(--t-ghost)', fontFamily: 'var(--font-geist-mono), monospace' }}>
          /{lead.slug}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
        <a
          href={propuestaUrl}
          className="btn-primary"
        >
          Ver propuesta
        </a>

        <button
          onClick={copyLink}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 18px', borderRadius: 8,
            fontSize: 13, fontWeight: 500, letterSpacing: '-0.01em', cursor: 'pointer',
            background: copied ? 'var(--c-success-surface)' : 'var(--bg-card)',
            color: copied ? 'var(--c-success)' : 'var(--t-subtle)',
            border: `1px solid ${copied ? 'var(--c-success-border)' : 'var(--br-mid)'}`,
            boxShadow: 'var(--sh-sm)',
            transition: 'background 200ms var(--ease-out), color 200ms var(--ease-out), border-color 200ms var(--ease-out), transform 150ms var(--ease-out)',
            fontFamily: 'var(--font-geist), system-ui',
          }}
        >
          {copied ? <><Check size={13} strokeWidth={2.5} /> Copiado</> : <><Copy size={13} strokeWidth={2} /> Copiar link diagnóstico</>}
        </button>
      </div>

      {/* URL bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderRadius: 8, marginTop: 12,
        background: 'rgba(12,12,9,0.03)',
        border: '1px solid var(--br)',
      }}>
        <span style={{
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: 11, color: 'var(--t-faint)', flex: 1, overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
        }}>
          {diagnosticoUrl}
        </span>
        <a
          href={diagnosticoUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--t-faint)', flexShrink: 0, display: 'flex' }}
        >
          <ExternalLink size={12} strokeWidth={2} />
        </a>
      </div>

      {/* Inline edit panel */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              marginTop: 20, borderRadius: 12, padding: '20px 20px',
              background: 'var(--bg-card)', border: '1px solid var(--br-mid)',
              boxShadow: 'var(--sh-sm)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg)', letterSpacing: '-0.02em' }}>Editar lead</span>
                <button onClick={() => setEditing(false)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t-faint)', display: 'flex' }}>
                  <X size={15} strokeWidth={2} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Empresa */}
                <div>
                  <label style={LABEL}>Empresa</label>
                  <input style={INPUT} value={dEmpresa} onChange={e => setDEmpresa(e.target.value)} />
                </div>

                {/* Website + scrape */}
                <div>
                  <label style={LABEL}>Website</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input style={{ ...INPUT, flex: 1 }} placeholder="https://empresa.com" value={dWebsite} onChange={e => { setDWebsite(e.target.value); setScraped(false) }} />
                    <button
                      onClick={handleScrape}
                      disabled={scraping}
                      style={{
                        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                        padding: '9px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                        cursor: 'pointer',
                        background: scraped ? 'var(--c-success-surface)' : 'rgba(12,12,9,0.04)',
                        color: scraped ? 'var(--c-success)' : 'var(--t-subtle)',
                        border: `1px solid ${scraped ? 'var(--c-success-border)' : 'var(--br)'}`,
                        fontFamily: 'var(--font-geist), system-ui',
                      }}
                    >
                      {scraping ? <Loader2 size={12} className="animate-spin" /> : scraped ? <Check size={12} /> : <Search size={12} />}
                    </button>
                  </div>
                </div>

                {/* Industria + Pais */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={LABEL}>Industria</label>
                    <input style={INPUT} placeholder="Retail…" value={dIndustria} onChange={e => setDIndustria(e.target.value)} />
                  </div>
                  <div>
                    <label style={LABEL}>País</label>
                    <input style={INPUT} value={dPais} onChange={e => setDPais(e.target.value)} />
                  </div>
                </div>

                {/* Separador contacto */}
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t-ghost)', paddingTop: 4, borderTop: '1px solid var(--br)' }}>
                  Contacto principal
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={LABEL}>Nombre</label>
                    <input style={INPUT} placeholder="Carlos Gómez" value={dCNombre} onChange={e => setDCNombre(e.target.value)} />
                  </div>
                  <div>
                    <label style={LABEL}>Cargo</label>
                    <input style={INPUT} placeholder="Director Comercial" value={dCCargo} onChange={e => setDCCargo(e.target.value)} />
                  </div>
                  <div>
                    <label style={LABEL}>Email</label>
                    <input style={INPUT} placeholder="carlos@empresa.com" value={dCEmail} onChange={e => setDCEmail(e.target.value)} />
                  </div>
                  <div>
                    <label style={LABEL}>WhatsApp</label>
                    <input style={INPUT} placeholder="+57 300 000 0000" value={dCWA} onChange={e => setDCWA(e.target.value)} />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                  <button
                    onClick={saveEdit}
                    disabled={savingEdit}
                    className="btn-primary"
                    style={{ opacity: savingEdit ? 0.5 : 1 }}
                  >
                    {savingEdit ? <><Loader2 size={12} className="animate-spin" /> Guardando…</> : <><Check size={12} strokeWidth={2.5} /> Guardar</>}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    style={{
                      padding: '9px 16px', borderRadius: 8, fontSize: 13, border: '1px solid var(--br-mid)',
                      background: 'transparent', color: 'var(--t-subtle)', cursor: 'pointer',
                      fontFamily: 'var(--font-geist), system-ui',
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
