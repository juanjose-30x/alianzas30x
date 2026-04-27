'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown, ChevronUp, ArrowRight, AlertCircle, Zap,
  ExternalLink, Quote, MessageSquare, Send, Loader2, X,
  Bot, CheckCircle2, Copy, Check, Edit3, FileText, BookOpen, Pencil
} from 'lucide-react'
import type { Lead, LeadSubmission } from '@/lib/b2b-types'

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
type AreaState = { messages: ChatMsg[]; status: AreaStatus; extract?: ProposalExtract }

type AreaSection = {
  area: Area
  submissions: LeadSubmission[]
  totalHeadcount: number
  herramientas: string[]
  retos: string[]
  quotes: string[]
  insights: { nombre: string; cargo: string; text: string }[]
  programs: Program[]
  maturityScore: number
}

type Props = {
  lead: Lead
  submissions: LeadSubmission[]
  areaSections: AreaSection[]
  herramientaData: HerramientaItem[]
  areasIntel: Record<string, string>
}

// ─── UTILS ───────────────────────────────────────────────────────────────────

const TRM = 3600

function buildProposalText(empresa: string, areaSections: AreaSection[], areaStates: Record<string, AreaState>): string {
  const doneAreas = areaSections.filter(s => areaStates[s.area.id]?.status === 'done' && areaStates[s.area.id]?.extract)
  const date = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })
  const programasUnicos = [...new Set(doneAreas.map(s => areaStates[s.area.id]!.extract!.programaNombre))]
  const rows = doneAreas.map(s => {
    const ext = areaStates[s.area.id]!.extract!
    return { area: s.area.nombre, emoji: s.area.emoji, programa: ext.programaNombre, cupos: ext.cupos, precio: ext.precioUSD, subtotal: ext.cupos * ext.precioUSD }
  })
  const subtotalUSD = rows.reduce((a, r) => a + r.subtotal, 0)
  const ivaUSD = subtotalUSD * 0.19
  const totalUSD = subtotalUSD + ivaUSD
  const totalCOP = totalUSD * TRM
  const S = '\n'
  let text = ''
  text += `╔══════════════════════════════════════════════════╗\n  SLIDE: PORTADA\n╚══════════════════════════════════════════════════╝\n`
  text += `Cliente:    ${empresa}\nTítulo:     Propuesta comercial\nProgramas:  ${programasUnicos.join(' & ')}\nFecha:      ${date}\n${S}`
  text += `╔══════════════════════════════════════════════════╗\n  SLIDE: APERTURA\n╚══════════════════════════════════════════════════╝\n`
  text += `${empresa} × 30X — ${programasUnicos.join(' & ')}\n${S}`
  for (const section of doneAreas) {
    const ext = areaStates[section.area.id]!.extract!
    const subtotal = ext.cupos * ext.precioUSD
    text += `\n╔══════════════════════════════════════════════════╗\n  ÁREA: ${section.area.nombre.toUpperCase()}\n╚══════════════════════════════════════════════════╝\n`
    text += `Hook:      ${ext.hook}\nProblema:  ${ext.problema}\nPrograma:  ${ext.programaNombre}\nJustif.:   ${ext.programaJustificacion}\nCupos:     ${ext.cupos}\nUSD/cupo:  $${ext.precioUSD.toLocaleString()}\nSubtotal:  $${subtotal.toLocaleString()} USD\n`
  }
  text += `\n╔══════════════════════════════════════════════════╗\n  TABLA FINAL DE INVERSIÓN\n╚══════════════════════════════════════════════════╝\n`
  for (const r of rows) text += `${r.area.padEnd(24)} | ${r.programa.padEnd(20)} | ${String(r.cupos).padStart(3)} cupos | $${r.precio.toLocaleString()}/cupo | $${r.subtotal.toLocaleString()} USD\n`
  text += `\nSubtotal   $${subtotalUSD.toLocaleString()} USD\nIVA 19%    $${Math.round(ivaUSD).toLocaleString()} USD\nTOTAL      $${Math.round(totalUSD).toLocaleString()} USD  ·  $${Math.round(totalCOP).toLocaleString('es-CO')} COP*\n`
  return text
}

// ─── AREA CHAT PANEL ─────────────────────────────────────────────────────────

