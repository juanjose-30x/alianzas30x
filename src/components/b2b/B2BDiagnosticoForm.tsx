'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AREAS, HERRAMIENTAS_IA } from '@/lib/areas'
import type { DiscoveryData } from '@/lib/b2b-types'
import { Send, Loader2, ChevronRight, Sparkles, X } from 'lucide-react'

type Step = 'bienvenida' | 'areas' | 'identidad' | 'herramientas' | 'roles' | 'chat' | 'retos' | 'confirmacion'
type ChatMsg = { role: 'user' | 'assistant'; content: string }
type Rol = { id: string; nombre: string; headcount: number; nombrePersona?: string; necesidad?: string }

const TEMA_CONFIG: Record<string, {
  hero: string
  heroAccent: string
  desc: string
  cta: string
  submit: string
  retos: string[]
}> = {
  ventas_ai: {
    hero: 'Tus ventas,',
    heroAccent: 'turbocargadas\ncon IA',
    desc: 'En 10 minutos entendemos tu proceso comercial y diseñamos exactamente cómo la IA puede multiplicar tus resultados.',
    cta: 'Empezar mi diagnóstico de ventas',
    submit: 'Generar mi diagnóstico de ventas →',
    retos: [
      'Prospección y generación de leads', 'Personalización de mensajes', 'Seguimiento de oportunidades',
      'Generación de propuestas', 'Análisis del pipeline', 'Cierre y negociación',
      'Reportes comerciales', 'Gestión de CRM', 'Social selling', 'Inteligencia competitiva',
      'Automatización de outreach', 'Onboarding de clientes',
    ],
  },
  marketing_ai: {
    hero: 'Tu marketing,',
    heroAccent: 'amplificado\ncon IA',
    desc: 'Identificamos cómo la IA puede escalar tu producción de contenido, campañas y análisis de resultados.',
    cta: 'Empezar mi diagnóstico de marketing',
    submit: 'Generar mi diagnóstico de marketing →',
    retos: [
      'Generación de contenido', 'Gestión de redes sociales', 'Análisis de datos y métricas',
      'Segmentación de audiencias', 'Automatización de campañas', 'SEO y posicionamiento',
      'Creación de imágenes y videos', 'Email marketing', 'Reportes de performance', 'Personalización a escala',
    ],
  },
  soft_skills: {
    hero: 'Tu equipo,',
    heroAccent: 'potenciado con\nhabilidades clave',
    desc: 'Mapeamos las capacidades que más impactan el desempeño de tu área y diseñamos un plan de desarrollo real.',
    cta: 'Empezar mi diagnóstico de equipo',
    submit: 'Generar mi plan de formación →',
    retos: [
      'Comunicación efectiva', 'Liderazgo de equipos', 'Gestión del tiempo', 'Negociación',
      'Presentaciones ejecutivas', 'Resolución de conflictos', 'Pensamiento crítico',
      'Adaptabilidad al cambio', 'Trabajo en equipo', 'Gestión de proyectos',
    ],
  },
  liderazgo_ai: {
    hero: 'Tu liderazgo,',
    heroAccent: 'potenciado\ncon IA',
    desc: 'Exploramos cómo la IA puede mejorar tus decisiones, liberar tu tiempo y multiplicar el impacto de tu equipo.',
    cta: 'Empezar mi diagnóstico de liderazgo',
    submit: 'Generar mi diagnóstico de liderazgo →',
    retos: [
      'Toma de decisiones con datos', 'Gestión del rendimiento del equipo', 'Comunicación ejecutiva',
      'Planificación estratégica', 'Gestión del cambio', 'Reportes para junta directiva',
      'Automatización de tareas operativas', 'Análisis de KPIs', 'Delegación efectiva',
    ],
  },
  operaciones_ai: {
    hero: 'Tus operaciones,',
    heroAccent: 'automatizadas\ncon IA',
    desc: 'Identificamos los cuellos de botella más costosos de tu área y cómo la IA los elimina.',
    cta: 'Empezar mi diagnóstico operativo',
    submit: 'Generar mi diagnóstico operativo →',
    retos: [
      'Automatización de procesos repetitivos', 'Gestión de inventario', 'Logística y distribución',
      'Control de calidad', 'Reportes operativos', 'Coordinación de equipos',
      'Gestión de proveedores', 'Predicción de demanda', 'Reducción de costos', 'Trazabilidad',
    ],
  },
  datos_ai: {
    hero: 'Tus datos,',
    heroAccent: 'convertidos en\ndecisiones',
    desc: 'Mapeamos cómo la IA puede transformar tus datos en inteligencia de negocio real y accionable.',
    cta: 'Empezar mi diagnóstico de datos',
    submit: 'Generar mi diagnóstico de datos →',
    retos: [
      'Reportes y dashboards', 'Análisis de KPIs', 'Predicción de tendencias',
      'Visualización de datos', 'Integración de fuentes', 'Calidad de datos',
      'Automatización de reportes', 'Segmentación de clientes', 'Análisis de cohortes',
      'Business intelligence', 'Data storytelling',
    ],
  },
  general_ai: {
    hero: 'Tu área,',
    heroAccent: 'potenciada\ncon IA',
    desc: 'En 8 minutos identificamos exactamente qué herramientas de IA pueden eliminar el trabajo repetitivo de tu equipo.',
    cta: 'Descubrir mi plan de IA',
    submit: 'Generar mi plan de IA →',
    retos: [
      'Automatización de procesos', 'Análisis de datos', 'Generación de contenido',
      'Atención al cliente', 'Prospección de clientes', 'Reportes y KPIs',
      'Gestión de documentos', 'Comunicación interna', 'Capacitación del equipo',
      'Gestión de proyectos', 'Predicción de demanda', 'Personalización a escala',
    ],
  },
}
const STEPS: Step[] = ['bienvenida', 'areas', 'identidad', 'herramientas', 'roles', 'chat', 'retos', 'confirmacion']

