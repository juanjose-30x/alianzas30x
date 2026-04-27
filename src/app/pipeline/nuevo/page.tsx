'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Loader2, Sparkles, Check, AlertCircle,
  ChevronDown, ChevronUp, Search, CheckCircle2
} from 'lucide-react'
import { AREAS } from '@/lib/areas'
import type { DiscoveryData, DecisionMaker, PainPoint } from '@/lib/b2b-types'
import { LEAD_STATUS_LABELS } from '@/lib/b2b-types'

const statusOptions = Object.entries(LEAD_STATUS_LABELS).map(([value, { label }]) => ({ value, label }))

const S = {
  nav: {
    position: 'sticky' as const, top: 0, zIndex: 40,
    background: 'rgba(243,242,238,0.88)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(12,12,9,0.09)',
  },
  navInner: {
    maxWidth: '40rem', margin: '0 auto',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 2.5rem', height: 52,
  },
  wrap: { maxWidth: '40rem', margin: '0 auto', padding: '0 2.5rem', paddingBottom: '6rem' },
  label: {
    fontSize: 11, color: 'var(--t-faint)', letterSpacing: '0.06em',
    textTransform: 'uppercase' as const, display: 'block', marginBottom: 6,
  },
  input: {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    fontSize: 13, color: 'var(--fg)', outline: 'none',
    background: 'var(--bg-card)', border: '1px solid var(--br-mid)',
    boxShadow: 'var(--sh-sm)', letterSpacing: '-0.01em',
    fontFamily: 'var(--font-geist), system-ui',
  } as React.CSSProperties,
}

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

