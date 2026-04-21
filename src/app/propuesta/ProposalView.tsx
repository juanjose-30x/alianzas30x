'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown, ChevronUp, ArrowRight, AlertCircle, Zap,
  ExternalLink, Quote, MessageSquare, Send, Loader2, X,
  Bot, CheckCircle2, Copy, Check, Edit3, FileText
} from 'lucide-react'
import type { Submission } from '@/lib/supabase'

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Area = { id: string; nombre: string; emoji: string }
type HerramientaItem = { id: string; nombre: string; emoji: string; color: string }
type Program = { name: string; tagline: string; duration: string; price: string; url: string; color: string }
type ChatMsg = { role: 'user' | 'assistant'; content: string }

type ProposalExtract = {
  hook: string
  problema: string
  programaNombre: string
  programaJustificacion: string
  cupos: number
  precioUSD: number
}

type AreaStatus = 'pending' | 'chatting' | 'extracting' | 'done'

type AreaState = {
  messages: ChatMsg[]
  status: AreaStatus
  extract?: ProposalExtract
}

type AreaSection = {
  area: Area
  submissions: Submission[]
  totalHeadcount: number
  herramientas: string[]
  retos: string[]
  quotes: string[]
  insights: { nombre: string; cargo: string; text: string }[]
  programs: Program[]
  maturityScore: number
}

type Props = {
  submissions: Submission[]
  totalPersonas: number
  totalAreas: number
  topRetos: [string, number][]
  topTools: [string, number][]
  noToolCount: number
  recommendedPrograms: Program[]
  areaSections: AreaSection[]
  herramientaData: HerramientaItem[]
}

// ─── UTILS ───────────────────────────────────────────────────────────────────

function maturityLabel(score: number) {
  if (score >= 70) return { label: 'Avanzada', color: '#34D399' }
  if (score >= 40) return { label: 'En progreso', color: '#E9FF7B' }
  return { label: 'Inicial', color: '#F97316' }
}

const TRM = 3600