function AreaChatPanel({ section, toolMap, state, slug, onClose, onStateChange }: {
  section: AreaSection; toolMap: Record<string, HerramientaItem>
  state: AreaState; slug: string; onClose: () => void; onStateChange: (s: AreaState) => void
}) {
  const [input, setInput] = useState('')
  const [editingExtract, setEditingExtract] = useState(false)
  const [localExtract, setLocalExtract] = useState<ProposalExtract | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const toolNames = [...new Set(section.herramientas)].filter(h => h !== 'ninguna').map(h => toolMap[h]?.nombre ?? h)
  const areaContext = {
    nombre: section.area.nombre, emoji: section.area.emoji,
    headcount: section.totalHeadcount, maturityScore: section.maturityScore,
    personas: section.submissions.map(s => ({ nombre: s.nombre, cargo: s.cargo })),
    roles: section.submissions.flatMap(s => s.roles ?? []),
    herramientas: toolNames, retos: [...new Set(section.retos)],
    quotes: section.quotes, insight: section.insights[0]?.text ?? null,
  }

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [state.messages])

  const send = useCallback(async (userContent: string, currentMessages: ChatMsg[]) => {
    const newMessages: ChatMsg[] = [...currentMessages, { role: 'user', content: userContent }]
    onStateChange({ ...state, messages: newMessages, status: 'chatting' })
    try {
      const res = await fetch(`/api/b2b/propuesta/${slug}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, areaContext }),
      })
      if (!res.ok || !res.body) throw new Error('Error')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      onStateChange({ ...state, messages: [...newMessages, { role: 'assistant', content: '' }], status: 'chatting' })
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        onStateChange({ ...state, messages: [...newMessages, { role: 'assistant', content: text }], status: 'chatting' })
      }
    } catch (e) { console.error(e) }
  }, [areaContext, state, onStateChange, slug])

  const extractDecisions = async () => {
    onStateChange({ ...state, status: 'extracting' })
    try {
      const res = await fetch(`/api/b2b/propuesta/${slug}/extract`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: state.messages, areaContext }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setLocalExtract(data); setEditingExtract(true)
      onStateChange({ ...state, status: 'chatting', extract: data })
    } catch (e) { console.error(e); onStateChange({ ...state, status: 'chatting' }) }
  }

  const confirmExtract = (ext: ProposalExtract) => { onStateChange({ ...state, status: 'done', extract: ext }); setEditingExtract(false) }
  const userExchanges = state.messages.filter(m => m.role === 'user').length
  const isDone = state.status === 'done'

  const STARTERS = [
    `Analiza el área de ${section.area.nombre} y recomienda el programa más adecuado.`,
    '¿Cuál es el quick win más claro para este equipo?',
    '¿Cuántos cupos recomiendas y cómo los asignarías?',
    '¿Cómo presentaría esta propuesta al gerente de esta área?',
  ]

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 12, color: 'var(--fg)',
    background: 'rgba(12,12,9,0.03)', border: '1px solid var(--br-mid)', outline: 'none',
    fontFamily: 'var(--font-geist), system-ui', resize: 'vertical' as const,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--br)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 16 }}>{section.area.emoji}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)', letterSpacing: '-0.03em' }}>{section.area.nombre}</span>
            {isDone && <CheckCircle2 size={13} color="#15803d" strokeWidth={2.5} />}
          </div>
          <p style={{ fontSize: 11, color: 'var(--t-ghost)', marginTop: 2, letterSpacing: '-0.01em' }}>
            {section.totalHeadcount} personas · {userExchanges} mensaje{userExchanges !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={onClose} style={{ padding: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--t-faint)', borderRadius: 6, display: 'flex' }}>
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Done summary */}
        {isDone && state.extract && !editingExtract && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 8, background: '#15803d0f', border: '1px solid #15803d28', marginBottom: 10 }}>
              <CheckCircle2 size={13} color="#15803d" strokeWidth={2.5} />
              <span style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>Área revisada</span>
            </div>
            <div style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid var(--br-mid)', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <p style={{ fontSize: 10, color: 'var(--t-ghost)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Hook</p>
                <p style={{ fontSize: 13, color: 'var(--t-subtle)', fontStyle: 'italic', lineHeight: 1.5 }}>&ldquo;{state.extract.hook}&rdquo;</p>
              </div>
              <div>
                <p style={{ fontSize: 10, color: 'var(--t-ghost)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Programa</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)', letterSpacing: '-0.02em' }}>{state.extract.programaNombre}</p>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                {[
                  { label: 'Cupos', value: String(state.extract.cupos) },
                  { label: 'USD/cupo', value: `$${state.extract.precioUSD.toLocaleString()}` },
                  { label: 'Subtotal', value: `$${(state.extract.cupos * state.extract.precioUSD).toLocaleString()}` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ fontSize: 10, color: 'var(--t-ghost)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg)', fontFamily: 'var(--font-geist-mono), monospace', letterSpacing: '-0.04em' }}>{value}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => { setLocalExtract(state.extract!); setEditingExtract(true) }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--t-faint)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-geist), system-ui' }}>
                <Edit3 size={10} /> Editar
              </button>
            </div>
          </div>
        )}

        {/* Edit extract form */}
        {editingExtract && localExtract && (
          <div style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid var(--br-mid)', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 11, color: 'var(--t-subtle)', fontWeight: 600 }}>Confirma la propuesta para esta área</p>
            {[
              { label: 'Hook', key: 'hook', multi: true },
              { label: 'Programa', key: 'programaNombre', multi: false },
              { label: 'Justificación', key: 'programaJustificacion', multi: true },
            ].map(({ label, key, multi }) => (
              <div key={key}>
                <label style={{ fontSize: 10, color: 'var(--t-faint)', letterSpacing: '0.07em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 4 }}>{label}</label>
                {multi ? (
                  <textarea rows={2} style={inputStyle} value={(localExtract as Record<string, string | number>)[key] as string}
                    onChange={e => setLocalExtract({ ...localExtract, [key]: e.target.value })} />
                ) : (
                  <input style={{ ...inputStyle, resize: undefined }} value={(localExtract as Record<string, string | number>)[key] as string}
                    onChange={e => setLocalExtract({ ...localExtract, [key]: e.target.value })} />
                )}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, color: 'var(--t-faint)', letterSpacing: '0.07em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 4 }}>Cupos</label>
                <input type="number" min={1} style={{ ...inputStyle, resize: undefined }} value={localExtract.cupos}
                  onChange={e => setLocalExtract({ ...localExtract, cupos: Number(e.target.value) })} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, color: 'var(--t-faint)', letterSpacing: '0.07em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 4 }}>USD/cupo</label>
                <input type="number" min={0} style={{ ...inputStyle, resize: undefined }} value={localExtract.precioUSD}
                  onChange={e => setLocalExtract({ ...localExtract, precioUSD: Number(e.target.value) })} />
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--t-ghost)' }}>
              Subtotal: ${(localExtract.cupos * localExtract.precioUSD).toLocaleString()} USD
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditingExtract(false)} style={{ flex: 1, padding: '9px 0', borderRadius: 7, fontSize: 12, background: 'rgba(12,12,9,0.05)', border: '1px solid var(--br)', cursor: 'pointer', color: 'var(--t-subtle)', fontFamily: 'var(--font-geist), system-ui' }}>
                Cancelar
              </button>
              <button onClick={() => confirmExtract(localExtract)} style={{ flex: 1, padding: '9px 0', borderRadius: 7, fontSize: 12, fontWeight: 600, background: 'var(--fg)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-geist), system-ui' }}>
                Confirmar
              </button>
            </div>
          </div>
        )}

        {/* Starters */}
        {state.messages.length === 0 && !isDone && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 4 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={13} color="#fff" />
              </div>
              <div style={{ padding: '10px 14px', borderRadius: '4px 14px 14px 14px', background: 'var(--bg-card)', border: '1px solid var(--br)', fontSize: 13, color: 'var(--t-subtle)', lineHeight: 1.55 }}>
                Tengo el diagnóstico de <strong style={{ color: 'var(--fg)' }}>{section.area.nombre}</strong>. ¿Por dónde empezamos?
              </div>
            </div>
            {STARTERS.map(s => (
              <button key={s} onClick={() => send(s, [])} style={{ textAlign: 'left', padding: '10px 13px', borderRadius: 8, fontSize: 12, color: 'var(--t-subtle)', background: 'var(--bg-card)', border: '1px solid var(--br)', cursor: 'pointer', letterSpacing: '-0.01em', fontFamily: 'var(--font-geist), system-ui', transition: 'border-color 120ms ease' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--br-mid)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--br)')}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        {state.messages.filter((m, i) => !(m.role === 'user' && i === 0 && m.content.startsWith('Analiza el área'))).map((msg, i) => {
          const isBot = msg.role === 'assistant'
          if (!msg.content.trim()) return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={13} color="#fff" />
              </div>
              <div style={{ padding: '10px 14px', borderRadius: '4px 14px 14px 14px', background: 'var(--bg-card)', border: '1px solid var(--br)' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(j => (
                    <div key={j} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--t-ghost)', animation: 'bounce 1.2s infinite', animationDelay: `${j * 0.2}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, flexDirection: isBot ? 'row' : 'row-reverse' }}>
              {isBot && (
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={13} color="#fff" />
                </div>
              )}
              <div style={{
                maxWidth: '86%', padding: '10px 14px', fontSize: 13, lineHeight: 1.6,
                borderRadius: isBot ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                background: isBot ? 'var(--bg-card)' : 'rgba(233,255,123,0.18)',
                border: isBot ? '1px solid var(--br)' : '1px solid rgba(233,255,123,0.4)',
                color: 'var(--fg)', whiteSpace: 'pre-wrap' as const,
              }}>
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* Extract prompt */}
      {!isDone && !editingExtract && (
        <div style={{ padding: '10px 18px 0', borderTop: '1px solid var(--br)', flexShrink: 0 }}>
          {userExchanges < 2 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 13px', borderRadius: 7, background: 'rgba(12,12,9,0.03)', border: '1px dashed var(--br-mid)', marginBottom: 10 }}>
              <AlertCircle size={13} color="var(--t-ghost)" />
              <span style={{ fontSize: 11, color: 'var(--t-ghost)' }}>Necesitas al menos 2 intercambios para extraer la propuesta</span>
            </div>
          ) : (
            <button onClick={extractDecisions} disabled={state.status === 'extracting'} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', borderRadius: 7, fontSize: 12, fontWeight: 600, marginBottom: 10, cursor: 'pointer', background: 'rgba(12,12,9,0.05)', border: '1px solid var(--br-mid)', color: 'var(--fg)', fontFamily: 'var(--font-geist), system-ui', opacity: state.status === 'extracting' ? 0.6 : 1 }}>
              {state.status === 'extracting' ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Extrayendo…</> : <><Zap size={12} /> Extraer propuesta de esta área</>}
            </button>
          )}
        </div>
      )}

      {/* Input */}
      {!isDone && (
        <div style={{ padding: '10px 18px 14px', flexShrink: 0 }}>
          <form onSubmit={e => { e.preventDefault(); if (!input.trim()) return; const msg = input.trim(); setInput(''); send(msg, state.messages) }} style={{ display: 'flex', gap: 8 }}>
            <input style={{ flex: 1, padding: '9px 12px', borderRadius: 8, fontSize: 13, color: 'var(--fg)', background: 'var(--bg-card)', border: '1px solid var(--br-mid)', outline: 'none', fontFamily: 'var(--font-geist), system-ui' }}
              placeholder="Escribe algo sobre esta área…" value={input} onChange={e => setInput(e.target.value)}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--br-str)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--br-mid)')} />
            <button type="submit" disabled={!input.trim()} style={{ padding: '9px 14px', borderRadius: 8, background: 'var(--fg)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: !input.trim() ? 0.35 : 1 }}>
              <Send size={14} strokeWidth={2} />
            </button>
          </form>
        </div>
      )}

      {isDone && (
        <div style={{ padding: '10px 18px 14px', flexShrink: 0 }}>
          <button onClick={() => onStateChange({ ...state, status: 'chatting' })} style={{ width: '100%', padding: '9px 0', borderRadius: 8, fontSize: 12, color: 'var(--t-subtle)', background: 'rgba(12,12,9,0.04)', border: '1px solid var(--br)', cursor: 'pointer', fontFamily: 'var(--font-geist), system-ui' }}>
            Continuar conversación
          </button>
        </div>
      )}
    </div>
  )
}