export default function NuevoLeadPage() {
  const [empresa,          setEmpresa]          = useState('')
  const [slug,             setSlug]             = useState('')
  const [industria,        setIndustria]        = useState('')
  const [pais,             setPais]             = useState('Colombia')
  const [website,          setWebsite]          = useState('')
  const [contactoNombre,   setContactoNombre]   = useState('')
  const [contactoEmail,    setContactoEmail]    = useState('')
  const [contactoCargo,    setContactoCargo]    = useState('')
  const [contactoWhatsapp, setContactoWhatsapp] = useState('')
  const [initialStatus,    setInitialStatus]    = useState('discovery')

  const [transcript,  setTranscript]  = useState('')
  const [parsing,     setParsing]     = useState(false)
  const [discovery,   setDiscovery]   = useState<DiscoveryData | null>(null)
  const [parseError,  setParseError]  = useState('')

  const [scraping,     setScraping]     = useState(false)
  const [scraped,      setScraped]      = useState(false)
  const [scrapeError,  setScrapeError]  = useState('')

  const [showContact,    setShowContact]    = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)

  const [saving,      setSaving]      = useState(false)
  const [done,        setDone]        = useState(false)
  const [createdSlug, setCreatedSlug] = useState('')

  const handleEmpresaChange = (v: string) => {
    setEmpresa(v)
    setSlug(slugify(v))
    setScraped(false)
  }

  const handleScrape = async () => {
    if (!empresa && !website) return
    setScraping(true)
    setScrapeError('')
    setScraped(false)
    try {
      const res = await fetch('/api/b2b/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa, website }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (data.industria) setIndustria(data.industria)
      if (data.pais) setPais(data.pais)
      if (data.website && !website) setWebsite(data.website)
      setScraped(true)
    } catch (e) {
      setScrapeError(e instanceof Error ? e.message : 'Error al buscar empresa')
    } finally {
      setScraping(false)
    }
  }

  const parseGrain = async () => {
    if (!transcript.trim()) return
    setParsing(true)
    setParseError('')
    try {
      const res = await fetch('/api/b2b/grain/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, empresa }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDiscovery(data)
      if (data.contexto_empresa && !industria) setIndustria('')
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Error al parsear transcript')
    } finally {
      setParsing(false)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/b2b/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug, empresa,
          industria: industria || undefined,
          pais,
          website: website || undefined,
          contacto_nombre: contactoNombre || undefined,
          contacto_email: contactoEmail || undefined,
          contacto_cargo: contactoCargo || undefined,
          contacto_whatsapp: contactoWhatsapp || undefined,
          grain_transcript: transcript || undefined,
          discovery_data: discovery ?? undefined,
          status: initialStatus,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCreatedSlug(data.slug)
      setDone(true)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al crear lead')
    } finally {
      setSaving(false)
    }
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  if (done) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', maxWidth: 400, padding: '0 2.5rem' }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--c-success-surface)', border: '1px solid var(--c-success-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
          }}>
            <Check size={22} color="var(--c-success)" strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--fg)', marginBottom: 6 }}>
            Lead creado
          </h2>
          <p style={{ fontSize: 13, color: 'var(--t-subtle)', marginBottom: '2rem' }}>
            Comparte el link de diagnóstico con los gerentes.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', marginBottom: '2rem' }}>
            {[
              { label: 'Link diagnóstico (gerentes)', url: `${origin}/${createdSlug}/diagnostico` },
              { label: 'Link propuesta (interno)', url: `${origin}/${createdSlug}/propuesta` },
            ].map(({ label, url }) => (
              <div key={label} style={{ borderRadius: 8, padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--br)', boxShadow: 'var(--sh-sm)' }}>
                <p style={{ fontSize: 11, color: 'var(--t-faint)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <code style={{ fontSize: 11, color: 'var(--t-subtle)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-geist-mono), monospace' }}>
                    {url}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(url)}
                    style={{
                      fontSize: 11, padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                      background: 'var(--fg)', color: '#ffffff', flexShrink: 0,
                      fontFamily: 'var(--font-geist), system-ui', fontWeight: 500,
                    }}
                  >
                    Copiar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <a href="/pipeline" style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, color: 'var(--t-subtle)', border: '1px solid var(--br-mid)', textDecoration: 'none', background: 'var(--bg-card)' }}>
              Ver pipeline
            </a>
            <a href={`/pipeline/${createdSlug}`} className="btn-primary">
              Ver lead <ArrowRight size={13} />
            </a>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh' }}>

      {/* NAV */}
      <header style={S.nav}>
        <div style={S.navInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href="/pipeline" style={{ color: 'var(--t-subtle)', fontSize: 13, letterSpacing: '-0.01em', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--fg)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--t-subtle)')}
            >
              Pipeline
            </a>
            <span style={{ color: 'rgba(12,12,9,0.18)', fontSize: 14, margin: '0 2px' }}>/</span>
            <span style={{ color: 'var(--t-subtle)', fontSize: 13, letterSpacing: '-0.01em' }}>Nuevo lead</span>
          </div>
        </div>
      </header>

      <div style={S.wrap}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
          style={{ paddingTop: '4rem', display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          <div>
            <p className="label-caps" style={{ marginBottom: '1rem' }}>Nueva empresa</p>
            <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--fg)', marginBottom: '0.25rem' }}>
              Agregar lead
            </h1>
            <p style={{ fontSize: 13, color: 'var(--t-subtle)' }}>
              Solo el nombre es obligatorio. Lo demás puedes editarlo después.
            </p>
          </div>

          {/* Core fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Empresa */}
            <div>
              <label style={S.label}>Empresa *</label>
              <input
                style={S.input}
                placeholder="Ej: Colsubsidio"
                value={empresa}
                onChange={e => handleEmpresaChange(e.target.value)}
                autoFocus
              />
              {slug && (
                <p style={{ fontSize: 11, color: 'var(--t-ghost)', marginTop: 4, fontFamily: 'var(--font-geist-mono), monospace' }}>
                  /{slug}/diagnostico
                </p>
              )}
            </div>

            {/* Website + auto-scrape */}
            <div>
              <label style={S.label}>Website</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...S.input, flex: 1 }}
                  placeholder="https://empresa.com"
                  value={website}
                  onChange={e => { setWebsite(e.target.value); setScraped(false) }}
                />
                <button
                  onClick={handleScrape}
                  disabled={scraping || (!empresa && !website)}
                  title="Buscar información de la empresa"
                  style={{
                    flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                    cursor: (!empresa && !website) ? 'not-allowed' : 'pointer',
                    background: scraped ? 'var(--c-success-surface)' : 'var(--bg-card)',
                    color: scraped ? 'var(--c-success)' : 'var(--t-subtle)',
                    border: `1px solid ${scraped ? 'var(--c-success-border)' : 'var(--br-mid)'}`,
                    boxShadow: 'var(--sh-sm)',
                    transition: 'all 150ms ease',
                    opacity: (!empresa && !website) ? 0.4 : 1,
                    fontFamily: 'var(--font-geist), system-ui',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {scraping
                    ? <Loader2 size={13} className="animate-spin" />
                    : scraped
                      ? <><CheckCircle2 size={13} /> Encontrado</>
                      : <><Search size={13} /> Autocompletar</>
                  }
                </button>
              </div>
              {scrapeError && (
                <p style={{ fontSize: 11, color: 'var(--c-danger)', marginTop: 4 }}>{scrapeError}</p>
              )}
              {scraped && (
                <p style={{ fontSize: 11, color: 'var(--c-success)', marginTop: 4 }}>
                  Industria y país autocompletados desde el website.
                </p>
              )}
            </div>

            {/* Industria + Pais */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={S.label}>Industria</label>
                <input style={S.input} placeholder="Retail, Manufactura…" value={industria} onChange={e => setIndustria(e.target.value)} />
              </div>
              <div>
                <label style={S.label}>País</label>
                <input style={S.input} value={pais} onChange={e => setPais(e.target.value)} />
              </div>
            </div>

            {/* Estado inicial */}
            <div>
              <label style={S.label}>Estado inicial</label>
              <select
                style={{ ...S.input, cursor: 'pointer' }}
                value={initialStatus}
                onChange={e => setInitialStatus(e.target.value)}
              >
                {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Contacto (collapsible) */}
          <div style={{ borderTop: '1px solid var(--br)' }}>
            <button
              onClick={() => setShowContact(v => !v)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 0', background: 'transparent', border: 'none', cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-subtle)', letterSpacing: '-0.01em' }}>
                Contacto principal
              </span>
              {showContact
                ? <ChevronUp size={14} strokeWidth={2} color="var(--t-faint)" />
                : <ChevronDown size={14} strokeWidth={2} color="var(--t-faint)" />
              }
            </button>
            <AnimatePresence>
              {showContact && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingBottom: 16 }}>
                    {[
                      { label: 'Nombre', value: contactoNombre, set: setContactoNombre, placeholder: 'Carlos Gómez' },
                      { label: 'Cargo',  value: contactoCargo,  set: setContactoCargo,  placeholder: 'Director Comercial' },
                      { label: 'Email',  value: contactoEmail,  set: setContactoEmail,  placeholder: 'carlos@empresa.com' },
                      { label: 'WhatsApp', value: contactoWhatsapp, set: setContactoWhatsapp, placeholder: '+57 300 000 0000' },
                    ].map(({ label, value, set, placeholder }) => (
                      <div key={label}>
                        <label style={S.label}>{label}</label>
                        <input style={S.input} placeholder={placeholder} value={value} onChange={e => set(e.target.value)} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Transcript Grain (collapsible) */}
          <div style={{ borderTop: '1px solid var(--br)' }}>
            <button
              onClick={() => setShowTranscript(v => !v)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 0', background: 'transparent', border: 'none', cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-subtle)', letterSpacing: '-0.01em' }}>
                Transcript Grain <span style={{ fontWeight: 400, color: 'var(--t-ghost)' }}>— opcional</span>
              </span>
              {showTranscript
                ? <ChevronUp size={14} strokeWidth={2} color="var(--t-faint)" />
                : <ChevronDown size={14} strokeWidth={2} color="var(--t-faint)" />
              }
            </button>
            <AnimatePresence>
              {showTranscript && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <textarea
                      style={{
                        ...S.input,
                        minHeight: 160, resize: 'vertical',
                        lineHeight: 1.6, padding: '12px 14px',
                      }}
                      placeholder={`[00:00:15] Juan José: Cuéntame sobre su empresa...\n[00:01:00] Carlos: Somos una empresa de...`}
                      value={transcript}
                      onChange={e => { setTranscript(e.target.value); setDiscovery(null) }}
                    />

                    {parseError && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8,
                        background: 'var(--c-danger-surface)', border: '1px solid var(--c-danger-border)',
                      }}>
                        <AlertCircle size={13} color="var(--c-danger)" />
                        <span style={{ fontSize: 13, color: 'var(--c-danger)' }}>{parseError}</span>
                      </div>
                    )}

                    {!discovery ? (
                      <button
                        onClick={parseGrain}
                        disabled={parsing || !transcript.trim()}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
                          padding: '9px 18px', borderRadius: 8,
                          fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          background: 'var(--bg-card)', color: 'var(--fg)',
                          border: '1px solid var(--br-mid)', boxShadow: 'var(--sh-sm)',
                          opacity: (parsing || !transcript.trim()) ? 0.35 : 1,
                          fontFamily: 'var(--font-geist), system-ui',
                        }}
                      >
                        {parsing
                          ? <><Loader2 size={13} className="animate-spin" /> Analizando…</>
                          : <><Sparkles size={13} /> Analizar con Claude</>}
                      </button>
                    ) : (
                      <DiscoveryPreview discovery={discovery} onChange={setDiscovery} />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CTA */}
          <div style={{ paddingTop: 8, borderTop: '1px solid var(--br)' }}>
            <button
              onClick={handleSubmit}
              disabled={saving || !empresa || !slug}
              className="btn-primary"
              style={{ opacity: (saving || !empresa || !slug) ? 0.35 : 1, cursor: (saving || !empresa || !slug) ? 'not-allowed' : 'pointer' }}
            >
              {saving
                ? <><Loader2 size={13} className="animate-spin" /> Creando…</>
                : <>Crear lead <ArrowRight size={13} strokeWidth={2.5} /></>
              }
            </button>
          </div>

        </motion.div>
      </div>
    </div>
  )
}