function buildProposalText(areaSections: AreaSection[], areaStates: Record<string, AreaState>): string {
  const doneAreas = areaSections.filter(s => areaStates[s.area.id]?.status === 'done' && areaStates[s.area.id]?.extract)
  const date = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })
  const programasUnicos = [...new Set(doneAreas.map(s => areaStates[s.area.id]!.extract!.programaNombre))]
  const totalCupos = doneAreas.reduce((acc, s) => acc + (areaStates[s.area.id]?.extract?.cupos ?? 0), 0)

  const rows = doneAreas.map(s => {
    const ext = areaStates[s.area.id]!.extract!
    return { area: s.area.nombre, emoji: s.area.emoji, programa: ext.programaNombre, cupos: ext.cupos, precio: ext.precioUSD, subtotal: ext.cupos * ext.precioUSD }
  })
  const subtotalUSD = rows.reduce((a, r) => a + r.subtotal, 0)
  const ivaUSD = subtotalUSD * 0.19
  const totalUSD = subtotalUSD + ivaUSD
  const totalCOP = totalUSD * TRM

  const S = `\n` // spacer

  let text = ''

  // ── SLIDE: PORTADA ──────────────────────────────────────────
  text += `╔══════════════════════════════════════════════════╗\n`
  text += `  SLIDE: PORTADA\n`
  text += `╚══════════════════════════════════════════════════╝\n`
  text += `Cliente:    Tugó\n`
  text += `Título:     Propuesta comercial\n`
  text += `Programas:  ${programasUnicos.join(' & ')}\n`
  text += `Fecha:      ${date}\n`
  text += S

  // ── SLIDE: APERTURA (gancho global) ─────────────────────────
  text += `╔══════════════════════════════════════════════════╗\n`
  text += `  SLIDE: APERTURA — GANCHO GLOBAL\n`
  text += `╚══════════════════════════════════════════════════╝\n`
  text += `Título:    ${programasUnicos.length > 1 ? `${programasUnicos.length} capacidades, un equipo` : `Una capacidad, un equipo`}\n`
  text += `Subtítulo: Tugó tiene ${totalCupos} personas listas para liderar la transformación IA.\n`
  text += `           ${programasUnicos.join(' y ')} ${programasUnicos.length > 1 ? 'son' : 'es'} el camino.\n`
  text += S

  // ── POR ÁREA ────────────────────────────────────────────────
  for (const section of doneAreas) {
    const ext = areaStates[section.area.id]!.extract!
    const subtotal = ext.cupos * ext.precioUSD

    text += `\n╔══════════════════════════════════════════════════╗\n`
    text += `  ÁREA: ${section.area.emoji} ${section.area.nombre.toUpperCase()}\n`
    text += `╚══════════════════════════════════════════════════╝\n`

    text += `┌─ SLIDE: HOOK ─────────────────────────────────────\n`
    text += `│  ${ext.hook}\n`
    text += `└───────────────────────────────────────────────────\n`
    text += S

    text += `┌─ SLIDE: PROBLEMA ─────────────────────────────────\n`
    text += `│  ${ext.problema}\n`
    text += `└───────────────────────────────────────────────────\n`
    text += S

    text += `┌─ SLIDE: PROGRAMA RECOMENDADO ─────────────────────\n`
    text += `│  Programa:      ${ext.programaNombre}\n`
    text += `│  Justificación: ${ext.programaJustificacion}\n`
    text += `└───────────────────────────────────────────────────\n`
    text += S

    text += `┌─ SLIDE: INVERSIÓN ${section.area.nombre.toUpperCase()} ───────────────────────\n`
    text += `│  Cupos:         ${ext.cupos}\n`
    text += `│  USD por cupo:  $${ext.precioUSD.toLocaleString()}\n`
    text += `│  Subtotal USD:  $${subtotal.toLocaleString()}\n`
    text += `│  Subtotal COP*: $${(subtotal * TRM).toLocaleString('es-CO')}\n`
    text += `└───────────────────────────────────────────────────\n`
    text += S
  }

  // ── SLIDE: TABLA FINAL DE INVERSIÓN ─────────────────────────
  text += `\n╔══════════════════════════════════════════════════╗\n`
  text += `  SLIDE: TABLA FINAL DE INVERSIÓN\n`
  text += `╚══════════════════════════════════════════════════╝\n`
  for (const r of rows) {
    text += `${r.emoji} ${r.area.padEnd(24)} | ${r.programa.padEnd(20)} | ${String(r.cupos).padStart(3)} cupos | $${r.precio.toLocaleString().padStart(6)}/cupo | $${r.subtotal.toLocaleString().padStart(8)} USD\n`
  }
  text += `\n`
  text += `Subtotal                                    $${subtotalUSD.toLocaleString()} USD\n`
  text += `IVA 19%                                     $${Math.round(ivaUSD).toLocaleString()} USD\n`
  text += `TOTAL                                       $${Math.round(totalUSD).toLocaleString()} USD\n`
  text += `                            $${Math.round(totalCOP).toLocaleString('es-CO')} COP*\n`
  text += S

  // ── SLIDE: CONDICIONES ───────────────────────────────────────
  text += `╔══════════════════════════════════════════════════╗\n`
  text += `  SLIDE: CONDICIONES\n`
  text += `╚══════════════════════════════════════════════════╝\n`
  text += `• Precios en USD más IVA del 19%\n`
  text += `• Pago por transferencia bancaria\n`
  text += `• Hasta 2 cuotas con tarjeta corporativa\n`
  text += `• Tugó asigna libremente los cupos entre las áreas seleccionadas\n`
  text += `• *COP calculado a TRM referencial de $${TRM.toLocaleString()} por USD.\n`
  text += `   Valor final se ajusta a la TRM del día de emisión de la factura.\n`

  return text
}

// ─── AREA CHAT PANEL ─────────────────────────────────────────────────────────

