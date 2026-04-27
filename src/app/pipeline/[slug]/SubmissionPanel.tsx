'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bot, Send, Loader2, AlertCircle, Quote } from 'lucide-react'
import type { LeadSubmission } from '@/lib/b2b-types'

type ChatMsg  = { role: 'user' | 'assistant'; content: string }
type PanelTab = 'diagnostico' | 'conversacion' | 'chat'

const TABS: { id: PanelTab; label: string }[] = [
  { id: 'diagnostico',  label: 'Diagnóstico' },
  { id: 'conversacion', label: 'Conversación' },
  { id: 'chat',         label: 'Chat IA' },
]

export function SubmissionPanel({
  sub,
  slug,
  onClose,
}: {
  sub: LeadSubmission
  slug: string
  onClose: () => void
}) {
  const [activeTab, setActiveTab] = useState<PanelTab>('diagnostico')
  const [messages, setMessages]   = useState<ChatMsg[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = useCallback(async (userContent: string) => {
    const newMessages: ChatMsg[] = [...messages, { role: 'user', content: userContent }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const res = await fetch(`/api/b2b/leads/${slug}/submission-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, submission: sub }),
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
  }, [messages, slug, sub])

  const firstName = sub.nombre.split(' ')[0]

  const STARTERS = [
    `¿Qué programa le recomendarías a ${firstName} y por qué?`,
    `¿Qué objeciones probables tiene ${firstName}?`,
    `¿Cuál es el mensaje clave para convencer a ${firstName}?`,
    '¿Cuál es el quick win más claro para este equipo?',
  ]

  const transcript = (sub.chat_transcript ?? [])
    .filter((m, i) => !(m.role === 'user' && i === 0 && m.content.includes('CONVERSACION_COMPLETA')))

  return (
    <div
      className="fixed top-0 right-0 bottom-0 w-full md:w-[480px] z-50 flex flex-col"
      style={{
        background: 'var(--bg-card)',
        borderLeft: '1px solid var(--br-mid)',
        boxShadow: 'var(--shadow-panel)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', flexShrink: 0,
          borderBottom: '1px solid var(--br)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--fg)', color: '#ffffff',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: 13, fontWeight: 700, flexShrink: 0,
          }}>
            {sub.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.02em', color: 'var(--fg)' }}>
              {sub.nombre}
            </p>
            <p style={{ fontSize: 12, color: 'var(--t-subtle)', marginTop: 1, letterSpacing: '-0.01em' }}>
              {sub.cargo} · {sub.areas?.join(', ')}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: 6, borderRadius: 6, border: 'none', cursor: 'pointer',
            background: 'transparent', color: 'var(--t-faint)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color 130ms ease, background 130ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--fg)'; e.currentTarget.style.background = 'rgba(12,12,9,0.05)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--t-faint)'; e.currentTarget.style.background = 'transparent' }}
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Tab switcher */}
      <div
        style={{
          display: 'flex', padding: '0 20px', gap: 2, flexShrink: 0,
          borderBottom: '1px solid var(--br)',
        }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              position: 'relative' as const,
              padding: '10px 12px',
              fontSize: 12, fontWeight: activeTab === tab.id ? 600 : 400,
              letterSpacing: '-0.01em', cursor: 'pointer',
              color: activeTab === tab.id ? 'var(--fg)' : 'var(--t-faint)',
              background: 'transparent', border: 'none',
              transition: 'color 150ms ease',
              fontFamily: 'var(--font-geist), system-ui',
            }}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.span
                layoutId="panel-tab-indicator"
                style={{
                  position: 'absolute' as const, bottom: 0, left: 0, right: 0,
                  height: 2, borderRadius: '2px 2px 0 0',
                  background: 'var(--fg)',
                }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <AnimatePresence mode="wait">

          {/* DIAGNÓSTICO TAB */}
          {activeTab === 'diagnostico' && (
            <motion.div
              key="diagnostico"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' as const, gap: 12 }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {sub.herramientas?.filter(h => h !== 'ninguna').length > 0 ? (
                  <div style={{ borderRadius: 8, padding: 12, background: 'rgba(12,12,9,0.03)', border: '1px solid var(--br)' }}>
                    <p style={{ fontSize: 11, color: 'var(--t-subtle)', marginBottom: 8, letterSpacing: '-0.01em' }}>IA que usa hoy</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                      {sub.herramientas.filter(h => h !== 'ninguna').map(h => (
                        <span
                          key={h}
                          style={{
                            fontSize: 11, padding: '3px 8px', borderRadius: 4,
                            background: 'rgba(12,12,9,0.06)', color: 'var(--t-muted)',
                            border: '1px solid var(--br)',
                          }}
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    borderRadius: 8, padding: 12,
                    background: 'var(--c-danger-surface)', border: '1px solid var(--c-danger-border)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <AlertCircle size={12} color="var(--c-danger)" />
                    <span style={{ fontSize: 11, color: 'var(--c-danger)' }}>Sin herramientas IA</span>
                  </div>
                )}

                {sub.retos_chips?.length > 0 && (
                  <div style={{ borderRadius: 8, padding: 12, background: 'rgba(12,12,9,0.03)', border: '1px solid var(--br)' }}>
                    <p style={{ fontSize: 11, color: 'var(--t-subtle)', marginBottom: 8, letterSpacing: '-0.01em' }}>Retos</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                      {sub.retos_chips.slice(0, 3).map(r => (
                        <span
                          key={r}
                          style={{
                            fontSize: 11, padding: '3px 8px', borderRadius: 4,
                            background: 'var(--c-purple-surface)', color: 'var(--c-purple)',
                            border: '1px solid var(--c-purple-border)',
                          }}
                        >
                          {r}
                        </span>
                      ))}
                      {sub.retos_chips.length > 3 && (
                        <span style={{ fontSize: 11, color: 'var(--t-faint)' }}>+{sub.retos_chips.length - 3}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {sub.roles && sub.roles.length > 0 && (
                <div style={{ borderRadius: 8, padding: 12, background: 'rgba(12,12,9,0.03)', border: '1px solid var(--br)' }}>
                  <p style={{ fontSize: 11, color: 'var(--t-subtle)', marginBottom: 10, letterSpacing: '-0.01em' }}>
                    Equipo · {sub.headcount} personas
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                    {sub.roles.map((r, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, color: 'var(--t-muted)', letterSpacing: '-0.01em' }}>{r.nombre}</span>
                        <span style={{
                          fontSize: 12, fontWeight: 700,
                          fontFamily: 'var(--font-geist-mono), monospace',
                          color: 'var(--fg)', letterSpacing: '-0.03em',
                        }}>
                          {r.headcount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* CONVERSACIÓN TAB */}
          {activeTab === 'conversacion' && (
            <motion.div
              key="conversacion"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' as const, gap: 12 }}
            >
              {transcript.length > 0 ? (
                <>
                  <p className="label-caps" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Quote size={9} /> Conversación del diagnóstico
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                    {transcript.map((msg, i) => {
                      const isBot = msg.role === 'assistant'
                      const content = msg.content.replace('[CONVERSACION_COMPLETA]', '').trim()
                      if (!content) return null
                      return (
                        <div key={i} style={{ display: 'flex', gap: 8, flexDirection: isBot ? 'row' as const : 'row-reverse' as const }}>
                          {isBot && (
                            <div style={{
                              width: 20, height: 20, borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'var(--fg)', flexShrink: 0, marginTop: 2,
                            }}>
                              <Bot size={10} color="#ffffff" />
                            </div>
                          )}
                          <div
                            style={{
                              maxWidth: '85%', borderRadius: 10, padding: '8px 12px',
                              fontSize: 12, lineHeight: 1.55,
                              ...(isBot
                                ? { background: 'rgba(12,12,9,0.05)', color: 'var(--t-muted)', border: '1px solid var(--br)' }
                                : { background: 'var(--fg)', color: '#ffffff' }),
                            }}
                          >
                            {content}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', color: 'var(--t-faint)' }}>
                  <p style={{ fontSize: 13 }}>Sin transcripción disponible</p>
                </div>
              )}
            </motion.div>
          )}

          {/* CHAT IA TAB */}
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' as const, gap: 12 }}
            >
              <p className="label-caps" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Bot size={9} /> Pregúntale a la IA sobre {firstName}
              </p>

              {messages.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                  {STARTERS.map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      style={{
                        width: '100%', textAlign: 'left' as const, cursor: 'pointer',
                        padding: '10px 12px', borderRadius: 8,
                        fontSize: 12, color: 'var(--t-subtle)', letterSpacing: '-0.01em',
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
              )}

              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                {messages.map((msg, i) => {
                  const isBot = msg.role === 'assistant'
                  if (!msg.content.trim()) return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'var(--fg)', flexShrink: 0,
                      }}>
                        <Bot size={11} color="#ffffff" />
                      </div>
                      <div style={{ borderRadius: 10, padding: '8px 12px', background: 'rgba(12,12,9,0.05)', border: '1px solid var(--br)', display: 'flex', gap: 4 }}>
                        {[0, 1, 2].map(j => (
                          <div key={j} className="typing-dot" style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(12,12,9,0.25)' }} />
                        ))}
                      </div>
                    </div>
                  )
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexDirection: isBot ? 'row' as const : 'row-reverse' as const }}>
                      {isBot && (
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'var(--fg)', flexShrink: 0,
                        }}>
                          <Bot size={11} color="#ffffff" />
                        </div>
                      )}
                      <div
                        style={{
                          maxWidth: '88%', borderRadius: 10, padding: '10px 14px',
                          fontSize: 13, lineHeight: 1.6, letterSpacing: '-0.01em',
                          ...(isBot
                            ? { background: 'rgba(12,12,9,0.05)', border: '1px solid var(--br)', color: 'var(--t-muted)' }
                            : { background: 'var(--fg)', color: '#ffffff' }),
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  )
                })}
                <div ref={endRef} />
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Chat input */}
      {activeTab === 'chat' && (
        <div style={{ padding: '12px 20px', flexShrink: 0, borderTop: '1px solid var(--br)' }}>
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
              placeholder={`Pregunta sobre ${firstName}…`}
              value={input}
              onChange={e => setInput(e.target.value)}
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
      )}
    </div>
  )
}