export default function B2BDiagnosticoForm({
  leadSlug,
  empresa,
  areasPreseleccionadas,
  mensajeBienvenida,
  discoveryData,
}: {
  leadSlug: string
  empresa: string
  areasPreseleccionadas: string[]
  mensajeBienvenida: string
  discoveryData: DiscoveryData
}) {
  const [step, setStep] = useState<Step>('bienvenida')
  const [selectedAreas, setSelectedAreas] = useState<string[]>(areasPreseleccionadas ?? [])
  const [nombre, setNombre] = useState('')
  const [cargo, setCargo] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [herramientas, setHerramientas] = useState<string[]>([])
  const [roles, setRoles] = useState<Rol[]>([{ id: '1', nombre: '', headcount: 1 }])
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatComplete, setChatComplete] = useState(false)
  const [retosChips, setRetosChips] = useState<string[]>([])
  const [saving, setSaving]   = useState(false)
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const chatEndRef = useRef<HTMLDivElement>(null)

  const markTouched = (field: string) =>
    setTouched(prev => new Set([...prev, field]))

  const currentAreaData = AREAS.filter(a => selectedAreas.includes(a.id))
  const totalHeadcount = roles.reduce((s, r) => s + r.headcount, 0)

  const tema = discoveryData?.tema_engagement ?? 'general_ai'
  const temaConf = TEMA_CONFIG[tema] ?? TEMA_CONFIG.general_ai
  const retosDelTema = temaConf.retos
  const areasDelDiscovery = discoveryData?.areas_identificadas ?? areasPreseleccionadas ?? []

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    if (step === 'roles' && discoveryData.roles_mencionados?.length && roles.length === 1 && !roles[0].nombre) {
      const relevant = discoveryData.roles_mencionados.filter(r => selectedAreas.includes(r.area))
      if (relevant.length > 0) {
        setRoles(relevant.map((r, i) => ({
          id: String(i + 1),
          nombre: r.nombre,
          headcount: r.headcount_estimado ?? 1,
        })))
      }
    }
  }, [step])

  const startChat = useCallback(async () => {
    const herramientasUsadas = herramientas.filter(h => h !== 'ninguna' && h !== 'otra')
    const herramientasTexto = herramientasUsadas.length
      ? `Actualmente uso: ${herramientasUsadas.join(', ')}.`
      : 'Aún no uso herramientas de IA.'
    const rolesTexto = roles.filter(r => r.nombre).length
      ? `Mi equipo: ${roles.filter(r => r.nombre).map(r => `${r.headcount} ${r.nombre}`).join(', ')}.`
      : ''

    const initMsg = `Hola, soy ${nombre}, ${cargo} en ${empresa}. ${herramientasTexto} ${rolesTexto}`
    const newMessages: ChatMsg[] = [{ role: 'user', content: initMsg }]
    setChatMessages(newMessages)
    setChatLoading(true)

    try {
      const res = await fetch(`/api/b2b/diagnostico/${leadSlug}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, areaIds: selectedAreas, nombre, cargo, roles }),
      })
      if (!res.ok || !res.body) return
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      setChatMessages([...newMessages, { role: 'assistant', content: '' }])
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        const clean = text.replace('[CONVERSACION_COMPLETA]', '').trimEnd()
        setChatMessages([...newMessages, { role: 'assistant', content: clean }])
      }
      if (text.includes('[CONVERSACION_COMPLETA]')) setChatComplete(true)
    } finally {
      setChatLoading(false)
    }
  }, [nombre, cargo, herramientas, roles, selectedAreas, leadSlug, empresa])

  useEffect(() => {
    if (step === 'chat' && chatMessages.length === 0) startChat()
  }, [step])

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = chatInput.trim()
    setChatInput('')
    const newMessages: ChatMsg[] = [...chatMessages, { role: 'user', content: userMsg }]
    setChatMessages(newMessages)
    setChatLoading(true)

    try {
      const res = await fetch(`/api/b2b/diagnostico/${leadSlug}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, areaIds: selectedAreas, nombre, cargo, roles }),
      })
      if (!res.ok || !res.body) return
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      setChatMessages([...newMessages, { role: 'assistant', content: '' }])
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        const clean = text.replace('[CONVERSACION_COMPLETA]', '').trimEnd()
        setChatMessages([...newMessages, { role: 'assistant', content: clean }])
      }
      if (text.includes('[CONVERSACION_COMPLETA]')) setChatComplete(true)
    } finally {
      setChatLoading(false)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const cleanMessages = chatMessages.map(m => ({ role: m.role, content: m.content }))
      await fetch(`/api/b2b/diagnostico/${leadSlug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areas: selectedAreas,
          nombre, cargo, email: email || undefined,
          telefono: telefono || undefined,
          headcount: totalHeadcount,
          roles: roles.filter(r => r.nombre),
          herramientas,
          chat_transcript: cleanMessages,
          retos_chips: retosChips,
        }),
      })
      window.location.href = `/${leadSlug}/gracias`
    } catch {
      setSaving(false)
    }
  }

  const canProceed = {
    areas: selectedAreas.length > 0,
    identidad: nombre.trim().length > 0 && cargo.trim().length > 0,
    herramientas: true,
    roles: roles.some(r => r.nombre.trim()),
    chat: chatComplete || chatMessages.filter(m => m.role === 'user').length >= 3,
    retos: true,
  }

  const stepIndex = STEPS.indexOf(step)
  const progress = Math.round((stepIndex / (STEPS.length - 1)) * 100)

  const slideProps = {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -16 },
    transition: { duration: 0.28, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] },
  }

  return (
    <div className="min-h-[100dvh]" style={{ background: '#09090b' }}>

      {/* PROGRESS BAR */}
      {step !== 'bienvenida' && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div style={{ height: 2, background: 'rgba(255,255,255,0.05)' }}>
            <motion.div
              style={{ height: '100%', background: '#E9FF7B', borderRadius: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <div className="flex items-center justify-end px-6 pt-2.5">
            <span
              className="text-xs tabular-nums"
              style={{
                color: 'var(--text-ghost)',
                fontFamily: 'var(--font-geist-mono), monospace',
                letterSpacing: '-0.01em',
              }}
            >
              Paso {stepIndex} de {STEPS.length - 1}
            </span>
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">

          {/* BIENVENIDA */}
          {step === 'bienvenida' && (
            <motion.div key="bienvenida"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-10"
            >
              <div className="space-y-7">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.35 }}
                  className="flex items-center gap-2.5"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'rgba(233,255,123,0.08)',
                      border: '1px solid rgba(233,255,123,0.16)',
                    }}
                  >
                    <Sparkles size={13} style={{ color: '#E9FF7B' }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#52525b', letterSpacing: '0.14em' }}>
                    {empresa} × 30X
                  </span>
                </motion.div>

                {/* Hero title — cinematic scale */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <h1
                    className="font-bold text-white leading-none"
                    style={{
                      fontSize: 'clamp(2.6rem, 7vw, 4rem)',
                      letterSpacing: '-0.035em',
                      lineHeight: 0.97,
                      textWrap: 'balance',
                    }}
                  >
                    {temaConf.hero}<br />
                    {temaConf.heroAccent.split('\n').map((line, i) => (
                      <span key={i} style={{ color: '#E9FF7B' }}>{line}{i < temaConf.heroAccent.split('\n').length - 1 && <br />}</span>
                    ))}
                  </h1>
                  <p className="mt-5 text-base leading-relaxed" style={{ color: '#71717a', maxWidth: '38ch' }}>
                    {mensajeBienvenida || temaConf.desc}
                  </p>
                </motion.div>
              </div>

              {/* 3-step plan */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-1.5"
              >
                <p className="text-xs mb-3" style={{ color: '#3f3f46', letterSpacing: '0.15em' }}>CÓMO FUNCIONA</p>
                {[
                  { n: '01', label: 'Cuéntanos sobre tu equipo', desc: 'Áreas, herramientas y retos actuales' },
                  { n: '02', label: 'Conversas con nuestra IA', desc: 'Análisis personalizado en tiempo real' },
                  { n: '03', label: 'Recibes tu propuesta', desc: 'Plan concreto de IA para tu área' },
                ].map(({ n, label, desc }) => (
                  <div
                    key={n}
                    className="flex items-start gap-4 px-4 py-3.5 rounded-xl"
                    style={{
                      background: 'rgba(255,255,255,0.022)',
                      border: '1px solid rgba(255,255,255,0.055)',
                    }}
                  >
                    <span
                      className="font-bold tabular-nums mt-0.5 shrink-0"
                      style={{ color: '#E9FF7B', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 11, letterSpacing: '0.05em' }}
                    >
                      {n}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white" style={{ letterSpacing: '-0.01em' }}>{label}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#52525b' }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Value signals */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.24, duration: 0.35 }}
                className="flex items-center gap-5 px-1"
              >
                {[
                  { value: '8 min', label: 'en total' },
                  { value: '100%', label: 'confidencial' },
                  { value: 'Gratis', label: 'sin compromiso' },
                ].map(({ value, label }, i) => (
                  <div key={label} className="flex items-center gap-5">
                    {i > 0 && <div className="w-px h-4 shrink-0" style={{ background: 'rgba(255,255,255,0.07)' }} />}
                    <div className="flex items-center gap-1.5">
                      <span
                        className="font-bold tabular-nums"
                        style={{ color: '#E9FF7B', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 13, letterSpacing: '-0.01em' }}
                      >
                        {value}
                      </span>
                      <span className="text-xs" style={{ color: '#3f3f46' }}>{label}</span>
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* CTA */}
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => setStep('areas')}
                className="w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.97] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)]"
                style={{ background: '#E9FF7B', color: '#09090b', fontSize: 15, letterSpacing: '-0.02em' }}
              >
                {temaConf.cta} <ChevronRight size={16} strokeWidth={2.5} />
              </motion.button>

              <p className="text-center text-xs" style={{ color: '#3f3f46' }}>
                Al continuar aceptas que 30X use tus respuestas para preparar tu propuesta.
              </p>
            </motion.div>
          )}

          {/* ÁREAS */}
          {step === 'areas' && (
            <motion.div key="areas" {...slideProps} className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.03em', lineHeight: 1.05, textWrap: 'balance' }}>¿En qué área trabajas?</h2>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: '#71717a' }}>
                  {areasDelDiscovery.length > 0
                    ? 'Las áreas de tu empresa ya están mapeadas. Confirma la tuya.'
                    : 'Seleccionamos el diagnóstico más relevante para tu rol.'}
                </p>
              </div>

              {/* Áreas del discovery primero */}
              {areasDelDiscovery.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#3f3f46' }}>Áreas de tu empresa</p>
                  <div className="grid grid-cols-2 gap-2">
                    {AREAS.filter(a => areasDelDiscovery.includes(a.id)).map(area => {
                      const selected = selectedAreas.includes(area.id)
                      return (
                        <button
                          key={area.id}
                          onClick={() => setSelectedAreas(prev =>
                            prev.includes(area.id) ? prev.filter(a => a !== area.id) : [...prev, area.id]
                          )}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all active:scale-[0.97] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)]"
                          style={selected
                            ? { background: 'rgba(233,255,123,0.1)', border: '1px solid rgba(233,255,123,0.35)', boxShadow: 'inset 0 1px 0 rgba(233,255,123,0.12)' }
                            : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
                        >
                          <span style={{ fontSize: 16 }}>{area.emoji}</span>
                          <span className="text-sm font-medium tracking-tight flex-1" style={{ color: selected ? '#E9FF7B' : '#e4e4e7' }}>
                            {area.nombre}
                          </span>
                          {selected && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#E9FF7B' }} />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Otras áreas */}
              {AREAS.filter(a => !areasDelDiscovery.includes(a.id)).length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#3f3f46' }}>
                    {areasDelDiscovery.length > 0 ? 'Otras áreas' : 'Áreas'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {AREAS.filter(a => !areasDelDiscovery.includes(a.id)).map(area => {
                      const selected = selectedAreas.includes(area.id)
                      return (
                        <button
                          key={area.id}
                          onClick={() => setSelectedAreas(prev =>
                            prev.includes(area.id) ? prev.filter(a => a !== area.id) : [...prev, area.id]
                          )}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all active:scale-[0.97] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)]"
                          style={selected
                            ? { background: 'rgba(233,255,123,0.08)', border: '1px solid rgba(233,255,123,0.3)', boxShadow: 'inset 0 1px 0 rgba(233,255,123,0.1)' }
                            : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          <span style={{ fontSize: 16, opacity: selected ? 1 : 0.5 }}>{area.emoji}</span>
                          <span className="text-sm font-medium tracking-tight" style={{ color: selected ? '#E9FF7B' : '#71717a' }}>
                            {area.nombre}
                          </span>
                          {selected && <div className="w-1.5 h-1.5 rounded-full shrink-0 ml-auto" style={{ background: '#E9FF7B' }} />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep('identidad')}
                disabled={!canProceed.areas}
                className="w-full py-3 rounded-xl font-semibold text-sm tracking-tight disabled:opacity-30 transition-all active:scale-[0.97] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)]"
                style={{ background: '#E9FF7B', color: '#09090b' }}
              >
                Continuar →
              </button>
            </motion.div>
          )}

          {/* IDENTIDAD */}
          {step === 'identidad' && (
            <motion.div key="identidad" {...slideProps} className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.03em', lineHeight: 1.05 }}>Cuéntanos sobre ti</h2>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: '#71717a' }}>Personalizamos la propuesta según tu cargo y tu equipo.</p>
              </div>
              <div className="space-y-3">
                {[
                  { id: 'nombre', label: 'Nombre completo *', value: nombre, set: setNombre, placeholder: 'Ej: María García', required: true },
                  { id: 'cargo',  label: 'Cargo *',           value: cargo,  set: setCargo,  placeholder: 'Ej: Directora de Operaciones', required: true },
                  { id: 'email',  label: 'Email (opcional)',  value: email,  set: setEmail,  placeholder: 'Ej: maria@empresa.com', required: false },
                  { id: 'tel',    label: 'WhatsApp (opcional)', value: telefono, set: setTelefono, placeholder: 'Ej: +57 310 123 4567', required: false },
                ].map(({ id, label, value, set, placeholder, required }) => {
                  const hasError = required && touched.has(id) && !value.trim()
                  return (
                    <div key={id}>
                      <label className="text-xs block mb-1.5" style={{ color: '#71717a' }}>{label}</label>
                      <input
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: `1px solid ${hasError ? 'var(--clr-danger-border)' : 'rgba(255,255,255,0.09)'}`,
                          color: '#fafafa',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                        }}
                        placeholder={placeholder}
                        value={value}
                        onChange={e => set(e.target.value)}
                        onBlur={() => required && markTouched(id)}
                      />
                      {hasError && (
                        <p className="text-xs mt-1" style={{ color: 'var(--clr-danger)' }}>
                          Este campo es obligatorio
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('areas')}
                  className="px-5 py-3 rounded-xl text-sm transition-all active:scale-[0.97] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)]"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#71717a' }}
                >
                  ← Volver
                </button>
                <button
                  onClick={() => setStep('herramientas')}
                  disabled={!canProceed.identidad}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm tracking-tight disabled:opacity-30 transition-all active:scale-[0.97] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)]"
                  style={{ background: '#E9FF7B', color: '#09090b' }}
                >
                  Continuar →
                </button>
              </div>
            </motion.div>
          )}

          {/* HERRAMIENTAS */}
          {step === 'herramientas' && (
            <motion.div key="herramientas" {...slideProps} className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.03em', lineHeight: 1.05, textWrap: 'balance' }}>¿Qué IA ya tienes en tu equipo?</h2>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: '#71717a' }}>Identifica qué tienes hoy para construir sobre lo que funciona.</p>
              </div>
              {(['Asistentes', 'Imagen', 'Video/Audio', 'Código', 'Social Media', 'Ventas', 'Productividad', 'Otro'] as const).map(cat => {
                const items = (HERRAMIENTAS_IA as unknown as { id: string; nombre: string; emoji: string; color: string; categoria: string }[]).filter(h => h.categoria === cat)
                return (
                  <div key={cat}>
                    <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#52525b' }}>{cat}</p>
                    <div className="flex flex-wrap gap-2">
                      {items.map(h => {
                        const sel = herramientas.includes(h.id)
                        return (
                          <button
                            key={h.id}
                            onClick={() => {
                              if (h.id === 'ninguna') { setHerramientas(sel ? [] : ['ninguna']); return }
                              const sinNinguna = herramientas.filter(x => x !== 'ninguna')
                              setHerramientas(sel ? sinNinguna.filter(x => x !== h.id) : [...sinNinguna, h.id])
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all active:scale-[0.96]"
                            style={sel
                              ? { background: `${h.color}20`, color: h.color, border: `1px solid ${h.color}45`, boxShadow: `inset 0 1px 0 ${h.color}15` }
                              : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.07)' }}
                          >
                            {sel && (
                              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: h.color }} />
                            )}
                            {h.nombre}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('identidad')}
                  className="px-5 py-3 rounded-xl text-sm transition-all active:scale-[0.97] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)]"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#71717a' }}
                >
                  ← Volver
                </button>
                <button
                  onClick={() => setStep('roles')}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm tracking-tight transition-all active:scale-[0.97] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)]"
                  style={{ background: '#E9FF7B', color: '#09090b' }}
                >
                  Continuar →
                </button>
              </div>
            </motion.div>
          )}

          {/* ROLES */}
          {step === 'roles' && (
            <motion.div key="roles" {...slideProps} className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.03em', lineHeight: 1.05, textWrap: 'balance' }}>Tu equipo, mapeado para la IA</h2>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: '#71717a' }}>Cuantos más roles definas, más específica será tu propuesta.</p>
              </div>
              <div className="space-y-3">
                {roles.map((rol, i) => (
                  <div
                    key={rol.id}
                    className="rounded-xl p-4 space-y-3"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center gap-1 rounded-lg px-2"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <button
                          onClick={() => setRoles(prev => prev.map((r, j) => j === i ? { ...r, headcount: Math.max(1, r.headcount - 1) } : r))}
                          className="py-1.5 px-1 text-sm transition-colors"
                          style={{ color: '#71717a' }}
                        >
                          −
                        </button>
                        <span
                          className="text-white font-bold text-sm w-5 text-center tabular-nums"
                          style={{ fontFamily: 'var(--font-geist-mono), monospace' }}
                        >
                          {rol.headcount}
                        </span>
                        <button
                          onClick={() => setRoles(prev => prev.map((r, j) => j === i ? { ...r, headcount: r.headcount + 1 } : r))}
                          className="py-1.5 px-1 text-sm transition-colors"
                          style={{ color: '#71717a' }}
                        >
                          +
                        </button>
                      </div>
                      <input
                        className="flex-1 px-3 py-2 rounded-lg text-white text-sm outline-none"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: '#fafafa',
                        }}
                        placeholder="Nombre del rol"
                        value={rol.nombre}
                        onChange={e => setRoles(prev => prev.map((r, j) => j === i ? { ...r, nombre: e.target.value } : r))}
                      />
                      {roles.length > 1 && (
                        <button
                          onClick={() => setRoles(prev => prev.filter((_, j) => j !== i))}
                          className="transition-colors rounded-lg p-1"
                          style={{ color: '#52525b' }}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                    <input
                      className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: '#a1a1aa',
                      }}
                      placeholder="¿Qué necesita esta persona de la IA? (opcional)"
                      value={rol.necesidad ?? ''}
                      onChange={e => setRoles(prev => prev.map((r, j) => j === i ? { ...r, necesidad: e.target.value } : r))}
                    />
                  </div>
                ))}
                <button
                  onClick={() => setRoles(prev => [...prev, { id: String(Date.now()), nombre: '', headcount: 1 }])}
                  className="w-full py-2.5 rounded-xl text-sm transition-all active:scale-[0.97] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)]"
                  style={{ border: '1px dashed rgba(255,255,255,0.1)', color: '#52525b' }}
                >
                  + Agregar rol
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('herramientas')}
                  className="px-5 py-3 rounded-xl text-sm transition-all active:scale-[0.97] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)]"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#71717a' }}
                >
                  ← Volver
                </button>
                <button
                  onClick={() => setStep('chat')}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm tracking-tight transition-all active:scale-[0.97] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)]"
                  style={{ background: '#E9FF7B', color: '#09090b' }}
                >
                  Continuar →
                </button>
              </div>
            </motion.div>
          )}

          {/* CHAT */}
          {step === 'chat' && (
            <motion.div key="chat" {...slideProps} className="space-y-4">
              <div>
                <h2 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.03em', lineHeight: 1.05 }}>Análisis en tiempo real</h2>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: '#71717a' }}>
                  Nuestra IA analiza tu contexto en{' '}
                  <span style={{ color: '#a1a1aa' }}>{currentAreaData.map(a => a.nombre).join(', ')}</span>{' '}
                  y genera tu diagnóstico personalizado.
                </p>
              </div>
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  minHeight: 300,
                  maxHeight: 400,
                  overflowY: 'auto',
                }}
              >
                <div className="p-4 space-y-3">
                  {chatMessages.filter((m, i) => !(m.role === 'user' && i === 0)).map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
                        style={msg.role === 'user'
                          ? { background: '#E9FF7B', color: '#09090b', fontWeight: 500 }
                          : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.82)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
                      >
                        {msg.content || (
                          <span className="flex gap-1">
                            {[0, 1, 2].map(j => (
                              <span key={j} className="w-1 h-1 rounded-full typing-dot" style={{ background: 'rgba(255,255,255,0.4)', display: 'inline-block' }} />
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {chatLoading && chatMessages[chatMessages.length - 1]?.role !== 'assistant' && (
                    <div className="flex justify-start">
                      <div className="px-4 py-3 rounded-2xl flex gap-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {[0, 1, 2].map(j => (
                          <span key={j} className="w-1 h-1 rounded-full typing-dot" style={{ background: 'rgba(255,255,255,0.35)', display: 'inline-block' }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>
              {chatComplete ? (
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{
                    background: 'rgba(134,239,172,0.06)',
                    border: '1px solid rgba(134,239,172,0.18)',
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#86efac' }} />
                  <span className="text-sm" style={{ color: '#86efac' }}>Conversación completa — listo para continuar</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      color: '#fafafa',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                    }}
                    placeholder="Ej: Usamos Excel para reportes y tardamos 2 horas en cada uno..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                  />
                  <button
                    onClick={sendChat}
                    disabled={chatLoading || !chatInput.trim()}
                    className="px-4 py-3 rounded-xl disabled:opacity-30 transition-all active:scale-[0.97] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)]"
                    style={{ background: '#E9FF7B', color: '#09090b' }}
                  >
                    <Send size={15} />
                  </button>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('roles')}
                  className="px-5 py-3 rounded-xl text-sm transition-all active:scale-[0.97] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)]"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#71717a' }}
                >
                  ← Volver
                </button>
                <button
                  onClick={() => setStep('retos')}
                  disabled={!canProceed.chat}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm tracking-tight disabled:opacity-30 transition-all active:scale-[0.97] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)]"
                  style={canProceed.chat
                    ? { background: '#E9FF7B', color: '#09090b' }
                    : { background: 'rgba(255,255,255,0.06)', color: '#52525b' }}
                >
                  Continuar →
                </button>
              </div>
              {!canProceed.chat && (
                <p className="text-xs text-center" style={{ color: '#3f3f46' }}>
                  Comparte al menos 2 respuestas para continuar
                </p>
              )}
            </motion.div>
          )}

          {/* RETOS */}
          {step === 'retos' && (
            <motion.div key="retos" {...slideProps} className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.03em', lineHeight: 1.05, textWrap: 'balance' }}>¿Dónde inviertes más tiempo hoy?</h2>
                <p className="text-sm mt-2 leading-relaxed" style={{ color: '#71717a' }}>Esto define las oportunidades de automatización con mayor impacto.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {retosDelTema.map(reto => {
                  const sel = retosChips.includes(reto)
                  return (
                    <button
                      key={reto}
                      onClick={() => setRetosChips(prev =>
                        prev.includes(reto) ? prev.filter(r => r !== reto) : [...prev, reto]
                      )}
                      className="px-4 py-2 rounded-full text-sm transition-all active:scale-[0.97] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)]"
                      style={sel
                        ? { background: 'rgba(196,181,253,0.12)', color: '#c4b5fd', border: '1px solid rgba(196,181,253,0.28)', boxShadow: 'inset 0 1px 0 rgba(196,181,253,0.08)' }
                        : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      {reto}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('chat')}
                  className="px-5 py-3 rounded-xl text-sm transition-all active:scale-[0.97] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)]"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#71717a' }}
                >
                  ← Volver
                </button>
                <button
                  onClick={() => setStep('confirmacion')}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm tracking-tight transition-all active:scale-[0.97] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)]"
                  style={{ background: '#E9FF7B', color: '#09090b' }}
                >
                  Continuar →
                </button>
              </div>
            </motion.div>
          )}

          {/* CONFIRMACIÓN */}
          {step === 'confirmacion' && (
            <motion.div key="confirmacion" {...slideProps} className="space-y-6">
              <div>
                {/* Badge */}
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                  style={{
                    background: 'rgba(233,255,123,0.06)',
                    border: '1px solid rgba(233,255,123,0.16)',
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#E9FF7B' }} />
                  <span className="text-xs font-medium" style={{ color: '#E9FF7B', letterSpacing: '-0.01em' }}>Diagnóstico completo</span>
                </div>
                <h2 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.03em', lineHeight: 1.05, textWrap: 'balance' }}>
                  Tu plan de IA está<br />listo para generarse
                </h2>
                <p className="text-sm mt-3 leading-relaxed" style={{ color: '#71717a' }}>
                  Confirma tus datos y recibirás una propuesta personalizada para {empresa} en menos de 48 horas.
                </p>
              </div>

              <div
                className="rounded-2xl p-5 space-y-4"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
              >
                <p className="text-xs uppercase tracking-widest" style={{ color: '#52525b' }}>Resumen</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {[
                    ['Nombre', nombre],
                    ['Cargo', cargo],
                    ['Áreas', currentAreaData.map(a => a.nombre).join(', ')],
                    ['Equipo', `${totalHeadcount} personas`],
                    ['IA actual', herramientas.filter(h => h !== 'ninguna').join(', ') || 'Ninguna aún'],
                    ['Retos', retosChips.length > 0 ? `${retosChips.length} identificados` : 'Ninguno'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs mb-0.5" style={{ color: '#52525b' }}>{label}</p>
                      <p className="font-medium tracking-tight truncate" style={{ color: '#fafafa' }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('retos')}
                  className="px-5 py-3 rounded-xl text-sm transition-all active:scale-[0.97] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)]"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#71717a' }}
                >
                  ← Volver
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 py-4 rounded-2xl font-semibold text-base tracking-tight flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.97] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1)]"
                  style={{ background: '#E9FF7B', color: '#09090b' }}
                >
                  {saving
                    ? <><Loader2 size={15} className="animate-spin" /> Enviando...</>
                    : temaConf.submit
                  }
                </button>
              </div>
              <p className="text-xs text-center" style={{ color: '#3f3f46' }}>
                Al enviar, 30X usa esta información para preparar tu propuesta. Gratis, sin compromiso.
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