function AreaChatPanel({
  section,
  toolMap,
  state,
  onClose,
  onStateChange,
}: {
  section: AreaSection
  toolMap: Record<string, HerramientaItem>
  state: AreaState
  onClose: () => void
  onStateChange: (newState: AreaState) => void
}) {
  const [input, setInput] = useState('')
  const [editingExtract, setEditingExtract] = useState(false)
  const [localExtract, setLocalExtract] = useState<ProposalExtract | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const toolNames = [...new Set(section.herramientas)]
    .filter(h => h !== 'ninguna')
    .map(h => toolMap[h]?.nombre ?? h)

  const areaContext = {
    nombre: section.area.nombre,
    emoji: section.area.emoji,
    headcount: section.totalHeadcount,
    maturityScore: section.maturityScore,
    personas: section.submissions.map(s => ({ nombre: s.nombre, cargo: s.cargo })),
    roles: section.submissions.flatMap(s => s.roles ?? []),
    herramientas: toolNames,
    retos: [...new Set(section.retos)],
    quotes: section.quotes,
    insight: section.insights[0]?.text ?? null,
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages])

  const send = useCallback(async (userContent: string, currentMessages: ChatMsg[]) => {
    const newMessages: ChatMsg[] = [...currentMessages, { role: 'user', content: userContent }]
    onStateChange({ ...state, messages: newMessages, status: 'chatting' })

    try {
      const res = await fetch('/api/propuesta/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, areaContext }),
      })
      if (!res.ok || !res.body) throw new Error('Error')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      const withTyping = [...newMessages, { role: 'assistant' as const, content: '' }]
      onStateChange({ ...state, messages: withTyping, status: 'chatting' })

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        onStateChange({ ...state, messages: [...newMessages, { role: 'assistant', content: text }], status: 'chatting' })
      }
    } catch (e) {
      console.error(e)
    }
  }, [areaContext, state, onStateChange])

  const extractDecisions = async () => {
    onStateChange({ ...state, status: 'extracting' })
    try {
      const res = await fetch('/api/propuesta/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: state.messages, areaContext }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setLocalExtract(data)
      setEditingExtract(true)
      onStateChange({ ...state, status: 'chatting', extract: data })
    } catch (e) {
      console.error(e)
      onStateChange({ ...state, status: 'chatting' })
    }
  }

  const confirmExtract = (ext: ProposalExtract) => {
    onStateChange({ ...state, status: 'done', extract: ext })
    setEditingExtract(false)
  }

  const userExchanges = state.messages.filter(m => m.role === 'user').length
  const canExtract = userExchanges >= 2 && state.status !== 'extracting' && state.status !== 'done'
  const isDone = state.status === 'done'

  const STARTERS = [
    `Analiza el área de ${section.area.nombre} y recomienda el programa más adecuado con justificación específica.`,
    '¿Cuál es el quick win más claro para este equipo?',
    '¿Cuántos cupos recomiendas y cómo los asignarías?',
    '¿Cómo le presentaría esta propuesta al gerente de esta área?',
  ]

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <span className="text-xl">{section.area.emoji}</span>
          <div>
            <p className="text-white font-semibold text-sm" style={{ fontFamily: 'Inter Tight, sans-serif' }}>
              {section.area.nombre}
            </p>
            <p className="text-white/30 text-xs">
              {section.totalHeadcount} personas · {userExchanges} mensaje{userExchanges !== 1 ? 's' : ''} enviado{userExchanges !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDone && (
            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium"
              style={{ background: 'rgba(52,211,153,0.12)', color: '#34D399', border: '1px solid rgba(52,211,153,0.25)' }}>
              <CheckCircle2 size={11} /> Revisada
            </span>
          )}
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* Status: done + extract card */}
        {isDone && state.extract && !editingExtract && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <CheckCircle2 size={15} style={{ color: '#34D399' }} />
              <span className="text-sm font-medium" style={{ color: '#34D399' }}>Área revisada y propuesta extraída</span>
            </div>
            <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <p className="text-white/30 text-xs mb-1">Hook</p>
                <p className="text-white/80 text-sm italic">"{state.extract.hook}"</p>
              </div>
              <div>
                <p className="text-white/30 text-xs mb-1">Programa</p>
                <p className="text-white font-semibold text-sm" style={{ fontFamily: 'Inter Tight, sans-serif' }}>{state.extract.programaNombre}</p>
              </div>
              <div className="flex gap-4 text-sm">
                <div>
                  <p className="text-white/30 text-xs">Cupos</p>
                  <p className="text-white font-bold">{state.extract.cupos}</p>
                </div>
                <div>
                  <p className="text-white/30 text-xs">USD/cupo</p>
                  <p className="font-bold" style={{ color: '#E9FF7B' }}>${state.extract.precioUSD.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-white/30 text-xs">Subtotal</p>
                  <p className="font-bold" style={{ color: '#E9FF7B' }}>${(state.extract.cupos * state.extract.precioUSD).toLocaleString()} USD</p>
                </div>
              </div>
              <button onClick={() => { setLocalExtract(state.extract!); setEditingExtract(true) }}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors mt-1">
                <Edit3 size={11} /> Editar decisión
              </button>
            </div>
          </div>
        )}

        {/* Edit extract form */}
        {editingExtract && localExtract && (
          <div className="rounded-xl p-4 space-y-4" style={{ background: 'rgba(233,255,123,0.05)', border: '1px solid rgba(233,255,123,0.2)' }}>
            <p className="text-white/60 text-sm font-medium">Confirma o ajusta la propuesta para esta área:</p>

            <div>
              <label className="text-white/30 text-xs block mb-1">Hook (pregunta para el cliente)</label>
              <textarea className="w-full px-3 py-2 rounded-lg text-sm text-white resize-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', minHeight: 60 }}
                value={localExtract.hook}
                onChange={e => setLocalExtract({ ...localExtract, hook: e.target.value })} />
            </div>
            <div>
              <label className="text-white/30 text-xs block mb-1">Programa recomendado</label>
              <input className="w-full px-3 py-2 rounded-lg text-sm text-white"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                value={localExtract.programaNombre}
                onChange={e => setLocalExtract({ ...localExtract, programaNombre: e.target.value })} />
            </div>
            <div>
              <label className="text-white/30 text-xs block mb-1">Justificación</label>
              <textarea className="w-full px-3 py-2 rounded-lg text-sm text-white resize-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', minHeight: 70 }}
                value={localExtract.programaJustificacion}
                onChange={e => setLocalExtract({ ...localExtract, programaJustificacion: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-white/30 text-xs block mb-1">Cupos</label>
                <input type="number" min={1} className="w-full px-3 py-2 rounded-lg text-sm text-white"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  value={localExtract.cupos}
                  onChange={e => setLocalExtract({ ...localExtract, cupos: Number(e.target.value) })} />
              </div>
              <div className="flex-1">
                <label className="text-white/30 text-xs block mb-1">USD por cupo</label>
                <input type="number" min={0} className="w-full px-3 py-2 rounded-lg text-sm text-white"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  value={localExtract.precioUSD}
                  onChange={e => setLocalExtract({ ...localExtract, precioUSD: Number(e.target.value) })} />
              </div>
            </div>
            <p className="text-white/30 text-xs">
              Subtotal: USD ${(localExtract.cupos * localExtract.precioUSD).toLocaleString()} · COP ${((localExtract.cupos * localExtract.precioUSD) * TRM).toLocaleString('es-CO')}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setEditingExtract(false)}
                className="flex-1 py-2 rounded-lg text-sm text-white/50 transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Cancelar
              </button>
              <button onClick={() => confirmExtract(localExtract)}
                className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
                style={{ background: '#E9FF7B', color: '#0a0a0a' }}>
                Confirmar área ✓
              </button>
            </div>
          </div>
        )}

        {/* Empty state / starters */}
        {state.messages.length === 0 && !isDone && (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: '#E9FF7B' }}>
                <Bot size={14} color="#0a0a0a" />
              </div>
              <div className="rounded-2xl px-4 py-3 text-sm text-white/80 leading-relaxed"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Tengo el diagnóstico completo de <strong className="text-white">{section.area.nombre}</strong>. Cuéntame qué quieres saber o revisemos el área juntos.
              </div>
            </div>
            <div className="space-y-2 pt-1">
              {STARTERS.map(s => (
                <button key={s} onClick={() => send(s, [])}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm text-white/50 hover:text-white/80 transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {state.messages.filter((m, i) => !(m.role === 'user' && i === 0 && m.content.startsWith('Analiza el área'))).map((msg, i) => {
          const isBot = msg.role === 'assistant'
          if (!msg.content.trim()) return (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: '#E9FF7B' }}>
                <Bot size={14} color="#0a0a0a" />
              </div>
              <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex gap-1">{[0,1,2].map(j => <div key={j} className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: `${j * 0.15}s` }} />)}</div>
              </div>
            </div>
          )
          return (
            <div key={i} className={`flex items-start gap-3 ${isBot ? '' : 'flex-row-reverse'}`}>
              {isBot && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: '#E9FF7B' }}>
                  <Bot size={14} color="#0a0a0a" />
                </div>
              )}
              <div className="max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                style={isBot ? {
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)',
                } : {
                  background: 'rgba(233,255,123,0.1)', border: '1px solid rgba(233,255,123,0.2)', color: 'rgba(255,255,255,0.9)',
                }}>
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* Extract button */}
      {!isDone && !editingExtract && (
        <div className="px-5 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {userExchanges < 2 ? (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-3 text-sm"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <AlertCircle size={14} className="text-white/30" />
              <span className="text-white/30">Necesitas al menos 2 intercambios para extraer la propuesta</span>
            </div>
          ) : (
            <button onClick={extractDecisions} disabled={state.status === 'extracting'}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold mb-3 transition-all disabled:opacity-60"
              style={{ background: 'rgba(233,255,123,0.12)', color: '#E9FF7B', border: '1px solid rgba(233,255,123,0.25)' }}>
              {state.status === 'extracting'
                ? <><Loader2 size={14} className="animate-spin" /> Extrayendo decisiones...</>
                : <><Zap size={14} /> Extraer propuesta de esta área</>}
            </button>
          )}
        </div>
      )}

      {/* Input */}
      {!isDone && (
        <div className="px-5 py-3 shrink-0">
          <form onSubmit={e => {
            e.preventDefault()
            if (!input.trim()) return
            const msg = input.trim()
            setInput('')
            send(msg, state.messages)
          }} className="flex gap-2">
            <input
              className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20 outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              placeholder="Escribe algo sobre esta área..."
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <button type="submit" disabled={!input.trim()}
              className="px-4 py-2.5 rounded-xl disabled:opacity-40"
              style={{ background: '#E9FF7B', color: '#0a0a0a' }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Re-open chat if done */}
      {isDone && (
        <div className="px-5 py-3 shrink-0">
          <button onClick={() => onStateChange({ ...state, status: 'chatting' })}
            className="w-full py-2.5 rounded-xl text-sm text-white/40 transition-all"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            Continuar conversación
          </button>
        </div>
      )}
    </div>
  )
}

