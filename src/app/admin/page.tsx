'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, ChevronUp, Clock, Users, MessageSquare, Edit3, CheckCircle, Mail, Phone, Sparkles, Loader2 } from 'lucide-react'
import { AREAS, HERRAMIENTAS_IA } from '@/lib/areas'
import type { Submission } from '@/lib/supabase'

const ADMIN_PASSWORD = 'tugo30x2025'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingInsight, setEditingInsight] = useState<string | null>(null)
  const [insightText, setInsightText] = useState('')
  const [filterArea, setFilterArea] = useState('all')
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const [areaInsights, setAreaInsights] = useState<Record<string, string>>({})
  const [generatingArea, setGeneratingArea] = useState<string | null>(null)
  const [globalInsight, setGlobalInsight] = useState('')
  const [generatingGlobal, setGeneratingGlobal] = useState(false)
  const globalRef = useRef<HTMLDivElement>(null)

  const fetchSubmissions = async () => {
    setLoading(true)
    const res = await fetch('/api/submissions')
    const data = await res.json()
    setSubmissions(data)
    setLoading(false)
  }

  useEffect(() => {
    if (authed) fetchSubmissions()
    const interval = authed ? setInterval(fetchSubmissions, 15000) : null
    return () => { if (interval) clearInterval(interval) }
  }, [authed])

  const saveInsight = async (id: string, approve: boolean) => {
    await fetch(`/api/submissions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        insight: insightText,
        insight_aprobado: approve,
      }),
    })
    setEditingInsight(null)
    fetchSubmissions()
  }

  const streamInsight = async (
    type: 'person' | 'area' | 'global',
    subs: Submission[],
    onChunk: (text: string) => void,
    areaName?: string
  ) => {
    const res = await fetch('/api/admin/generate-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, submissions: subs, areaName }),
    })
    if (!res.ok || !res.body) return
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let full = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      full += decoder.decode(value, { stream: true })
      onChunk(full)
    }
    return full
  }

  const generatePersonInsight = async (sub: Submission) => {
    setGeneratingFor(sub.id)
    setEditingInsight(sub.id)
    setInsightText('')
    await streamInsight('person', [sub], (text) => setInsightText(text))
    setGeneratingFor(null)
  }

  const generateAreaInsight = async (areaId: string, areaName: string) => {
    const subs = submissions.filter(s => s.areas.includes(areaId))
    if (subs.length === 0) return
    setGeneratingArea(areaId)
    setAreaInsights(prev => ({ ...prev, [areaId]: '' }))
    await streamInsight('area', subs, (text) => setAreaInsights(prev => ({ ...prev, [areaId]: text })), areaName)
    setGeneratingArea(null)
  }

  const generateGlobal = async () => {
    if (submissions.length === 0) return
    setGeneratingGlobal(true)
    setGlobalInsight('')
    await streamInsight('global', submissions, (text) => {
      setGlobalInsight(text)
      setTimeout(() => globalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50)
    })
    setGeneratingGlobal(false)
  }

  const filtered = filterArea === 'all'
    ? submissions
    : submissions.filter(s => s.areas.includes(filterArea))

  const areaCount = AREAS.reduce((acc, area) => {
    acc[area.id] = submissions.filter(s => s.areas.includes(area.id)).length
    return acc
  }, {} as Record<string, number>)

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="w-full max-w-sm space-y-6 p-8">
          <div className="text-center">
            <div className="text-white font-bold text-xl mb-1" style={{ fontFamily: 'Inter Tight, sans-serif' }}>
              Tugó <span style={{ color: '#E9FF7B' }}>×</span> 30X
            </div>
            <div className="text-white/30 text-sm">Panel de administración</div>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              className="input-field"
              placeholder="Contraseña de acceso"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') setAuthed(password === ADMIN_PASSWORD) }}
            />
            <button
              className="btn-primary w-full justify-center"
              onClick={() => setAuthed(password === ADMIN_PASSWORD)}
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-white font-bold" style={{ fontFamily: 'Inter Tight, sans-serif' }}>
            Tugó <span style={{ color: '#E9FF7B' }}>×</span> 30X
          </span>
          <span className="text-white/30 text-sm ml-3">Panel de diagnóstico</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/40 text-sm">En vivo</span>
          </div>
          <div
            className="px-3 py-1.5 rounded-full text-sm font-semibold"
            style={{ background: 'rgba(233,255,123,0.1)', color: '#E9FF7B' }}
          >
            {submissions.length} respuestas
          </div>
          <button
            onClick={generateGlobal}
            disabled={generatingGlobal || submissions.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all disabled:opacity-40"
            style={{ background: 'rgba(233,255,123,0.15)', color: '#E9FF7B', border: '1px solid rgba(233,255,123,0.3)' }}
          >
            {generatingGlobal ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Propuesta Tugó
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Propuesta global */}
        {(globalInsight || generatingGlobal) && (
          <div className="card-glass rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={14} style={{ color: '#E9FF7B' }} />
              <span className="text-sm font-semibold" style={{ color: '#E9FF7B', fontFamily: 'Inter Tight, sans-serif' }}>
                Propuesta estratégica Tugó × 30X
              </span>
              {generatingGlobal && <Loader2 size={13} className="animate-spin text-white/40 ml-auto" />}
            </div>
            <div className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed" ref={globalRef}>
              {globalInsight || <span className="text-white/30 italic">Generando propuesta...</span>}
            </div>
            {globalInsight && !generatingGlobal && (
              <button
                onClick={() => navigator.clipboard.writeText(globalInsight)}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                Copiar texto
              </button>
            )}
          </div>
        )}

        {/* Stats por área */}
        <div>
          <h2 className="text-white/40 text-xs uppercase tracking-widest mb-4">Cobertura por área</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {AREAS.map(area => (
              <div key={area.id} className="space-y-2">
                <button
                  onClick={() => setFilterArea(filterArea === area.id ? 'all' : area.id)}
                  className={`w-full rounded-2xl p-3 text-left transition-all ${
                    filterArea === area.id ? 'card-selected' : 'card-glass'
                  }`}
                >
                  <div className="text-lg mb-1">{area.emoji}</div>
                  <div className="text-white text-xs font-medium truncate" style={{ fontFamily: 'Inter Tight, sans-serif' }}>
                    {area.nombre}
                  </div>
                  <div className="mt-1 text-sm font-bold" style={{ color: areaCount[area.id] > 0 ? '#E9FF7B' : 'rgba(255,255,255,0.2)' }}>
                    {areaCount[area.id]} resp.
                  </div>
                </button>
                {areaCount[area.id] > 0 && (
                  <button
                    onClick={() => generateAreaInsight(area.id, area.nombre)}
                    disabled={generatingArea === area.id}
                    className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs transition-all disabled:opacity-50"
                    style={{ background: 'rgba(233,255,123,0.07)', color: '#E9FF7B', border: '1px solid rgba(233,255,123,0.15)' }}
                  >
                    {generatingArea === area.id ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                    Insight área
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Insight de área */}
        {filterArea !== 'all' && areaInsights[filterArea] && (
          <div className="card-glass rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={14} style={{ color: '#E9FF7B' }} />
              <span className="text-sm font-semibold" style={{ color: '#E9FF7B', fontFamily: 'Inter Tight, sans-serif' }}>
                Diagnóstico de área · {AREAS.find(a => a.id === filterArea)?.nombre}
              </span>
              {generatingArea === filterArea && <Loader2 size={13} className="animate-spin text-white/40 ml-auto" />}
            </div>
            <div className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">
              {areaInsights[filterArea]}
            </div>
            {areaInsights[filterArea] && generatingArea !== filterArea && (
              <button
                onClick={() => navigator.clipboard.writeText(areaInsights[filterArea])}
                className="text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                Copiar texto
              </button>
            )}
          </div>
        )}

        {/* Lista de submissions */}
        <div>
          <h2 className="text-white/40 text-xs uppercase tracking-widest mb-4">
            Respuestas {filterArea !== 'all' && `· ${AREAS.find(a => a.id === filterArea)?.nombre}`}
          </h2>

          {loading && submissions.length === 0 ? (
            <div className="text-center py-16 text-white/30">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-white/30">
              {filterArea !== 'all' ? 'Sin respuestas para esta área aún.' : 'Aún no hay respuestas.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(sub => {
                const areas = AREAS.filter(a => sub.areas.includes(a.id))
                const isExpanded = expanded === sub.id
                const isEditing = editingInsight === sub.id

                return (
                  <motion.div
                    key={sub.id}
                    layout
                    className="card-glass rounded-2xl overflow-hidden"
                  >
                    {/* Card header */}
                    <button
                      className="w-full p-5 text-left flex items-center justify-between"
                      onClick={() => setExpanded(isExpanded ? null : sub.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">{areas[0]?.emoji ?? '❓'}</div>
                        <div>
                          <div className="text-white font-semibold" style={{ fontFamily: 'Inter Tight, sans-serif' }}>
                            {sub.nombre}
                          </div>
                          <div className="text-white/40 text-sm">{sub.cargo} · {areas.map(a => a.nombre).join(', ')}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {sub.insight_aprobado && (
                          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                            style={{ background: 'rgba(233,255,123,0.1)', color: '#E9FF7B' }}>
                            <CheckCircle size={12} /> Insight aprobado
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-white/30 text-xs">
                          <span className="flex items-center gap-1"><Users size={12} /> {sub.headcount}p</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {new Date(sub.created_at).toLocaleDateString('es-CO')}</span>
                        </div>
                        {isExpanded ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                      </div>
                    </button>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 space-y-5 border-t border-white/5 pt-4">

                            {/* Contacto */}
                            <div className="flex flex-wrap gap-4">
                              {sub.email && (
                                <a href={`mailto:${sub.email}`} className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors">
                                  <Mail size={13} /> {sub.email}
                                </a>
                              )}
                              {sub.telefono && (
                                <a href={`https://wa.me/${sub.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors">
                                  <Phone size={13} /> {sub.telefono}
                                </a>
                              )}
                            </div>

                            {/* Roles del equipo */}
                            {sub.roles && sub.roles.length > 0 && (
                              <div>
                                <div className="text-white/40 text-xs uppercase tracking-widest mb-2">Equipo · {sub.headcount} personas</div>
                                <div className="space-y-1.5">
                                  {sub.roles.map((r, i) => (
                                    <div key={i} className="flex items-start justify-between rounded-xl px-3 py-2.5 gap-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                      <div className="min-w-0">
                                        <span className="text-white text-sm font-medium">{r.nombre}</span>
                                        {r.nombrePersona && <span className="text-white/40 text-xs ml-2">({r.nombrePersona})</span>}
                                        {r.necesidad && <div className="text-white/40 text-xs mt-0.5">→ {r.necesidad}</div>}
                                      </div>
                                      <div className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(233,255,123,0.1)', color: '#E9FF7B' }}>
                                        {r.headcount}p
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Herramientas */}
                            {sub.herramientas.length > 0 && (
                              <div>
                                <div className="text-white/40 text-xs uppercase tracking-widest mb-2">Herramientas que usan</div>
                                <div className="flex flex-wrap gap-2">
                                  {sub.herramientas.map(hid => {
                                    const h = HERRAMIENTAS_IA.find(x => x.id === hid)
                                    return h ? (
                                      <span key={hid} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}>
                                        {h.emoji} {h.nombre}
                                      </span>
                                    ) : null
                                  })}
                                  {sub.herramienta_otra && (
                                    <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}>
                                      + {sub.herramienta_otra}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Retos */}
                            {sub.retos_chips?.length > 0 && (
                              <div>
                                <div className="text-white/40 text-xs uppercase tracking-widest mb-2">Retos identificados</div>
                                <div className="flex flex-wrap gap-2">
                                  {sub.retos_chips.map((r, i) => (
                                    <span key={i} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
                                      {r}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Chat transcript */}
                            {sub.chat_transcript?.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-widest mb-3">
                                  <MessageSquare size={12} /> Conversación
                                </div>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                  {sub.chat_transcript.filter((_, i) => i > 0).map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                                      <div
                                        className={`max-w-xs px-3 py-2 text-sm rounded-xl ${
                                          msg.role === 'assistant'
                                            ? 'bg-white/5 text-white/70'
                                            : 'text-white/90'
                                        }`}
                                        style={msg.role === 'user' ? {
                                          background: 'rgba(233,255,123,0.08)',
                                          border: '1px solid rgba(233,255,123,0.15)',
                                        } : {}}
                                      >
                                        {msg.content}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Insight section */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-white/40 text-xs uppercase tracking-widest">Insight diagnóstico</div>
                                {!isEditing && (
                                  <div className="flex items-center gap-2">
                                    <button
                                      disabled={generatingFor === sub.id}
                                      className="flex items-center gap-1 text-xs transition-colors disabled:opacity-50"
                                      style={{ color: '#E9FF7B' }}
                                      onClick={() => generatePersonInsight(sub)}
                                    >
                                      {generatingFor === sub.id
                                        ? <Loader2 size={11} className="animate-spin" />
                                        : <Sparkles size={11} />}
                                      Generar con IA
                                    </button>
                                    <span className="text-white/15">|</span>
                                    <button
                                      className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
                                      onClick={() => {
                                        setEditingInsight(sub.id)
                                        setInsightText(sub.insight || '')
                                      }}
                                    >
                                      <Edit3 size={11} /> {sub.insight ? 'Editar' : 'Manual'}
                                    </button>
                                  </div>
                                )}
                              </div>

                              {isEditing ? (
                                <div className="space-y-3">
                                  <textarea
                                    className="input-field resize-none"
                                    rows={4}
                                    placeholder="Escribe tu diagnóstico para esta área. Ej: Esta área tiene potencial alto para AI Sales, dado que manejan equipos de ventas y ya tienen familiaridad con ChatGPT..."
                                    value={insightText}
                                    onChange={e => setInsightText(e.target.value)}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      className="btn-secondary text-sm px-4 py-2"
                                      onClick={() => setEditingInsight(null)}
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      className="btn-secondary text-sm px-4 py-2"
                                      onClick={() => saveInsight(sub.id, false)}
                                    >
                                      Guardar borrador
                                    </button>
                                    <button
                                      className="btn-primary text-sm px-4 py-2"
                                      onClick={() => saveInsight(sub.id, true)}
                                    >
                                      <Check size={14} /> Aprobar insight
                                    </button>
                                  </div>
                                </div>
                              ) : sub.insight ? (
                                <div
                                  className="rounded-xl p-4 text-sm text-white/80"
                                  style={{
                                    background: sub.insight_aprobado
                                      ? 'rgba(233,255,123,0.06)'
                                      : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${sub.insight_aprobado ? 'rgba(233,255,123,0.2)' : 'rgba(255,255,255,0.06)'}`,
                                  }}
                                >
                                  {sub.insight}
                                  {!sub.insight_aprobado && (
                                    <div className="mt-2 text-xs text-white/30">Borrador — no aprobado aún</div>
                                  )}
                                </div>
                              ) : (
                                <div className="rounded-xl p-4 text-sm text-white/20 italic"
                                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.06)' }}>
                                  Sin insight todavía. Haz clic en "Agregar insight" para escribir tu diagnóstico.
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
