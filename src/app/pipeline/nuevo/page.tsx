'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Check, AlertCircle, Users, MapPin, ChevronDown, ChevronUp } from 'lucide-react'
import { AREAS } from '@/lib/areas'
import type { DiscoveryData, DecisionMaker, PainPoint, RolMencionado } from '@/lib/b2b-types'
import { LEAD_STATUS_LABELS } from '@/lib/b2b-types'

const statusOptions = Object.entries(LEAD_STATUS_LABELS).map(([value, { label }]) => ({ value, label }))

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

export default function NuevoLeadPage() {
  const [step, setStep] = useState<'datos' | 'grain' | 'confirm'>('datos')

  // Datos básicos
  const [empresa, setEmpresa] = useState('')
  const [slug, setSlug] = useState('')
  const [industria, setIndustria] = useState('')
  const [pais, setPais] = useState('Colombia')
  const [website, setWebsite] = useState('')
  const [contactoNombre, setContactoNombre] = useState('')
  const [contactoEmail, setContactoEmail] = useState('')
  const [contactoCargo, setContactoCargo] = useState('')
  const [contactoWhatsapp, setContactoWhatsapp] = useState('')
  const [dealValue, setDealValue] = useState('')
  const [initialStatus, setInitialStatus] = useState('discovery')

  // Grain
  const [transcript, setTranscript] = useState('')
  const [parsing, setParsing] = useState(false)
  const [discovery, setDiscovery] = useState<DiscoveryData | null>(null)
  const [parseError, setParseError] = useState('')

  // Submit
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [createdSlug, setCreatedSlug] = useState('')

  const handleEmpresaChange = (v: string) => {
    setEmpresa(v)
    setSlug(slugify(v))
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
          slug,
          empresa,
          industria: industria || undefined,
          pais,
          website: website || undefined,
          contacto_nombre: contactoNombre || undefined,
          contacto_email: contactoEmail || undefined,
          contacto_cargo: contactoCargo || undefined,
          contacto_whatsapp: contactoWhatsapp || undefined,
          deal_value_usd: dealValue ? Number(dealValue) : undefined,
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-md px-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)' }}>
            <Check size={28} style={{ color: '#34D399' }} />
          </div>
          <div>
            <h2 className="text-white text-2xl font-bold mb-2" style={{ fontFamily: 'Inter Tight, sans-serif' }}>Lead creado</h2>
            <p className="text-white/50 text-sm">Ya puedes compartir el link de diagnóstico.</p>
          </div>
          <div className="space-y-3 text-left">
            {[
              { label: 'Link diagnóstico (para los gerentes)', url: `${origin}/${createdSlug}/diagnostico` },
              { label: 'Link propuesta (solo tú)', url: `${origin}/${createdSlug}/propuesta` },
            ].map(({ label, url }) => (
              <div key={label} className="rounded-xl p-4 space-y-2"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-white/40 text-xs">{label}</p>
                <div className="flex items-center gap-2">
                  <code className="text-white/80 text-xs flex-1 truncate">{url}</code>
                  <button onClick={() => navigator.clipboard.writeText(url)}
                    className="text-xs px-3 py-1 rounded-full shrink-0 font-medium"
                    style={{ background: '#E9FF7B', color: '#0a0a0a' }}>
                    Copiar
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <a href="/pipeline" className="px-5 py-2 rounded-full text-sm text-white/60"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Ver pipeline</a>
            <a href={`/pipeline/${createdSlug}`} className="px-5 py-2 rounded-full text-sm font-bold"
              style={{ background: '#E9FF7B', color: '#0a0a0a', fontFamily: 'Inter Tight' }}>
              Ver lead →
            </a>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', fontFamily: 'Figtree, sans-serif' }}>
      <nav className="sticky top-0 z-40 flex items-center gap-4 px-6 py-4"
        style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <a href="/pipeline" className="text-white/40 hover:text-white/70 transition-colors"><ArrowLeft size={18} /></a>
        <span className="text-white font-bold text-sm" style={{ fontFamily: 'Inter Tight, sans-serif' }}>Nuevo lead</span>
        {/* Steps */}
        <div className="flex items-center gap-2 ml-auto">
          {(['datos', 'grain', 'confirm'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={step === s ? { background: '#E9FF7B', color: '#0a0a0a' }
                  : ((['datos', 'grain'].indexOf(s) < ['datos', 'grain', 'confirm'].indexOf(step))
                    ? { background: 'rgba(52,211,153,0.2)', color: '#34D399' }
                    : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' })}>
                {i + 1}
              </div>
              <span className="text-xs hidden sm:block"
                style={{ color: step === s ? '#E9FF7B' : 'rgba(255,255,255,0.3)' }}>
                {s === 'datos' ? 'Datos' : s === 'grain' ? 'Transcript' : 'Confirmar'}
              </span>
            </div>
          ))}
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">

        <AnimatePresence mode="wait">

          {/* STEP 1: DATOS BÁSICOS */}
          {step === 'datos' && (
            <motion.div key="datos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Inter Tight, sans-serif' }}>Datos del lead</h1>
                <p className="text-white/40 text-sm">Información básica de la empresa prospecto.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-white/40 text-xs block mb-1.5">Empresa *</label>
                    <input className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      placeholder="Ej: Colsubsidio" value={empresa} onChange={e => handleEmpresaChange(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs block mb-1.5">Slug (URL) *</label>
                    <input className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none font-mono"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      placeholder="colsubsidio" value={slug} onChange={e => setSlug(e.target.value)} />
                    {slug && <p className="text-white/25 text-xs mt-1">/{slug}/diagnostico</p>}
                  </div>
                  <div>
                    <label className="text-white/40 text-xs block mb-1.5">Estado inicial</label>
                    <select className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      value={initialStatus} onChange={e => setInitialStatus(e.target.value)}>
                      {statusOptions.map(o => <option key={o.value} value={o.value} style={{ background: '#111' }}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs block mb-1.5">Industria</label>
                    <input className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      placeholder="Retail, Manufactura..." value={industria} onChange={e => setIndustria(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs block mb-1.5">País</label>
                    <input className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      value={pais} onChange={e => setPais(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs block mb-1.5">Website</label>
                    <input className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      placeholder="https://..." value={website} onChange={e => setWebsite(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs block mb-1.5">Deal value estimado (USD)</label>
                    <input type="number" className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                      placeholder="50000" value={dealValue} onChange={e => setDealValue(e.target.value)} />
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-white/30 text-xs uppercase tracking-widest mb-3">Contacto principal</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Nombre', value: contactoNombre, set: setContactoNombre, placeholder: 'Carlos Gómez' },
                      { label: 'Cargo', value: contactoCargo, set: setContactoCargo, placeholder: 'Director Comercial' },
                      { label: 'Email', value: contactoEmail, set: setContactoEmail, placeholder: 'carlos@empresa.com' },
                      { label: 'WhatsApp', value: contactoWhatsapp, set: setContactoWhatsapp, placeholder: '+57 300 000 0000' },
                    ].map(({ label, value, set, placeholder }) => (
                      <div key={label}>
                        <label className="text-white/40 text-xs block mb-1.5">{label}</label>
                        <input className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                          placeholder={placeholder} value={value} onChange={e => set(e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={() => setStep('grain')} disabled={!empresa || !slug}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-30"
                style={{ background: '#E9FF7B', color: '#0a0a0a', fontFamily: 'Inter Tight' }}>
                Siguiente: transcript de Grain <ArrowRight size={15} />
              </button>
            </motion.div>
          )}

          {/* STEP 2: GRAIN */}
          {step === 'grain' && (
            <motion.div key="grain" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Inter Tight, sans-serif' }}>Transcript de Grain</h1>
                <p className="text-white/40 text-sm">Pega el transcript de la discovery call. Claude extrae áreas, roles, pain points y decision makers.</p>
              </div>

              <textarea
                className="w-full px-4 py-3 rounded-xl text-white/80 text-sm outline-none resize-none leading-relaxed"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', minHeight: 200 }}
                placeholder={`[00:00:15] Juan José: Cuéntame sobre su empresa...\n[00:01:00] Carlos: Somos una empresa de...\n\nO pega el texto directamente sin timestamps.`}
                value={transcript}
                onChange={e => { setTranscript(e.target.value); setDiscovery(null) }}
              />

              {parseError && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <AlertCircle size={14} style={{ color: '#f87171' }} />
                  <span className="text-sm" style={{ color: '#f87171' }}>{parseError}</span>
                </div>
              )}

              {!discovery ? (
                <button onClick={parseGrain} disabled={parsing || !transcript.trim()}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                  style={{ background: 'rgba(233,255,123,0.1)', color: '#E9FF7B', border: '1px solid rgba(233,255,123,0.2)', fontFamily: 'Inter Tight' }}>
                  {parsing ? <><Loader2 size={15} className="animate-spin" /> Analizando con Claude...</> : <><Sparkles size={15} /> Analizar transcript</>}
                </button>
              ) : (
                <DiscoveryPreview discovery={discovery} onChange={setDiscovery} />
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep('datos')} className="flex-1 py-3 rounded-xl text-sm text-white/50"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  ← Volver
                </button>
                <button onClick={() => setStep('confirm')}
                  className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: '#E9FF7B', color: '#0a0a0a', fontFamily: 'Inter Tight' }}>
                  {discovery ? 'Continuar con datos extraídos' : 'Continuar sin transcript'} <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: CONFIRM */}
          {step === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Inter Tight, sans-serif' }}>Confirmar lead</h1>
                <p className="text-white/40 text-sm">Revisa antes de crear.</p>
              </div>

              <div className="rounded-2xl p-5 space-y-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['Empresa', empresa],
                    ['Slug', `/${slug}/...`],
                    ['Industria', industria || '—'],
                    ['País', pais],
                    ['Contacto', contactoNombre || '—'],
                    ['Deal value', dealValue ? `$${Number(dealValue).toLocaleString()} USD` : '—'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-white/30 text-xs mb-0.5">{label}</p>
                      <p className="text-white font-medium">{value}</p>
                    </div>
                  ))}
                </div>
                {discovery && (
                  <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-white/30 text-xs mb-2">Áreas identificadas por Claude</p>
                    <div className="flex flex-wrap gap-2">
                      {discovery.areas_identificadas.map(id => {
                        const area = AREAS.find(a => a.id === id)
                        return area ? (
                          <span key={id} className="text-xs px-3 py-1 rounded-full text-white/70"
                            style={{ background: 'rgba(255,255,255,0.06)' }}>
                            {area.emoji} {area.nombre}
                          </span>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('grain')} className="flex-1 py-3 rounded-xl text-sm text-white/50"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  ← Volver
                </button>
                <button onClick={handleSubmit} disabled={saving}
                  className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: '#E9FF7B', color: '#0a0a0a', fontFamily: 'Inter Tight' }}>
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Creando...</> : 'Crear lead →'}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

// Preview editable del discovery extraído
function DiscoveryPreview({ discovery, onChange }: { discovery: DiscoveryData; onChange: (d: DiscoveryData) => void }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(52,211,153,0.2)', background: 'rgba(52,211,153,0.03)' }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <Check size={14} style={{ color: '#34D399' }} />
          <span className="text-white font-semibold text-sm" style={{ fontFamily: 'Inter Tight' }}>Claude extrajo el contexto</span>
          <span className="text-white/40 text-xs">
            {discovery.areas_identificadas.length} áreas · {discovery.decision_makers.length} decision makers
          </span>
        </div>
        {open ? <ChevronUp size={14} className="text-white/40" /> : <ChevronDown size={14} className="text-white/40" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Áreas */}
          <div>
            <p className="text-white/40 text-xs mb-2 mt-4">Áreas identificadas</p>
            <div className="flex flex-wrap gap-2">
              {AREAS.map(area => {
                const selected = discovery.areas_identificadas.includes(area.id)
                return (
                  <button key={area.id} onClick={() => {
                    const next = selected
                      ? discovery.areas_identificadas.filter(a => a !== area.id)
                      : [...discovery.areas_identificadas, area.id]
                    onChange({ ...discovery, areas_identificadas: next })
                  }}
                    className="text-xs px-3 py-1.5 rounded-full transition-all"
                    style={selected
                      ? { background: 'rgba(52,211,153,0.15)', color: '#34D399', border: '1px solid rgba(52,211,153,0.3)' }
                      : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {area.emoji} {area.nombre}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Contexto */}
          <div>
            <p className="text-white/40 text-xs mb-1.5">Contexto de la empresa</p>
            <textarea className="w-full px-3 py-2 rounded-xl text-white/80 text-xs outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', minHeight: 70 }}
              value={discovery.contexto_empresa}
              onChange={e => onChange({ ...discovery, contexto_empresa: e.target.value })} />
          </div>

          {/* Decision makers */}
          {discovery.decision_makers.length > 0 && (
            <div>
              <p className="text-white/40 text-xs mb-2 flex items-center gap-1"><Users size={11} /> Decision makers</p>
              <div className="space-y-2">
                {discovery.decision_makers.map((dm: DecisionMaker, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="flex-1">
                      <p className="text-white text-xs font-medium">{dm.nombre}</p>
                      <p className="text-white/40 text-xs">{dm.cargo}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: dm.rol === 'champion' ? 'rgba(52,211,153,0.1)' : dm.rol === 'blocker' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.06)',
                        color: dm.rol === 'champion' ? '#34D399' : dm.rol === 'blocker' ? '#f87171' : 'rgba(255,255,255,0.4)',
                      }}>
                      {dm.rol}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pain points */}
          {discovery.pain_points.length > 0 && (
            <div>
              <p className="text-white/40 text-xs mb-2 flex items-center gap-1"><MapPin size={11} /> Pain points</p>
              <div className="space-y-1.5">
                {discovery.pain_points.map((pp: PainPoint, i: number) => (
                  <div key={i} className="px-3 py-2 rounded-xl text-xs text-white/60"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <span className="text-white/30 mr-1">{pp.area}:</span>{pp.descripcion}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Presupuesto */}
          <div className="flex items-center gap-2">
            <p className="text-white/40 text-xs">Señales de presupuesto:</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: discovery.senales_presupuesto === 'alto' ? 'rgba(52,211,153,0.1)'
                  : discovery.senales_presupuesto === 'medio' ? 'rgba(233,255,123,0.1)'
                  : discovery.senales_presupuesto === 'bajo' ? 'rgba(239,68,68,0.1)'
                  : 'rgba(255,255,255,0.06)',
                color: discovery.senales_presupuesto === 'alto' ? '#34D399'
                  : discovery.senales_presupuesto === 'medio' ? '#E9FF7B'
                  : discovery.senales_presupuesto === 'bajo' ? '#f87171'
                  : 'rgba(255,255,255,0.4)',
              }}>
              {discovery.senales_presupuesto}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