// ─── PROPOSAL EXPORT MODAL ───────────────────────────────────────────────────

function ProposalModal({
  areaSections,
  areaStates,
  onClose,
}: {
  areaSections: AreaSection[]
  areaStates: Record<string, AreaState>
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const text = buildProposalText(areaSections, areaStates)

  const copyText = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl rounded-3xl flex flex-col overflow-hidden"
        style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh' }}>

        <div className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <FileText size={18} style={{ color: '#E9FF7B' }} />
            <h2 className="text-white font-bold text-base" style={{ fontFamily: 'Inter Tight, sans-serif' }}>
              Propuesta generada · Tugó × 30X
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyText}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{ background: '#E9FF7B', color: '#0a0a0a', fontFamily: 'Inter Tight' }}>
              {copied ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar texto</>}
            </button>
            <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors ml-1">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <pre className="text-white/70 text-xs leading-relaxed whitespace-pre-wrap font-mono">
            {text}
          </pre>
        </div>

        <div className="px-6 py-4 shrink-0 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-white/25 text-xs">
            Copia este texto y pégalo en Canva, Notion o Word para armar la propuesta visual.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function ProposalView({
  submissions,
  totalPersonas,
  totalAreas,
  topRetos,
  topTools,
  noToolCount,
  areaSections,
  herramientaData,
}: Props) {
  const [expandedArea, setExpandedArea] = useState<string | null>(areaSections[0]?.area.id ?? null)
  const [chatArea, setChatArea] = useState<string | null>(null)
  const [areaStates, setAreaStates] = useState<Record<string, AreaState>>(
    Object.fromEntries(areaSections.map(s => [s.area.id, { messages: [], status: 'pending' as AreaStatus }]))
  )
  const [showProposal, setShowProposal] = useState(false)

  const toolMap = Object.fromEntries(herramientaData.map(h => [h.id, h]))
  const activeChatSection = areaSections.find(s => s.area.id === chatArea) ?? null

  const doneCount = Object.values(areaStates).filter(s => s.status === 'done').length
  const totalCount = areaSections.length
  const allDone = doneCount === totalCount && totalCount > 0

  const updateAreaState = useCallback((areaId: string, newState: AreaState | ((prev: AreaState) => AreaState)) => {
    setAreaStates(prev => ({
      ...prev,
      [areaId]: typeof newState === 'function' ? newState(prev[areaId]) : newState,
    }))
  }, [])

  if (submissions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <div className="text-center space-y-4">
          <div className="text-4xl">📭</div>
          <h2 className="text-white text-xl font-bold" style={{ fontFamily: 'Inter Tight, sans-serif' }}>Sin diagnósticos aún</h2>
          <p className="text-white/40">Los gerentes de Tugó aún no han completado el formulario.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0a0a', fontFamily: 'Figtree, sans-serif' }}>

      {/* MAIN */}
      <div className={`flex-1 min-w-0 transition-all duration-300 ${chatArea ? 'md:mr-[440px]' : ''}`}>

        {/* NAV */}
        <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
          style={{ background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="text-white font-bold text-sm" style={{ fontFamily: 'Inter Tight, sans-serif' }}>
            Tugó <span style={{ color: '#E9FF7B' }}>×</span> 30X <span className="text-white/30 font-normal">· Propuesta</span>
          </span>
          <div className="flex items-center gap-3">
            {/* Progress */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {areaSections.map(s => {
                  const st = areaStates[s.area.id]?.status
                  return (
                    <div key={s.area.id} className="w-2 h-2 rounded-full transition-all"
                      style={{ background: st === 'done' ? '#34D399' : st === 'chatting' ? '#E9FF7B' : 'rgba(255,255,255,0.15)' }} />
                  )
                })}
              </div>
              <span className="text-white/40 text-xs">{doneCount}/{totalCount} áreas</span>
            </div>
            {/* Generate button */}
            <button
              onClick={() => setShowProposal(true)}
              disabled={doneCount === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all disabled:opacity-30"
              style={allDone
                ? { background: '#E9FF7B', color: '#0a0a0a' }
                : { background: 'rgba(233,255,123,0.1)', color: '#E9FF7B', border: '1px solid rgba(233,255,123,0.2)' }}
            >
              <FileText size={13} />
              {allDone ? 'Generar propuesta' : `Generar (${doneCount}/${totalCount})`}
            </button>
          </div>
        </nav>

        {/* HERO */}
        <section className="px-6 pt-12 pb-8 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight" style={{ fontFamily: 'Inter Tight, sans-serif' }}>
              Propuesta de formación IA<br /><span style={{ color: '#E9FF7B' }}>para Tugó</span>
            </h1>
            <p className="text-white/50 text-base max-w-2xl leading-relaxed">
              Revisa cada área con el asistente 30X, confirma el programa y los cupos,
              y genera la propuesta lista para presentar.
            </p>

            {/* Progress bar */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${(doneCount / totalCount) * 100}%`, background: '#34D399' }} />
              </div>
              <span className="text-white/40 text-sm shrink-0">{doneCount} de {totalCount} áreas revisadas</span>
            </div>

            {allDone && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 px-5 py-4 rounded-2xl"
                style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)' }}>
                <CheckCircle2 size={18} style={{ color: '#34D399' }} />
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm" style={{ fontFamily: 'Inter Tight, sans-serif' }}>Todas las áreas revisadas</p>
                  <p className="text-white/40 text-xs">La propuesta está lista para generar y exportar.</p>
                </div>
                <button onClick={() => setShowProposal(true)}
                  className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold"
                  style={{ background: '#E9FF7B', color: '#0a0a0a', fontFamily: 'Inter Tight' }}>
                  Generar <ArrowRight size={14} />
                </button>
              </motion.div>
            )}
          </motion.div>
        </section>

        {/* KPIs */}
        <section className="px-6 pb-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: String(submissions.length), label: 'Líderes diagnosticados', color: '#E9FF7B' },
              { value: String(totalAreas), label: 'Áreas en scope', color: '#0099FF' },
              { value: String(totalPersonas), label: 'Personas totales', color: '#C084FC' },
              { value: `${Math.round(((submissions.length - noToolCount) / submissions.length) * 100)}%`, label: 'Ya usan IA hoy', color: '#34D399' },
            ].map(({ value, label, color }) => (
              <div key={label} className="rounded-2xl p-5 text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-2xl font-bold mb-1" style={{ fontFamily: 'Inter Tight, sans-serif', color }}>{value}</div>
                <div className="text-white/40 text-xs">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ÁREAS */}
        <section className="px-6 pb-14 max-w-4xl mx-auto">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Inter Tight, sans-serif' }}>Revisión área por área</h2>
            <p className="text-white/30 text-sm mt-0.5">Debes revisar cada área con el asistente antes de generar la propuesta.</p>
          </div>

          <div className="space-y-3">
            {areaSections.map((section) => {
              const { area, submissions: subs, totalHeadcount, herramientas, retos, quotes, insights, programs, maturityScore } = section
              const isOpen = expandedArea === area.id
              const isChatOpen = chatArea === area.id
              const areaState = areaStates[area.id]
              const isDone = areaState?.status === 'done'
              const isChatting = areaState?.status === 'chatting'
              const maturity = maturityLabel(maturityScore)
              const uniqueTools = [...new Set(herramientas)].filter(h => h !== 'ninguna')
              const hasNoTools = !uniqueTools.length

              return (
                <motion.div key={area.id} layout className="rounded-2xl overflow-hidden"
                  style={{
                    background: isDone ? 'rgba(52,211,153,0.03)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isDone ? 'rgba(52,211,153,0.2)' : isChatOpen ? 'rgba(233,255,123,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  }}>

                  <div className="px-6 py-5 flex items-center justify-between gap-4">
                    <button className="flex items-center gap-4 min-w-0 flex-1 text-left"
                      onClick={() => setExpandedArea(isOpen ? null : area.id)}>
                      <span className="text-2xl shrink-0">{area.emoji}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-white font-bold" style={{ fontFamily: 'Inter Tight, sans-serif' }}>{area.nombre}</h3>
                          {isDone && <CheckCircle2 size={15} style={{ color: '#34D399' }} />}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-white/40 text-xs">{subs.length} líder{subs.length > 1 ? 'es' : ''} · {totalHeadcount} personas</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: `${maturity.color}18`, color: maturity.color, border: `1px solid ${maturity.color}33` }}>
                            {maturity.label}
                          </span>
                          {isDone && areaState.extract && (
                            <span className="text-xs text-white/30">→ {areaState.extract.programaNombre} · {areaState.extract.cupos} cupos</span>
                          )}
                          {!isDone && hasNoTools && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>Sin IA</span>
                          )}
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-14 h-1.5 rounded-full hidden sm:block" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${maturityScore}%`, background: maturity.color }} />
                      </div>
                      <button onClick={() => setChatArea(isChatOpen ? null : area.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                        style={isChatOpen ? {
                          background: 'rgba(233,255,123,0.15)', color: '#E9FF7B', border: '1px solid rgba(233,255,123,0.3)',
                        } : isDone ? {
                          background: 'rgba(52,211,153,0.1)', color: '#34D399', border: '1px solid rgba(52,211,153,0.2)',
                        } : isChatting ? {
                          background: 'rgba(233,255,123,0.1)', color: '#E9FF7B', border: '1px solid rgba(233,255,123,0.2)',
                        } : {
                          background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)',
                        }}>
                        <MessageSquare size={12} />
                        {isDone ? 'Ver revisión' : isChatting ? 'Continuando...' : 'Revisar área'}
                      </button>
                      <button onClick={() => setExpandedArea(isOpen ? null : area.id)} className="text-white/20 hover:text-white/50 transition-colors">
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="px-6 pb-6 space-y-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <div className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-5">

                            <div className="space-y-4">
                              <div>
                                <div className="text-white/30 text-xs uppercase tracking-widest mb-3">Quién respondió</div>
                                <div className="space-y-2">
                                  {subs.map(sub => (
                                    <div key={sub.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                        style={{ background: 'rgba(233,255,123,0.12)', color: '#E9FF7B', fontFamily: 'Inter Tight' }}>
                                        {sub.nombre.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="text-white text-sm font-medium" style={{ fontFamily: 'Inter Tight, sans-serif' }}>{sub.nombre}</p>
                                        <p className="text-white/40 text-xs">{sub.cargo}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {subs.some(s => s.roles?.length) && (
                                <div>
                                  <div className="text-white/30 text-xs uppercase tracking-widest mb-3">Equipo · {totalHeadcount} personas</div>
                                  <div className="space-y-1.5">
                                    {subs.flatMap(s => s.roles ?? []).map((rol, i) => (
                                      <div key={i} className="flex items-start justify-between px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                        <div className="min-w-0">
                                          <span className="text-white/80 text-sm">{rol.nombre}</span>
                                          {rol.nombrePersona && <span className="text-white/30 text-xs ml-2">({rol.nombrePersona})</span>}
                                          {rol.necesidad && <div className="text-white/40 text-xs mt-0.5">→ {rol.necesidad}</div>}
                                        </div>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full ml-2 shrink-0" style={{ background: 'rgba(233,255,123,0.1)', color: '#E9FF7B' }}>{rol.headcount}p</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="space-y-4">
                              <div>
                                <div className="text-white/30 text-xs uppercase tracking-widest mb-3">IA actual</div>
                                {hasNoTools ? (
                                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
                                    <AlertCircle size={14} style={{ color: '#f87171' }} />
                                    <span className="text-sm" style={{ color: '#f87171' }}>Ninguna herramienta aún</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {uniqueTools.map(hid => {
                                      const h = toolMap[hid]
                                      return h ? <span key={hid} className="text-sm px-3 py-1.5 rounded-full text-white/70" style={{ background: 'rgba(255,255,255,0.06)' }}>{h.emoji} {h.nombre}</span> : null
                                    })}
                                  </div>
                                )}
                              </div>
                              {retos.length > 0 && (
                                <div>
                                  <div className="text-white/30 text-xs uppercase tracking-widest mb-2">Retos</div>
                                  <div className="flex flex-wrap gap-2">
                                    {[...new Set(retos)].map(r => (
                                      <span key={r} className="text-xs px-3 py-1.5 rounded-full" style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>{r}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {programs.length > 0 && (
                                <div>
                                  <div className="text-white/30 text-xs uppercase tracking-widest mb-2">Programas base</div>
                                  <div className="space-y-2">
                                    {programs.map(prog => (
                                      <a key={prog.name} href={prog.url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center justify-between px-4 py-2.5 rounded-xl group" style={{ background: `${prog.color}0d`, border: `1px solid ${prog.color}22` }}>
                                        <span className="text-white text-sm font-medium" style={{ fontFamily: 'Inter Tight' }}>{prog.name}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold" style={{ color: prog.color }}>{prog.price}</span>
                                          <ExternalLink size={11} style={{ color: prog.color }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {quotes.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 text-white/30 text-xs uppercase tracking-widest mb-2">
                                <Quote size={12} /> Del diagnóstico
                              </div>
                              <div className="space-y-2">
                                {quotes.map((q, i) => (
                                  <div key={i} className="flex gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <Quote size={13} className="shrink-0 mt-0.5 text-white/15" />
                                    <p className="text-white/55 text-sm italic">{q}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {insights.length > 0 && (
                            <div className="px-5 py-4 rounded-xl" style={{ background: 'rgba(233,255,123,0.04)', border: '1px solid rgba(233,255,123,0.12)' }}>
                              <div className="flex items-center gap-2 mb-2"><Zap size={12} style={{ color: '#E9FF7B' }} /><span className="text-white/30 text-xs uppercase tracking-widest">Diagnóstico 30X</span></div>
                              <p className="text-white/75 text-sm leading-relaxed">{insights[0].text}</p>
                            </div>
                          )}

                          {!isChatOpen && (
                            <button onClick={() => setChatArea(area.id)}
                              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
                              style={{ background: isDone ? 'rgba(52,211,153,0.07)' : 'rgba(233,255,123,0.07)', color: isDone ? '#34D399' : '#E9FF7B', border: `1px solid ${isDone ? 'rgba(52,211,153,0.2)' : 'rgba(233,255,123,0.15)'}` }}>
                              <MessageSquare size={14} />
                              {isDone ? 'Ver revisión del área' : 'Revisar esta área con el asistente 30X'}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* RETOS + ADOPCIÓN */}
        <section className="px-6 pb-12 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Inter Tight, sans-serif' }}>Retos más frecuentes</h2>
              <div className="space-y-3">
                {topRetos.map(([reto, count]) => (
                  <div key={reto}>
                    <div className="flex justify-between text-sm mb-1"><span className="text-white/60">{reto}</span><span style={{ color: '#E9FF7B' }}>{count}</span></div>
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-1.5 rounded-full" style={{ background: '#E9FF7B', width: `${(count / (topRetos[0]?.[1] ?? 1)) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Inter Tight, sans-serif' }}>Adopción actual de IA</h2>
              {noToolCount > 0 && (
                <div className="flex items-center gap-2 mb-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.1)' }}>
                  <AlertCircle size={14} style={{ color: '#f87171' }} />
                  <span className="text-sm" style={{ color: '#f87171' }}>{noToolCount} área{noToolCount > 1 ? 's' : ''} sin herramientas</span>
                </div>
              )}
              <div className="space-y-2">
                {topTools.map(([toolId, count]) => {
                  const h = toolMap[toolId]
                  return h ? (
                    <div key={toolId} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-lg">{h.emoji}</span>
                      <span className="text-white/70 text-sm flex-1">{h.nombre}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(233,255,123,0.1)', color: '#E9FF7B' }}>{count}/{submissions.length}</span>
                    </div>
                  ) : null
                })}
              </div>
            </div>
          </div>
        </section>

        <footer className="px-6 py-8 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-white/20 text-sm">© 2025 30X Escuela de Negocios · Propuesta confidencial para Tugó</p>
        </footer>
      </div>

      {/* CHAT PANEL */}
      <AnimatePresence>
        {chatArea && activeChatSection && (
          <motion.div key={chatArea}
            initial={{ x: 440, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 440, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed top-0 right-0 bottom-0 w-full md:w-[440px] z-50 flex flex-col"
            style={{ background: '#111111', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
            <AreaChatPanel
              section={activeChatSection}
              toolMap={toolMap}
              state={areaStates[activeChatSection.area.id] ?? { messages: [], status: 'pending' }}
              onClose={() => setChatArea(null)}
              onStateChange={(newState) => updateAreaState(activeChatSection.area.id, newState)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* PROPOSAL MODAL */}
      <AnimatePresence>
        {showProposal && (
          <ProposalModal
            areaSections={areaSections}
            areaStates={areaStates}
            onClose={() => setShowProposal(false)}
          />
        )}
      </AnimatePresence>

    </div>
  )
}