// ─── COPY MODAL (brief + propuesta) ──────────────────────────────────────────

function CopyModal({ title, content, onClose, loading }: { title: string; content: string | null; onClose: () => void; loading?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = () => { if (!content) return; navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(12,12,9,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.96, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--br-mid)', borderRadius: 14, width: '100%', maxWidth: 680, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--sh-md)' }}>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--br)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)', letterSpacing: '-0.03em' }}>{title}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {!loading && content && (
              <button onClick={copy} className="btn-primary" style={{ fontSize: 12, gap: 5 }}>
                {copied ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
              </button>
            )}
            <button onClick={onClose} style={{ padding: 5, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--t-faint)', display: 'flex', borderRadius: 6 }}>
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.25rem' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', gap: 12 }}>
              <Loader2 size={24} color="var(--t-faint)" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: 13, color: 'var(--t-ghost)' }}>Generando… 15–30 segundos</p>
            </div>
          ) : (
            <pre style={{ fontSize: 12, color: 'var(--t-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-geist-mono), monospace' }}>
              {content}
            </pre>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── BRIEF MODAL ─────────────────────────────────────────────────────────────

function BriefModal({ lead, submissions, areaSections, areaStates, areasIntel, onClose }: {
  lead: Lead; submissions: LeadSubmission[]; areaSections: AreaSection[]
  areaStates: Record<string, AreaState>; areasIntel: Record<string, string>; onClose: () => void
}) {
  const [brief, setBrief] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const areaConversations = Object.fromEntries(Object.entries(areaStates).map(([id, s]) => [id, s.messages]))
    fetch(`/api/b2b/propuesta/${lead.slug}/brief`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissions, areaSections: areaSections.map(s => ({ area: s.area, totalHeadcount: s.totalHeadcount })), areaConversations, areasIntel }),
    }).then(r => r.json()).then(d => { setBrief(d.brief ?? d.error ?? 'Error'); setLoading(false) }).catch(() => { setBrief('Error.'); setLoading(false) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AnimatePresence>
      <CopyModal title={`Brief de conversación · ${lead.empresa}`} content={brief} onClose={onClose} loading={loading} />
    </AnimatePresence>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function B2BProposalView({ lead, submissions, areaSections, herramientaData, areasIntel }: Props) {
  const [expandedArea, setExpandedArea] = useState<string | null>(areaSections[0]?.area.id ?? null)
  const [chatArea, setChatArea] = useState<string | null>(null)
  const [areaStates, setAreaStates] = useState<Record<string, AreaState>>(
    Object.fromEntries(areaSections.map(s => [s.area.id, { messages: [], status: 'pending' as AreaStatus }]))
  )
  const [showProposal, setShowProposal] = useState(false)
  const [showBrief, setShowBrief] = useState(false)

  const toolMap = Object.fromEntries(herramientaData.map(h => [h.id, h]))
  const activeChatSection = areaSections.find(s => s.area.id === chatArea) ?? null
  const doneCount = Object.values(areaStates).filter(s => s.status === 'done').length
  const totalCount = areaSections.length
  const allDone = doneCount === totalCount && totalCount > 0

  const updateAreaState = useCallback((id: string, s: AreaState) => setAreaStates(prev => ({ ...prev, [id]: s })), [])

  const empresa = lead.diagnostico_config.nombre_empresa_display || lead.empresa
  const totalPersonas = areaSections.reduce((a, s) => a + s.totalHeadcount, 0)
  const noToolCount = areaSections.filter(s => !s.herramientas.some(h => h !== 'ninguna')).length

  const retoCounts: Record<string, number> = {}
  for (const sub of submissions) for (const r of sub.retos_chips ?? []) retoCounts[r] = (retoCounts[r] ?? 0) + 1
  const topRetos = Object.entries(retoCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)

  const toolCounts: Record<string, number> = {}
  for (const sub of submissions) for (const h of sub.herramientas ?? []) if (h !== 'ninguna') toolCounts[h] = (toolCounts[h] ?? 0) + 1
  const topTools = Object.entries(toolCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const doneAreas = areaSections.filter(s => areaStates[s.area.id]?.status === 'done' && areaStates[s.area.id]?.extract)
  const proposalCupos = doneAreas.reduce((a, s) => a + (areaStates[s.area.id]?.extract?.cupos ?? 0), 0)
  const proposalUSD = doneAreas.reduce((a, s) => a + (areaStates[s.area.id]?.extract?.cupos ?? 0) * (areaStates[s.area.id]?.extract?.precioUSD ?? 0), 0)

  const navStyle: React.CSSProperties = {
    position: 'sticky', top: 0, zIndex: 40,
    background: 'rgba(243,242,238,0.88)', backdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--br)',
  }

  if (submissions.length === 0) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: 16 }}>—</p>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--fg)', marginBottom: 8 }}>Sin diagnósticos aún</h2>
          <p style={{ fontSize: 13, color: 'var(--t-subtle)' }}>Los gerentes de {empresa} aún no han completado el formulario.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh' }}>

      {/* NAV */}
      <header style={navStyle}>
        <div style={{ maxWidth: '60rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', height: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <a href="/pipeline" style={{ fontSize: 13, color: 'var(--t-subtle)', textDecoration: 'none', letterSpacing: '-0.01em' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--fg)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--t-subtle)')}>Pipeline</a>
            <span style={{ color: 'rgba(12,12,9,0.18)', fontSize: 14 }}>/</span>
            <a href={`/pipeline/${lead.slug}`} style={{ fontSize: 13, color: 'var(--t-subtle)', textDecoration: 'none', letterSpacing: '-0.01em' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--fg)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--t-subtle)')}>{empresa}</a>
            <span style={{ color: 'rgba(12,12,9,0.18)', fontSize: 14 }}>/</span>
            <span style={{ fontSize: 13, color: 'var(--t-subtle)', letterSpacing: '-0.01em' }}>Propuesta</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Progress dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', gap: 3 }}>
                {areaSections.map(s => {
                  const st = areaStates[s.area.id]?.status
                  return <div key={s.area.id} style={{ width: 7, height: 7, borderRadius: '50%', background: st === 'done' ? '#15803d' : st === 'chatting' ? '#b45309' : 'var(--t-ghost)', transition: 'background 200ms ease' }} />
                })}
              </div>
              <span style={{ fontSize: 11, color: 'var(--t-ghost)', letterSpacing: '-0.01em' }}>{doneCount}/{totalCount}</span>
            </div>

            <button onClick={() => setShowBrief(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, fontSize: 12, color: 'var(--t-subtle)', background: 'var(--bg-card)', border: '1px solid var(--br-mid)', cursor: 'pointer', letterSpacing: '-0.01em', fontFamily: 'var(--font-geist), system-ui', boxShadow: 'var(--sh-sm)' }}>
              <BookOpen size={12} strokeWidth={2} /> Brief
            </button>
            <button onClick={() => setShowProposal(true)} disabled={doneCount === 0} className="btn-primary" style={{ fontSize: 12, opacity: doneCount === 0 ? 0.3 : 1 }}>
              <FileText size={12} strokeWidth={2} />
              {allDone ? 'Generar propuesta' : `Propuesta (${doneCount}/${totalCount})`}
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '60rem', margin: '0 auto', padding: '0 2.5rem', transition: 'margin-right 300ms cubic-bezier(0.32,0.72,0,1)', marginRight: chatArea ? 440 : undefined }}>

        {/* HERO */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ paddingTop: '3.5rem', paddingBottom: '2rem', borderBottom: '1px solid var(--br)' }}>
          <p className="label-caps" style={{ marginBottom: '1rem' }}>Propuesta B2B</p>
          <h1 style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1, color: 'var(--fg)', marginBottom: '1rem' }}>
            Formación IA<br />
            <span style={{ color: 'var(--t-faint)' }}>para {empresa}</span>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--t-subtle)', lineHeight: 1.65, maxWidth: '50ch', letterSpacing: '-0.01em', marginBottom: '1.5rem' }}>
            Revisa cada área con el asistente, confirma programa y cupos, y genera la propuesta lista para presentar.
          </p>

          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(12,12,9,0.08)' }}>
              <div style={{ height: 3, borderRadius: 2, background: '#15803d', width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%`, transition: 'width 400ms ease' }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--t-faint)', flexShrink: 0, letterSpacing: '-0.01em' }}>{doneCount} de {totalCount} áreas</span>
          </div>

          {allDone && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 10, background: '#15803d0a', border: '1px solid #15803d28' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={15} color="#15803d" strokeWidth={2.5} />
                <span style={{ fontSize: 13, color: '#15803d', fontWeight: 600 }}>Todas las áreas revisadas</span>
              </div>
              <button onClick={() => setShowProposal(true)} className="btn-primary" style={{ fontSize: 12 }}>
                Generar <ArrowRight size={12} strokeWidth={2.5} />
              </button>
            </motion.div>
          )}
        </motion.section>

        {/* KPIs */}
        <section style={{ paddingTop: '2.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid var(--br)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
            {[
              { value: String(submissions.length), label: 'Líderes diagnosticados' },
              { value: String(areaSections.length), label: 'Áreas en scope' },
              { value: String(totalPersonas), label: 'Personas totales' },
              { value: submissions.length > 0 ? `${Math.round(((submissions.length - noToolCount) / submissions.length) * 100)}%` : '—', label: 'Ya usan IA' },
            ].map(({ value, label }, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
                {i > 0 && <div style={{ width: 1, background: 'var(--br)', alignSelf: 'stretch', margin: '0 2rem' }} />}
                <div>
                  <div style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--fg)', fontFamily: 'var(--font-geist-mono), monospace', letterSpacing: '-0.05em', lineHeight: 1 }}>
                    {value}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--t-ghost)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 6 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PROPUESTA EN CONSTRUCCIÓN */}
        {doneCount > 0 && (
          <section style={{ paddingTop: '2.5rem', paddingBottom: '2.5rem', borderBottom: '1px solid var(--br)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <p className="label-caps">Propuesta en construcción</p>
              <span style={{ fontSize: 12, color: 'var(--t-faint)', letterSpacing: '-0.01em', fontFamily: 'var(--font-geist-mono), monospace' }}>
                {proposalCupos} cupos · ${proposalUSD.toLocaleString()} USD
              </span>
            </div>

            <div style={{ border: '1px solid var(--br)', borderRadius: 10, overflow: 'hidden' }}>
              {doneAreas.map((section, i) => {
                const ext = areaStates[section.area.id]!.extract!
                const subtotal = ext.cupos * ext.precioUSD
                return (
                  <div key={section.area.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start', padding: '14px 18px', borderBottom: i < doneAreas.length - 1 ? '1px solid var(--br)' : 'none', background: 'var(--bg-card)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14 }}>{section.area.emoji}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--fg)', letterSpacing: '-0.02em' }}>{section.area.nombre}</span>
                        <span style={{ fontSize: 12, color: '#15803d', letterSpacing: '-0.01em' }}>→ {ext.programaNombre}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--t-faint)', fontStyle: 'italic', lineHeight: 1.5, borderLeft: '2px solid var(--br-mid)', paddingLeft: 8 }}>
                        &ldquo;{ext.hook}&rdquo;
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 11, color: 'var(--t-ghost)', letterSpacing: '-0.01em' }}>{ext.cupos} cupos · ${ext.precioUSD.toLocaleString()}/c</p>
                      <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg)', fontFamily: 'var(--font-geist-mono), monospace', letterSpacing: '-0.04em' }}>${subtotal.toLocaleString()}</p>
                    </div>
                  </div>
                )
              })}

              {/* Total */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', padding: '12px 18px', background: 'rgba(12,12,9,0.03)', borderTop: '2px solid var(--br)' }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t-faint)' }}>Total · IVA 19% aparte</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--fg)', fontFamily: 'var(--font-geist-mono), monospace', letterSpacing: '-0.05em' }}>
                  ${proposalUSD.toLocaleString()} USD
                </span>
              </div>
            </div>
          </section>
        )}

        {/* ÁREAS */}
        <section style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <p className="label-caps">Revisión área por área</p>
            <span style={{ fontSize: 12, color: 'var(--t-ghost)' }}>Revisa cada área con el asistente antes de generar la propuesta</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--br)', border: '1px solid var(--br)', borderRadius: 10, overflow: 'hidden' }}>
            {areaSections.map(section => {
              const { area, submissions: subs, totalHeadcount, herramientas, retos, quotes, insights, programs, maturityScore } = section
              const isOpen = expandedArea === area.id
              const isChatOpen = chatArea === area.id
              const areaState = areaStates[area.id]
              const isDone = areaState?.status === 'done'
              const isChatting = areaState?.status === 'chatting'
              const uniqueTools = [...new Set(herramientas)].filter(h => h !== 'ninguna')

              return (
                <div key={area.id} style={{ background: isDone ? '#15803d05' : 'var(--bg-card)' }}>
                  {/* Area row header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', gap: 12 }}>
                    <button onClick={() => setExpandedArea(isOpen ? null : area.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: isDone ? '#15803d' : isChatting ? '#b45309' : 'var(--t-ghost)', boxShadow: isDone ? '0 0 0 3px #15803d18' : 'none', transition: 'background 200ms ease' }} />
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{area.emoji}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)', letterSpacing: '-0.02em' }}>{area.nombre}</span>
                          {isDone && areaState.extract && (
                            <span style={{ fontSize: 12, color: '#15803d', letterSpacing: '-0.01em' }}>→ {areaState.extract.programaNombre} · {areaState.extract.cupos} cupos</span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--t-ghost)', letterSpacing: '-0.01em' }}>
                          {subs.length} líder{subs.length !== 1 ? 'es' : ''} · {totalHeadcount} personas
                        </span>
                      </div>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => setChatArea(isChatOpen ? null : area.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 6, fontSize: 12, cursor: 'pointer', letterSpacing: '-0.01em', fontFamily: 'var(--font-geist), system-ui', transition: 'all 130ms ease', background: isChatOpen ? 'var(--fg)' : isDone ? '#15803d0f' : 'rgba(12,12,9,0.05)', color: isChatOpen ? '#fff' : isDone ? '#15803d' : 'var(--t-subtle)', border: `1px solid ${isChatOpen ? 'transparent' : isDone ? '#15803d28' : 'var(--br)'}` }}>
                        <MessageSquare size={12} strokeWidth={2} />
                        {isDone ? 'Ver revisión' : isChatting ? 'En curso…' : 'Revisar área'}
                      </button>
                      <button onClick={() => setExpandedArea(isOpen ? null : area.id)} style={{ padding: 4, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--t-faint)', display: 'flex' }}>
                        {isOpen ? <ChevronUp size={15} strokeWidth={2} /> : <ChevronDown size={15} strokeWidth={2} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded area detail */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--br)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', paddingTop: '1rem' }}>

                          {/* Left: respondents + roles */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t-faint)', marginBottom: 8 }}>Quién respondió</p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {subs.map(sub => (
                                  <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', borderRadius: 7, background: 'rgba(12,12,9,0.03)', border: '1px solid var(--br)' }}>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{sub.nombre.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div>
                                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)', letterSpacing: '-0.02em' }}>{sub.nombre}</p>
                                      <p style={{ fontSize: 11, color: 'var(--t-faint)' }}>{sub.cargo}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {subs.some(s => s.roles?.length) && (
                              <div>
                                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t-faint)', marginBottom: 8 }}>Equipo · {totalHeadcount} personas</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  {subs.flatMap(s => s.roles ?? []).map((rol, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 6, background: 'rgba(12,12,9,0.03)' }}>
                                      <div style={{ minWidth: 0 }}>
                                        <span style={{ fontSize: 12, color: 'var(--fg)' }}>{rol.nombre}</span>
                                        {rol.nombrePersona && <span style={{ fontSize: 11, color: 'var(--t-faint)', marginLeft: 5 }}>({rol.nombrePersona})</span>}
                                        {rol.necesidad && <p style={{ fontSize: 11, color: 'var(--t-ghost)', marginTop: 2 }}>→ {rol.necesidad}</p>}
                                      </div>
                                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg)', fontFamily: 'var(--font-geist-mono), monospace', marginLeft: 8, flexShrink: 0 }}>{rol.headcount}p</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right: tools, retos, programs */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t-faint)', marginBottom: 8 }}>IA actual</p>
                              {uniqueTools.length === 0 ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 6, background: 'rgba(185,28,28,0.05)', border: '1px solid rgba(185,28,28,0.15)' }}>
                                  <AlertCircle size={12} color="#b91c1c" />
                                  <span style={{ fontSize: 12, color: '#b91c1c' }}>Sin herramientas aún</span>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                  {uniqueTools.map(hid => {
                                    const h = toolMap[hid]
                                    return h ? <span key={hid} style={{ fontSize: 12, padding: '4px 9px', borderRadius: 5, background: 'rgba(12,12,9,0.05)', border: '1px solid var(--br)', color: 'var(--t-subtle)' }}>{h.emoji} {h.nombre}</span> : null
                                  })}
                                </div>
                              )}
                            </div>

                            {retos.length > 0 && (
                              <div>
                                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t-faint)', marginBottom: 8 }}>Retos</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                  {[...new Set(retos)].map(r => (
                                    <span key={r} style={{ fontSize: 11, padding: '4px 9px', borderRadius: 5, background: 'rgba(109,40,217,0.06)', border: '1px solid rgba(109,40,217,0.15)', color: '#6d28d9' }}>{r}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {programs.length > 0 && (
                              <div>
                                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t-faint)', marginBottom: 8 }}>Programas base</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                  {programs.map(prog => (
                                    <a key={prog.name} href={prog.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 7, background: `${prog.color}0d`, border: `1px solid ${prog.color}22`, textDecoration: 'none' }}>
                                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>{prog.name}</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: prog.color }}>{prog.price}</span>
                                        <ExternalLink size={10} color={prog.color} />
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quotes */}
                        {quotes.length > 0 && (
                          <div style={{ padding: '0 18px 14px' }}>
                            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t-faint)', marginBottom: 8 }}>Del diagnóstico</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {quotes.map((q, i) => (
                                <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderRadius: 7, background: 'rgba(12,12,9,0.03)', border: '1px solid var(--br)' }}>
                                  <Quote size={12} color="var(--t-ghost)" style={{ flexShrink: 0, marginTop: 2 }} />
                                  <p style={{ fontSize: 12, color: 'var(--t-subtle)', fontStyle: 'italic', lineHeight: 1.55 }}>{q}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Insight */}
                        {insights.length > 0 && (
                          <div style={{ margin: '0 18px 14px', padding: '12px 14px', borderRadius: 8, background: 'rgba(233,255,123,0.08)', border: '1px solid rgba(233,255,123,0.3)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                              <Zap size={11} color="#85903a" />
                              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#85903a' }}>Diagnóstico 30X</span>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--t-muted)', lineHeight: 1.6 }}>{insights[0].text}</p>
                          </div>
                        )}

                        {!isChatOpen && (
                          <div style={{ padding: '0 18px 14px' }}>
                            <button onClick={() => setChatArea(area.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: isDone ? '#15803d0a' : 'rgba(12,12,9,0.04)', color: isDone ? '#15803d' : 'var(--t-subtle)', border: `1px solid ${isDone ? '#15803d28' : 'var(--br)'}`, fontFamily: 'var(--font-geist), system-ui' }}>
                              <MessageSquare size={13} strokeWidth={2} />
                              {isDone ? 'Ver revisión del área' : 'Revisar con el asistente 30X'}
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </section>

        {/* RETOS + ADOPCIÓN */}
        {(topRetos.length > 0 || topTools.length > 0) && (
          <section style={{ paddingBottom: '4rem', borderTop: '1px solid var(--br)', paddingTop: '2.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
              {topRetos.length > 0 && (
                <div>
                  <p className="label-caps" style={{ marginBottom: '1.25rem' }}>Retos más frecuentes</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {topRetos.map(([reto, count]) => (
                      <div key={reto}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: 'var(--t-subtle)' }}>{reto}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--fg)', fontFamily: 'var(--font-geist-mono), monospace' }}>{count}</span>
                        </div>
                        <div style={{ height: 3, borderRadius: 2, background: 'rgba(12,12,9,0.08)' }}>
                          <div style={{ height: 3, borderRadius: 2, background: 'var(--fg)', width: `${(count / (topRetos[0]?.[1] ?? 1)) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {topTools.length > 0 && (
                <div>
                  <p className="label-caps" style={{ marginBottom: '1.25rem' }}>Adopción de IA</p>
                  {noToolCount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 6, background: 'rgba(185,28,28,0.05)', border: '1px solid rgba(185,28,28,0.12)', marginBottom: 10 }}>
                      <AlertCircle size={12} color="#b91c1c" />
                      <span style={{ fontSize: 11, color: '#b91c1c' }}>{noToolCount} área{noToolCount > 1 ? 's' : ''} sin herramientas</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {topTools.map(([toolId, count]) => {
                      const h = toolMap[toolId]
                      return h ? (
                        <div key={toolId} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 7, background: 'var(--bg-card)', border: '1px solid var(--br)' }}>
                          <span style={{ fontSize: 14 }}>{h.emoji}</span>
                          <span style={{ fontSize: 12, color: 'var(--t-subtle)', flex: 1 }}>{h.nombre}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg)', fontFamily: 'var(--font-geist-mono), monospace' }}>{count}/{submissions.length}</span>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <div style={{ paddingBottom: '2rem', borderTop: '1px solid var(--br)', paddingTop: '1.5rem' }}>
          <p style={{ fontSize: 11, color: 'var(--t-ghost)', letterSpacing: '-0.01em' }}>Propuesta confidencial para {empresa} · 30X Escuela de Negocios</p>
        </div>
      </div>

      {/* CHAT SLIDE-OVER */}
      <AnimatePresence>
        {chatArea && activeChatSection && (
          <motion.div key={chatArea}
            initial={{ x: 440, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 440, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 280, mass: 0.9 }}
            style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 440, zIndex: 50, borderLeft: '1px solid var(--br-mid)', boxShadow: '-4px 0 24px rgba(12,12,9,0.06)' }}>
            <AreaChatPanel
              section={activeChatSection} toolMap={toolMap}
              state={areaStates[activeChatSection.area.id] ?? { messages: [], status: 'pending' }}
              slug={lead.slug} onClose={() => setChatArea(null)}
              onStateChange={s => updateAreaState(activeChatSection.area.id, s)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALS */}
      <AnimatePresence>
        {showProposal && (
          <CopyModal
            title={`Propuesta · ${empresa} × 30X`}
            content={buildProposalText(empresa, areaSections, areaStates)}
            onClose={() => setShowProposal(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBrief && (
          <BriefModal lead={lead} submissions={submissions} areaSections={areaSections} areaStates={areaStates} areasIntel={areasIntel} onClose={() => setShowBrief(false)} />
        )}
      </AnimatePresence>

    </div>
  )
}
