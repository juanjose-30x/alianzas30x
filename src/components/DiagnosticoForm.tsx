'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check, Send, Loader2, Users, Plus, Trash2 } from 'lucide-react'
import { AREAS, HERRAMIENTAS_IA } from '@/lib/areas'

type Step = 'bienvenida' | 'areas' | 'identidad' | 'herramientas' | 'roles' | 'chat' | 'retos' | 'confirmacion'
type ChatMsg = { role: 'user' | 'assistant'; content: string }
type Rol = { id: string; nombre: string; headcount: number; necesidad: string; nombrePersona?: string }

const STEPS: Step[] = ['bienvenida', 'areas', 'identidad', 'herramientas', 'roles', 'chat', 'retos', 'confirmacion']

export default function DiagnosticoForm() {
  const [step, setStep] = useState<Step>('bienvenida')
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [nombre, setNombre] = useState('')
  const [cargo, setCargo] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [herramientas, setHerramientas] = useState<string[]>([])
  const [herramientaOtra, setHerramientaOtra] = useState('')
  const [roles, setRoles] = useState<Rol[]>([])
  const [retosChips, setRetosChips] = useState<string[]>([])
  const [chatComplete, setChatComplete] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const chatStarted = useRef(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const currentAreaData = AREAS.filter(a => selectedAreas.includes(a.id))
  const retosDisponibles = [...new Set(currentAreaData.flatMap(a => [...a.retos]))]
  const totalPersonas = roles.reduce((s, r) => s + r.headcount, 0)

  // Pre-cargar roles sugeridos al entrar al paso
  const initRoles = () => {
    if (roles.length === 0) {
      const sugeridos = currentAreaData.flatMap(a =>
        a.cargos.slice(0, 3).map((c, i) => ({
          id: `${a.id}-${i}`,
          nombre: c,
          headcount: 1,
          necesidad: '',
        }))
      )
      setRoles(sugeridos.slice(0, 5))
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isLoading])

  const sendChatMessage = useCallback(async (userContent: string, currentMessages: ChatMsg[]) => {
    const newMessages: ChatMsg[] = [...currentMessages, { role: 'user', content: userContent }]
    setChatMessages(newMessages)
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          areaIds: selectedAreas,
          nombre,
          cargo,
          roles,
        }),
      })

      if (!res.ok || !res.body) throw new Error('Error en chat')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      setChatMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        // Parse text stream format (simple text chunks)
        assistantText += chunk
        setChatMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: assistantText }
          return updated
        })
      }

      if (assistantText.includes('[CONVERSACION_COMPLETA]')) {
        setChatComplete(true)
        setChatMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: assistantText.replace('[CONVERSACION_COMPLETA]', '').trim(),
          }
          return updated
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [selectedAreas, nombre, cargo])

  // Auto-start chat when entering chat step
  useEffect(() => {
    if (step === 'chat' && !chatStarted.current) {
      chatStarted.current = true
      const herramientasUsadas = herramientas.filter(h => h !== 'ninguna' && h !== 'otra')
      const herramientasTexto = herramientasUsadas.length > 0
        ? `Herramientas que uso: ${herramientasUsadas.join(', ')}.`
        : 'No uso herramientas de IA aún.'
      const rolesTexto = roles.length > 0
        ? `Mi equipo está compuesto por: ${roles.map(r => `${r.headcount} ${r.nombre}${r.necesidad ? ` (necesidad: ${r.necesidad})` : ''}`).join(', ')}.`
        : ''
      const initMsg = `Hola, soy ${nombre}, ${cargo} en el área de ${currentAreaData.map(a => a.nombre).join(' y ')} de Tugó. ${herramientasTexto} ${rolesTexto}`
      sendChatMessage(initMsg, [])
    }
  }, [step])

  const stepIndex = STEPS.indexOf(step)
  const progress = (stepIndex / (STEPS.length - 1)) * 100

  const toggleArea = (id: string) => {
    setSelectedAreas(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const toggleHerramienta = (id: string) => {
    if (id === 'ninguna') {
      setHerramientas(['ninguna'])
      return
    }
    setHerramientas(prev => {
      const sinNinguna = prev.filter(h => h !== 'ninguna')
      return sinNinguna.includes(id)
        ? sinNinguna.filter(h => h !== id)
        : [...sinNinguna, id]
    })
  }

  const toggleReto = (reto: string) => {
    setRetosChips(prev =>
      prev.includes(reto) ? prev.filter(r => r !== reto) : [...prev, reto]
    )
  }

  const handleSubmitForm = async () => {
    setSubmitting(true)
    try {
      const cleanMessages = chatMessages.map(m => ({
        role: m.role,
        content: m.content.replace('[CONVERSACION_COMPLETA]', '').trim(),
      }))

      await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areas: selectedAreas,
          nombre,
          cargo,
          email,
          telefono,
          headcount: totalPersonas,
          roles,
          herramientas,
          herramienta_otra: herramientaOtra,
          chat_transcript: cleanMessages,
          retos_chips: retosChips,
        }),
      })
      setStep('confirmacion')
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const slideVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  }

  const canProceed = {
    bienvenida: true,
    areas: selectedAreas.length > 0,
    identidad: nombre.trim().length > 1 && cargo.trim().length > 1 && email.includes('@') && /^(\+?57)?[3][0-9]{9}$/.test(telefono.replace(/\s/g, '')),
    herramientas: herramientas.length > 0,
    roles: roles.length > 0 && roles.every(r => r.nombre.trim().length > 0 && r.headcount > 0),
    chat: chatComplete,
    retos: true,
    confirmacion: true,
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold text-sm" style={{ fontFamily: 'Inter Tight, sans-serif' }}>
            Tugó <span style={{ color: '#E9FF7B' }}>×</span> 30X
          </span>
        </div>
        {step !== 'bienvenida' && step !== 'confirmacion' && (
          <div className="flex items-center gap-3">
            <div className="progress-bar w-32">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-white/30 text-xs">{stepIndex}/{STEPS.length - 1}</span>
          </div>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >

              {/* BIENVENIDA */}
              {step === 'bienvenida' && (
                <div className="text-center space-y-8">
                  <div className="space-y-4">
                    <div
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium"
                      style={{ background: 'rgba(233,255,123,0.1)', color: '#E9FF7B', border: '1px solid rgba(233,255,123,0.2)' }}
                    >
                      Diagnóstico de Adopción IA · 2025
                    </div>
                    <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Inter Tight, sans-serif' }}>
                      ¿Está tu equipo<br />
                      <span style={{ color: '#E9FF7B' }}>listo para la IA?</span>
                    </h1>
                    <p className="text-white/50 text-lg max-w-md mx-auto leading-relaxed">
                      Este diagnóstico nos ayuda a entender cómo está tu área y diseñar un programa de formación que realmente te sirva.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    {[
                      { num: '5 min', label: 'de tu tiempo' },
                      { num: '11', label: 'áreas de Tugó' },
                      { num: '100%', label: 'personalizado' },
                    ].map(item => (
                      <div key={item.label} className="card-glass rounded-2xl p-4">
                        <div className="text-2xl font-bold" style={{ color: '#E9FF7B', fontFamily: 'Inter Tight, sans-serif' }}>{item.num}</div>
                        <div className="text-white/40 text-sm mt-1">{item.label}</div>
                      </div>
                    ))}
                  </div>

                  <button className="btn-primary text-base px-8 py-3" onClick={() => setStep('areas')}>
                    Comenzar diagnóstico <ChevronRight size={18} />
                  </button>

                  <p className="text-white/20 text-xs">
                    Tus respuestas son confidenciales y serán revisadas por Juan José Sarmiento y el equipo de 30X.
                  </p>
                </div>
              )}

              {/* AREAS */}
              {step === 'areas' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Inter Tight, sans-serif' }}>
                      ¿A qué área perteneces?
                    </h2>
                    <p className="text-white/40 mt-2 text-sm">
                      Selecciona todas las que apliquen si trabajas en más de una.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {AREAS.map(area => {
                      const selected = selectedAreas.includes(area.id)
                      return (
                        <button
                          key={area.id}
                          onClick={() => toggleArea(area.id)}
                          className={`relative rounded-2xl p-4 text-left transition-all duration-200 ${
                            selected ? 'card-selected' : 'card-glass'
                          }`}
                        >
                          {selected && (
                            <div
                              className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ background: '#E9FF7B' }}
                            >
                              <Check size={12} color="#0a0a0a" strokeWidth={3} />
                            </div>
                          )}
                          <div className="text-2xl mb-2">{area.emoji}</div>
                          <div className="text-white text-sm font-medium leading-tight" style={{ fontFamily: 'Inter Tight, sans-serif' }}>
                            {area.nombre}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex justify-between">
                    <button className="btn-secondary" onClick={() => setStep('bienvenida')}>
                      <ChevronLeft size={16} /> Atrás
                    </button>
                    <button
                      className="btn-primary"
                      disabled={!canProceed.areas}
                      onClick={() => setStep('identidad')}
                    >
                      Continuar <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* IDENTIDAD */}
              {step === 'identidad' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Inter Tight, sans-serif' }}>
                      Cuéntanos quién eres
                    </h2>
                    <p className="text-white/40 mt-2 text-sm">
                      Así podemos personalizar tu diagnóstico.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-white/60 text-sm mb-2 block">Nombre completo</label>
                        <input
                          className="input-field"
                          placeholder="ej. María González"
                          value={nombre}
                          onChange={e => setNombre(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-white/60 text-sm mb-2 block">Cargo</label>
                        <input
                          className="input-field"
                          placeholder={
                            currentAreaData.length > 0
                              ? `ej. ${currentAreaData[0].cargos.slice(0, 2).join(', ')}`
                              : 'ej. Gerente de Área'
                          }
                          value={cargo}
                          onChange={e => setCargo(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-white/60 text-sm mb-2 block">Correo electrónico</label>
                        <input
                          className="input-field"
                          type="email"
                          placeholder="tu@tugo.com.co"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-white/60 text-sm mb-2 block">Teléfono / WhatsApp</label>
                        <input
                          className="input-field"
                          type="tel"
                          placeholder="+57 300 000 0000"
                          value={telefono}
                          onChange={e => setTelefono(e.target.value)}
                          style={telefono && !/^(\+?57)?[3][0-9]{9}$/.test(telefono.replace(/\s/g, '')) ? {
                            borderColor: 'rgba(239,68,68,0.5)',
                            background: 'rgba(239,68,68,0.04)',
                          } : {}}
                        />
                        {telefono && !/^(\+?57)?[3][0-9]{9}$/.test(telefono.replace(/\s/g, '')) && (
                          <p className="text-red-400/70 text-xs mt-1">Ingresa un número colombiano válido (ej. 3001234567)</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button className="btn-secondary" onClick={() => setStep('areas')}>
                      <ChevronLeft size={16} /> Atrás
                    </button>
                    <button
                      className="btn-primary"
                      disabled={!canProceed.identidad}
                      onClick={() => setStep('herramientas')}
                    >
                      Continuar <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* HERRAMIENTAS */}
              {step === 'herramientas' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Inter Tight, sans-serif' }}>
                      ¿Qué herramientas de IA usas hoy?
                    </h2>
                    <p className="text-white/40 mt-2 text-sm">
                      Selecciona todas las que uses. Si no usas ninguna, también indícalo.
                    </p>
                  </div>

                  {(['Asistentes', 'Imagen', 'Video/Audio', 'Código', 'Social Media', 'Ventas', 'Productividad', 'Otro'] as const).map(cat => {
                    const items = HERRAMIENTAS_IA.filter(h => h.categoria === cat)
                    return (
                      <div key={cat}>
                        <div className="text-white/30 text-xs uppercase tracking-widest mb-2">{cat}</div>
                        <div className="flex flex-wrap gap-2">
                          {items.map(h => {
                            const selected = herramientas.includes(h.id)
                            return (
                              <button
                                key={h.id}
                                onClick={() => toggleHerramienta(h.id)}
                                className="relative flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200 text-sm"
                                style={selected ? {
                                  background: `${h.color}22`,
                                  border: `1px solid ${h.color}66`,
                                  color: '#fff',
                                } : {
                                  background: 'rgba(255,255,255,0.04)',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                  color: 'rgba(255,255,255,0.5)',
                                }}
                              >
                                <span
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0"
                                  style={{ background: h.color, fontSize: '10px' }}
                                >
                                  {h.emoji}
                                </span>
                                <span className="font-medium">{h.nombre}</span>
                                {selected && <Check size={12} style={{ color: '#E9FF7B' }} />}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}

                  {herramientas.includes('otra') && (
                    <input
                      className="input-field"
                      placeholder="¿Cuál otra herramienta usas?"
                      value={herramientaOtra}
                      onChange={e => setHerramientaOtra(e.target.value)}
                    />
                  )}

                  <div className="flex justify-between">
                    <button className="btn-secondary" onClick={() => setStep('identidad')}>
                      <ChevronLeft size={16} /> Atrás
                    </button>
                    <button
                      className="btn-primary"
                      disabled={!canProceed.herramientas}
                      onClick={() => { initRoles(); setStep('roles') }}
                    >
                      Continuar <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ROLES */}
              {step === 'roles' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Inter Tight, sans-serif' }}>
                      ¿Cómo está compuesto tu equipo?
                    </h2>
                    <p className="text-white/40 mt-2 text-sm">
                      Agrega los roles de tu área. El nombre de la persona es opcional pero ayuda a construir el organigrama sin duplicados.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {roles.map((rol, i) => (
                      <motion.div
                        key={rol.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card-glass rounded-2xl p-4 space-y-3"
                      >
                        <div className="flex items-center gap-3">
                          {/* Nombre del rol */}
                          <input
                            className="input-field flex-1 text-sm"
                            placeholder="ej. Coordinador de Ventas"
                            value={rol.nombre}
                            onChange={e => setRoles(prev => prev.map((r, j) => j === i ? { ...r, nombre: e.target.value } : r))}
                          />
                          {/* Headcount */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
                              style={{ background: 'rgba(255,255,255,0.06)' }}
                              onClick={() => setRoles(prev => prev.map((r, j) => j === i ? { ...r, headcount: Math.max(1, r.headcount - 1) } : r))}
                            >−</button>
                            <span className="text-white font-bold w-6 text-center" style={{ fontFamily: 'Inter Tight, sans-serif' }}>
                              {rol.headcount}
                            </span>
                            <button
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors"
                              style={{ background: 'rgba(255,255,255,0.06)' }}
                              onClick={() => setRoles(prev => prev.map((r, j) => j === i ? { ...r, headcount: r.headcount + 1 } : r))}
                            >+</button>
                          </div>
                          {/* Eliminar */}
                          <button
                            onClick={() => setRoles(prev => prev.filter((_, j) => j !== i))}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white/20 hover:text-red-400 transition-colors shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {/* Nombre persona + necesidad */}
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="input-field text-sm"
                            placeholder="Nombre (opcional, ej. Ana Torres)"
                            value={rol.nombrePersona ?? ''}
                            onChange={e => setRoles(prev => prev.map((r, j) => j === i ? { ...r, nombrePersona: e.target.value } : r))}
                          />
                          <input
                            className="input-field text-sm"
                            placeholder="Necesidad puntual (opcional)"
                            value={rol.necesidad}
                            onChange={e => setRoles(prev => prev.map((r, j) => j === i ? { ...r, necesidad: e.target.value } : r))}
                          />
                        </div>
                      </motion.div>
                    ))}

                    {/* Agregar rol */}
                    <button
                      onClick={() => setRoles(prev => [...prev, { id: `custom-${Date.now()}`, nombre: '', headcount: 1, necesidad: '' }])}
                      className="w-full rounded-2xl p-4 flex items-center justify-center gap-2 text-white/40 hover:text-white/70 transition-colors"
                      style={{ border: '1px dashed rgba(255,255,255,0.1)', background: 'transparent' }}
                    >
                      <Plus size={16} /> Agregar rol
                    </button>
                  </div>

                  {totalPersonas > 0 && (
                    <div className="flex items-center justify-between px-1">
                      <span className="text-white/30 text-sm">Total del equipo</span>
                      <span className="font-bold text-lg" style={{ color: '#E9FF7B', fontFamily: 'Inter Tight, sans-serif' }}>
                        {totalPersonas} personas
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <button className="btn-secondary" onClick={() => setStep('herramientas')}>
                      <ChevronLeft size={16} /> Atrás
                    </button>
                    <button
                      className="btn-primary"
                      disabled={!canProceed.roles}
                      onClick={() => setStep('chat')}
                    >
                      Continuar <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* CHAT */}
              {step === 'chat' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Inter Tight, sans-serif' }}>
                      Cuéntanos más sobre tu área
                    </h2>
                    <p className="text-white/40 mt-1 text-sm">
                      Nuestro asistente te hará unas preguntas rápidas.
                    </p>
                  </div>

                  {/* Chat messages */}
                  <div
                    className="rounded-2xl p-4 space-y-4 overflow-y-auto"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      minHeight: '300px',
                      maxHeight: '380px',
                    }}
                  >
                    {chatMessages.filter((m, i) => !(m.role === 'user' && i === 0)).map((msg, i) => {
                      const isBot = msg.role === 'assistant'
                      const cleanContent = msg.content.replace('[CONVERSACION_COMPLETA]', '').trim()
                      if (!cleanContent) return null
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}
                        >
                          {isBot && (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs mr-2 mt-1 shrink-0"
                              style={{ background: '#E9FF7B', color: '#0a0a0a', fontFamily: 'Inter Tight', fontWeight: 700 }}>
                              30X
                            </div>
                          )}
                          <div
                            className={`max-w-xs px-4 py-3 text-sm leading-relaxed ${
                              isBot ? 'chat-bubble-bot text-white/90' : 'chat-bubble-user text-white'
                            }`}
                          >
                            {cleanContent}
                          </div>
                        </motion.div>
                      )
                    })}

                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs mr-2 shrink-0"
                          style={{ background: '#E9FF7B', color: '#0a0a0a', fontFamily: 'Inter Tight', fontWeight: 700 }}>
                          30X
                        </div>
                        <div className="chat-bubble-bot px-4 py-3">
                          <div className="flex gap-1">
                            {[0,1,2].map(i => (
                              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce"
                                style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input */}
                  {!chatComplete && (
                    <form
                      onSubmit={e => {
                        e.preventDefault()
                        if (!chatInput.trim() || isLoading) return
                        const msg = chatInput.trim()
                        setChatInput('')
                        sendChatMessage(msg, chatMessages)
                      }}
                      className="flex gap-2"
                    >
                      <input
                        className="input-field flex-1"
                        placeholder="Escribe tu respuesta..."
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        disabled={isLoading}
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !chatInput.trim()}
                        className="btn-primary px-4 py-3"
                      >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      </button>
                    </form>
                  )}

                  <div className="flex justify-between">
                    <button className="btn-secondary" onClick={() => setStep('herramientas')}>
                      <ChevronLeft size={16} /> Atrás
                    </button>
                    <button
                      className="btn-primary"
                      disabled={!chatComplete}
                      onClick={() => setStep('retos')}
                    >
                      Continuar <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* RETOS */}
              {step === 'retos' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Inter Tight, sans-serif' }}>
                      Última pregunta
                    </h2>
                    <p className="text-white/40 mt-2 text-sm">Selecciona los retos que más sientes en tu área hoy.</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {retosDisponibles.map(reto => {
                      const sel = retosChips.includes(reto)
                      return (
                        <button
                          key={reto}
                          onClick={() => toggleReto(reto)}
                          className="px-3 py-2 rounded-full text-sm transition-all"
                          style={sel ? {
                            background: 'rgba(233,255,123,0.15)',
                            border: '1px solid rgba(233,255,123,0.4)',
                            color: '#E9FF7B',
                            fontWeight: 500,
                          } : {
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.5)',
                          }}
                        >
                          {reto}
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex justify-between pt-2">
                    <button className="btn-secondary" onClick={() => setStep('chat')}>
                      <ChevronLeft size={16} /> Atrás
                    </button>
                    <button
                      className="btn-primary"
                      disabled={submitting}
                      onClick={handleSubmitForm}
                    >
                      {submitting ? (
                        <><Loader2 size={16} className="animate-spin" /> Enviando...</>
                      ) : (
                        <>Enviar diagnóstico <ChevronRight size={16} /></>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* CONFIRMACION */}
              {step === 'confirmacion' && (
                <div className="text-center space-y-8">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                    style={{ background: 'rgba(233,255,123,0.15)', border: '2px solid rgba(233,255,123,0.4)' }}
                  >
                    <Check size={36} style={{ color: '#E9FF7B' }} />
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'Inter Tight, sans-serif' }}>
                      ¡Gracias, {nombre.split(' ')[0]}!
                    </h2>
                    <p className="text-white/50 max-w-sm mx-auto">
                      Tu diagnóstico fue enviado. Juan José Sarmiento y el equipo de 30X lo revisarán y te harán llegar los resultados pronto.
                    </p>
                  </div>

                  <div
                    className="rounded-2xl p-6 text-left space-y-3"
                    style={{ background: 'rgba(233,255,123,0.05)', border: '1px solid rgba(233,255,123,0.15)' }}
                  >
                    <p className="text-white/40 text-xs uppercase tracking-widest">Tu resumen</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/50">Área(s)</span>
                        <span className="text-white">{currentAreaData.map(a => a.nombre).join(', ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Equipo</span>
                        <span className="text-white">{totalPersonas} personas · {roles.length} roles</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Herramientas</span>
                        <span className="text-white capitalize">{herramientas.slice(0, 3).join(', ')}{herramientas.length > 3 ? '...' : ''}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-white/20 text-xs">
                    Powered by 30X Escuela de Negocios
                  </p>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
