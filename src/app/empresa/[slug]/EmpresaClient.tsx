'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, Loader2, ChevronDown, ChevronUp, Users, LayoutGrid, FileText } from 'lucide-react'
import type { LeadSubmission } from '@/lib/b2b-types'

type ChatMsg = { role: 'user' | 'assistant'; content: string }

const STARTERS = [
  '¿Cuáles son los mayores retos identificados en mis equipos?',
  '¿Qué áreas tienen más urgencia de transformación digital?',
  '¿Cómo está el nivel de adopción de IA en la empresa?',
  '¿En qué departamentos hay más personas por impactar?',
]

export default function EmpresaClient({
  slug,
  token,
  empresa,
  industria,
  submissions,
  areas,
}: {
  slug: string
  token: string
  empresa: string
  industria: string | null
  submissions: LeadSubmission[]
  areas: string[]
}) {
  const [messages, setMessages]     = useState<ChatMsg[]>([])
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [expandedSub, setExpandedSub] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = useCallback(async (userContent: string) => {
    const newMessages: ChatMsg[] = [...messages, { role: 'user', content: userContent }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const res = await fetch(`/api/b2b/empresa/${slug}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, token }),
      })
      if (!res.ok || !res.body) throw new Error('Error')
      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      setMessages([...newMessages, { role: 'assistant', content: '' }])
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setMessages([...newMessages, { role: 'assistant', content: text }])
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [messages, slug, token])

  const totalHeadcount = submissions.reduce((s, sub) => s + (sub.headcount ?? 0), 0)
  const areasConRespuesta = new Set(submissions.flatMap(s => s.areas ?? [])).size

  const initialLetter = empresa.charAt(0).toUpperCase()

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(243,242,238,0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--br)',
      }}>
        <div style={{
          maxWidth: '60rem', margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '0 2rem', height: 56,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'var(--fg)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: 13, fontWeight: 700, flexShrink: 0,
          }}>
            {initialLetter}
          </div>
          <div>
            <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--fg)' }}>
              {empresa}
            </span>
            {industria && (
              <span style={{ fontSize: 12, color: 'var(--t-subtle)', marginLeft: 10 }}>
                {industria}
              </span>
            )}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#15803d' }} />
            <span style={{ fontSize: 11, color: 'var(--t-faint)' }}>Asistente interno</span>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '60rem', margin: '0 auto', padding: '2rem 2rem 6rem', width: '100%' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: '2.5rem' }}>
          {[
            { icon: <FileText size={14} />, label: 'Diagnósticos', value: submissions.length },
            { icon: <LayoutGrid size={14} />, label: 'Áreas analizadas', value: `${areasConRespuesta} de ${areas.length || areasConRespuesta}` },
            { icon: <Users size={14} />, label: 'Personas en scope', value: totalHeadcount },
          ].map(stat => (
            <div
              key={stat.label}
              style={{
                padding: '16px 18px', borderRadius: 10,
                border: '1px solid var(--br)',
                background: 'var(--bg-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--t-subtle)', marginBottom: 10 }}>
                {stat.icon}
                <span style={{ fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
                  {stat.label}
                </span>
              </div>
              <span style={{
                fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em',
                fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--fg)',
              }}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Diagnósticos */}
        {submissions.length > 0 && (
          <section style={{ marginBottom: '2.5rem' }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t-faint)', marginBottom: 14 }}>
              Diagnósticos por equipo
            </p>
            <div style={{ border: '1px solid var(--br)', borderRadius: 10, overflow: 'hidden' }}>
              {submissions.map((sub, i) => {
                const isExpanded = expandedSub === sub.id
                const isLast = i === submissions.length - 1
                return (
                  <div key={sub.id} style={{ borderBottom: isLast ? 'none' : '1px solid var(--br)' }}>
                    <button
                      onClick={() => setExpandedSub(isExpanded ? null : sub.id)}
                      style={{
                        width: '100%', display: 'grid',
                        gridTemplateColumns: '1fr auto auto auto',
                        alignItems: 'center', gap: 16,
                        padding: '14px 18px', cursor: 'pointer',
                        background: isExpanded ? 'rgba(12,12,9,0.025)' : 'transparent',
                        border: 'none', textAlign: 'left',
                        transition: 'background 130ms ease',
                        fontFamily: 'var(--font-geist), system-ui',
                      }}
                      onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'rgba(12,12,9,0.02)' }}
                      onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent' }}
                    >
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)', letterSpacing: '-0.02em' }}>
                          {sub.nombre}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--t-subtle)', marginLeft: 8 }}>
                          {sub.cargo}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {(sub.areas ?? []).map(a => (
                          <span
                            key={a}
                            style={{
                              fontSize: 11, padding: '2px 8px', borderRadius: 4,
                              background: 'rgba(12,12,9,0.05)', color: 'var(--t-subtle)',
                              border: '1px solid var(--br)',
                            }}
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        fontFamily: 'var(--font-geist-mono), monospace',
                        color: 'var(--t-subtle)', letterSpacing: '-0.02em',
                        whiteSpace: 'nowrap',
                      }}>
                        {sub.headcount} personas
                      </span>
                      <span style={{ color: 'var(--t-faint)', display: 'flex' }}>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{
                            padding: '14px 18px 18px',
                            borderTop: '1px solid var(--br)',
                            background: 'rgba(12,12,9,0.018)',
                            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
                          }}>
                            {sub.retos_chips?.length > 0 && (
                              <div>
                                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--t-faint)', marginBottom: 8 }}>
                                  Retos identificados
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                  {sub.retos_chips.map(r => (
                                    <span key={r} style={{
                                      fontSize: 11, padding: '3px 9px', borderRadius: 4,
                                      background: 'rgba(109,40,217,0.06)', color: '#6d28d9',
                                      border: '1px solid rgba(109,40,217,0.15)',
                                    }}>
                                      {r}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {sub.herramientas?.filter(h => h !== 'ninguna').length > 0 ? (
                              <div>
                                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--t-faint)', marginBottom: 8 }}>
                                  IA que usa hoy
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                  {sub.herramientas.filter(h => h !== 'ninguna').map(h => (
                                    <span key={h} style={{
                                      fontSize: 11, padding: '3px 9px', borderRadius: 4,
                                      background: 'rgba(12,12,9,0.05)', color: 'var(--t-muted)',
                                      border: '1px solid var(--br)',
                                    }}>
                                      {h}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--t-faint)', marginBottom: 8 }}>
                                  IA que usa hoy
                                </p>
                                <span style={{ fontSize: 12, color: 'var(--t-ghost)', fontStyle: 'italic' }}>Sin herramientas IA</span>
                              </div>
                            )}
                            {sub.retos_adicionales && (
                              <div style={{ gridColumn: '1 / -1' }}>
                                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--t-faint)', marginBottom: 6 }}>
                                  Contexto adicional
                                </p>
                                <p style={{ fontSize: 12, color: 'var(--t-muted)', lineHeight: 1.6 }}>
                                  {sub.retos_adicionales}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Chat IA */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: 'var(--fg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={12} color="#fff" />
            </div>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t-faint)' }}>
              Asistente IA — Pregunta sobre tus equipos
            </p>
          </div>

          <div style={{
            border: '1px solid var(--br)', borderRadius: 12,
            background: 'var(--bg-card)', overflow: 'hidden',
          }}>
            {/* Message area */}
            <div style={{ minHeight: 200, maxHeight: 420, overflowY: 'auto', padding: '20px 20px 12px' }}>
              {messages.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ fontSize: 13, color: 'var(--t-subtle)', marginBottom: 8 }}>
                    Pregúntame sobre los diagnósticos de tus equipos:
                  </p>
                  {STARTERS.map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      style={{
                        width: '100%', textAlign: 'left', cursor: 'pointer',
                        padding: '10px 14px', borderRadius: 8,
                        fontSize: 13, color: 'var(--t-subtle)', letterSpacing: '-0.01em',
                        background: 'rgba(12,12,9,0.03)', border: '1px solid var(--br)',
                        transition: 'background 120ms ease, color 120ms ease',
                        fontFamily: 'var(--font-geist), system-ui',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(12,12,9,0.06)'; e.currentTarget.style.color = 'var(--fg)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(12,12,9,0.03)'; e.currentTarget.style.color = 'var(--t-subtle)' }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {messages.map((msg, i) => {
                    const isBot = msg.role === 'assistant'
                    if (isBot && !msg.content.trim()) return (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: 6,
                          background: 'var(--fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Bot size={11} color="#fff" />
                        </div>
                        <div style={{ borderRadius: 10, padding: '9px 13px', background: 'rgba(12,12,9,0.05)', border: '1px solid var(--br)', display: 'flex', gap: 4, alignItems: 'center' }}>
                          {[0, 1, 2].map(j => (
                            <div key={j} className="typing-dot" style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(12,12,9,0.25)' }} />
                          ))}
                        </div>
                      </div>
                    )
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexDirection: isBot ? 'row' : 'row-reverse' }}>
                        {isBot && (
                          <div style={{
                            width: 24, height: 24, borderRadius: 6,
                            background: 'var(--fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <Bot size={11} color="#fff" />
                          </div>
                        )}
                        <div style={{
                          maxWidth: '88%', borderRadius: 10, padding: '10px 14px',
                          fontSize: 13, lineHeight: 1.65, letterSpacing: '-0.01em',
                          whiteSpace: 'pre-wrap',
                          ...(isBot
                            ? { background: 'rgba(12,12,9,0.05)', border: '1px solid var(--br)', color: 'var(--t-muted)' }
                            : { background: 'var(--fg)', color: '#ffffff' }),
                        }}>
                          {msg.content}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={endRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ borderTop: '1px solid var(--br)', padding: '12px 16px' }}>
              <form
                onSubmit={e => {
                  e.preventDefault()
                  if (!input.trim() || loading) return
                  const msg = input.trim()
                  setInput('')
                  send(msg)
                }}
                style={{ display: 'flex', gap: 8 }}
              >
                <input
                  style={{
                    flex: 1, padding: '9px 14px', borderRadius: 8, fontSize: 13,
                    background: 'rgba(12,12,9,0.04)', border: '1px solid var(--br-mid)',
                    color: 'var(--fg)', outline: 'none', letterSpacing: '-0.01em',
                    fontFamily: 'var(--font-geist), system-ui',
                  }}
                  placeholder="Pregunta sobre tus equipos…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--br-str)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--br-mid)')}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="btn-primary"
                  style={{ padding: '9px 14px' }}
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} strokeWidth={2} />}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