function DiscoveryPreview({ discovery, onChange }: { discovery: DiscoveryData; onChange: (d: DiscoveryData) => void }) {
  const [open, setOpen] = useState(true)

  return (
    <div style={{
      borderRadius: 10, overflow: 'hidden',
      border: '1px solid var(--c-success-border)',
      background: 'var(--c-success-surface)',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Check size={13} color="var(--c-success)" strokeWidth={2.5} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)', letterSpacing: '-0.02em' }}>
            Claude extrajo el contexto
          </span>
          <span style={{ fontSize: 12, color: 'var(--t-subtle)' }}>
            {discovery.areas_identificadas.length} áreas · {discovery.decision_makers.length} DMs
          </span>
        </div>
        {open
          ? <ChevronUp size={14} strokeWidth={2} color="var(--t-faint)" />
          : <ChevronDown size={14} strokeWidth={2} color="var(--t-faint)" />
        }
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--c-success-border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--t-faint)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Áreas</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {AREAS.map(area => {
                const selected = discovery.areas_identificadas.includes(area.id)
                return (
                  <button
                    key={area.id}
                    onClick={() => {
                      const next = selected
                        ? discovery.areas_identificadas.filter(a => a !== area.id)
                        : [...discovery.areas_identificadas, area.id]
                      onChange({ ...discovery, areas_identificadas: next })
                    }}
                    style={{
                      fontSize: 12, padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
                      border: `1px solid ${selected ? 'var(--c-success-border)' : 'var(--br)'}`,
                      background: selected ? 'var(--c-success-surface)' : 'var(--bg-card)',
                      color: selected ? 'var(--c-success)' : 'var(--t-subtle)',
                      fontFamily: 'var(--font-geist), system-ui',
                    }}
                  >
                    {area.nombre}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p style={{ fontSize: 11, color: 'var(--t-faint)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Contexto</p>
            <textarea
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 12,
                color: 'var(--fg)', background: 'var(--bg-card)', border: '1px solid var(--br)',
                outline: 'none', resize: 'vertical', minHeight: 64, lineHeight: 1.55,
                fontFamily: 'var(--font-geist), system-ui',
              }}
              value={discovery.contexto_empresa}
              onChange={e => onChange({ ...discovery, contexto_empresa: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
