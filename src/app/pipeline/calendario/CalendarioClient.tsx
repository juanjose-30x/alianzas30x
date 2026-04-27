'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, Plus, Loader2, Trash2 } from 'lucide-react'
import type { PipelineEvent, EventType } from '@/lib/events-supabase'
import { EVENT_TYPE_LABELS } from '@/lib/events-supabase'
import { LEAD_STATUS_LABELS } from '@/lib/b2b-types'

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTHS_ES    = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

type LeadOption = { id: string; slug: string; empresa: string; status: string }

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function parseIso(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function CalendarioClient({
  initialEvents,
  leads,
}: {
  initialEvents: PipelineEvent[]
  leads: LeadOption[]
}) {
  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)  // 1-indexed
  const [events, setEvents] = useState<PipelineEvent[]>(initialEvents)

  // Selected day panel
  const [selectedDay, setSelectedDay]   = useState<string | null>(null)
  const [showAddForm,  setShowAddForm]  = useState(false)

  // Add form state
  const [formTitle,    setFormTitle]    = useState('')
  const [formType,     setFormType]     = useState<EventType>('meeting')
  const [formLeadSlug, setFormLeadSlug] = useState('')
  const [formNotes,    setFormNotes]    = useState('')
  const [saving,       setSaving]       = useState(false)
  const [deleting,     setDeleting]     = useState<string | null>(null)

  // Build calendar grid (Mon-Sun weeks)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay  = new Date(year, month, 0)
    // Day of week for first day (0=Sun → need Mon=0)
    let startDow = firstDay.getDay() - 1
    if (startDow < 0) startDow = 6

    const days: (string | null)[] = []
    for (let i = 0; i < startDow; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(`${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`)
    }
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [year, month])

  // Events grouped by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, PipelineEvent[]> = {}
    events.forEach(ev => {
      const key = ev.date.slice(0, 10)
      if (!map[key]) map[key] = []
      map[key].push(ev)
    })
    return map
  }, [events])

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
    setSelectedDay(null)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  const dayEvents = selectedDay ? (eventsByDate[selectedDay] ?? []) : []
  const selectedLead = leads.find(l => l.slug === formLeadSlug)

  const resetForm = useCallback(() => {
    setFormTitle('')
    setFormType('meeting')
    setFormLeadSlug('')
    setFormNotes('')
    setShowAddForm(false)
  }, [])

  const handleAddEvent = async () => {
    if (!formTitle.trim() || !selectedDay || !formLeadSlug) return
    setSaving(true)
    const lead = leads.find(l => l.slug === formLeadSlug)!
    try {
      const res = await fetch('/api/b2b/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id:    lead.id,
          lead_slug:  lead.slug,
          empresa:    lead.empresa,
          title:      formTitle.trim(),
          date:       selectedDay,
          type:       formType,
          notes:      formNotes.trim() || null,
          user_email: null,
        }),
      })
      const ev = await res.json()
      if (!ev.error) {
        setEvents(prev => [...prev, ev])
        resetForm()
      }
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await fetch(`/api/b2b/events/${id}`, { method: 'DELETE' })
      setEvents(prev => prev.filter(e => e.id !== id))
    } catch (e) { console.error(e) }
    setDeleting(null)
  }

  const todayIso = isoDate(today)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh' }}>

      {/* PAGE HEADER */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(243,242,238,0.88)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--br)',
      }}>
        <div style={{
          maxWidth: '80rem', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 2.5rem', height: 52,
        }}>
          <span style={{ fontSize: 13, color: 'var(--t-subtle)', letterSpacing: '-0.01em' }}>Calendario</span>

          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={prevMonth}
              style={{ padding: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--t-faint)', display: 'flex', borderRadius: 6, transition: 'color 130ms ease' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--fg)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--t-faint)')}
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--fg)', minWidth: 160, textAlign: 'center' }}>
              {MONTHS_ES[month - 1]} {year}
            </span>
            <button
              onClick={nextMonth}
              style={{ padding: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--t-faint)', display: 'flex', borderRadius: 6, transition: 'color 130ms ease' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--fg)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--t-faint)')}
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>

          <button
            onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1) }}
            style={{
              fontSize: 12, color: 'var(--t-subtle)', background: 'var(--bg-card)',
              border: '1px solid var(--br-mid)', borderRadius: 6, padding: '5px 12px',
              cursor: 'pointer', letterSpacing: '-0.01em', boxShadow: 'var(--sh-sm)',
              fontFamily: 'var(--font-geist), system-ui',
            }}
          >
            Hoy
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 2.5rem 4rem', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>

        {/* CALENDAR GRID */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 1 }}>
            {DAYS_OF_WEEK.map(d => (
              <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t-ghost)' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: 'var(--br)' }}>
            {calendarDays.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} style={{ background: 'rgba(12,12,9,0.015)', minHeight: 100 }} />
              }
              const dayEvs  = eventsByDate[day] ?? []
              const isToday = day === todayIso
              const isSelected = day === selectedDay
              const dayNum  = parseInt(day.split('-')[2])

              return (
                <motion.div
                  key={day}
                  onClick={() => { setSelectedDay(isSelected ? null : day); setShowAddForm(false); resetForm() }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    background: isSelected ? 'var(--fg)' : isToday ? 'rgba(233,255,123,0.12)' : 'var(--bg-card)',
                    minHeight: 100, padding: '8px 10px', cursor: 'pointer',
                    transition: 'background 140ms ease',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(12,12,9,0.03)' }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = isToday ? 'rgba(233,255,123,0.12)' : 'var(--bg-card)' }}
                >
                  {/* Day number */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{
                      fontSize: 12, fontWeight: isToday ? 700 : 400, letterSpacing: '-0.02em',
                      color: isSelected ? '#ffffff' : isToday ? 'var(--fg)' : 'var(--t-subtle)',
                      width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '50%',
                      background: isToday && !isSelected ? 'rgba(12,12,9,0.09)' : 'transparent',
                    }}>
                      {dayNum}
                    </span>
                  </div>

                  {/* Events */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {dayEvs.slice(0, 3).map(ev => {
                      const typeInfo = EVENT_TYPE_LABELS[ev.type]
                      return (
                        <div
                          key={ev.id}
                          style={{
                            fontSize: 10, fontWeight: 500, letterSpacing: '-0.01em',
                            padding: '2px 6px', borderRadius: 3,
                            background: isSelected ? 'rgba(255,255,255,0.18)' : `${typeInfo.color}18`,
                            color: isSelected ? '#ffffff' : typeInfo.color,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}
                        >
                          {ev.empresa}
                        </div>
                      )
                    })}
                    {dayEvs.length > 3 && (
                      <div style={{ fontSize: 10, color: isSelected ? 'rgba(255,255,255,0.6)' : 'var(--t-ghost)', paddingLeft: 6 }}>
                        +{dayEvs.length - 3} más
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Event type legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
            {Object.entries(EVENT_TYPE_LABELS).map(([type, { label, color }]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
                <span style={{ fontSize: 11, color: 'var(--t-faint)', letterSpacing: '-0.01em' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* DAY DETAIL PANEL */}
        <AnimatePresence>
          {selectedDay && (
            <motion.div
              key={selectedDay}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              style={{
                width: 300, flexShrink: 0,
                background: 'var(--bg-card)',
                border: '1px solid var(--br-mid)',
                borderRadius: 12, overflow: 'hidden',
                boxShadow: 'var(--sh-md)',
                position: 'sticky', top: 72,
              }}
            >
              {/* Panel header */}
              <div style={{
                padding: '14px 16px', borderBottom: '1px solid var(--br)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <p className="label-caps" style={{ marginBottom: 2 }}>
                    {MONTHS_ES[month - 1]} {year}
                  </p>
                  <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--fg)', fontFamily: 'var(--font-geist-mono), monospace', lineHeight: 1 }}>
                    {parseInt(selectedDay.split('-')[2]).toString().padStart(2, '0')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => { setShowAddForm(v => !v); resetForm() }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                      background: showAddForm ? 'var(--fg)' : 'var(--bg-card)',
                      color: showAddForm ? '#ffffff' : 'var(--t-subtle)',
                      border: '1px solid var(--br-mid)', cursor: 'pointer',
                      boxShadow: 'var(--sh-sm)', letterSpacing: '-0.01em',
                      fontFamily: 'var(--font-geist), system-ui',
                      transition: 'background 130ms ease, color 130ms ease',
                    }}
                  >
                    <Plus size={12} strokeWidth={2.5} /> Añadir
                  </button>
                  <button
                    onClick={() => { setSelectedDay(null); resetForm() }}
                    style={{ padding: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--t-faint)', display: 'flex', borderRadius: 6 }}
                  >
                    <X size={15} strokeWidth={2} />
                  </button>
                </div>
              </div>

              {/* Add event form */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--br)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* Lead selector */}
                      <div>
                        <label style={{ fontSize: 10, color: 'var(--t-faint)', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
                          Empresa
                        </label>
                        <select
                          value={formLeadSlug}
                          onChange={e => setFormLeadSlug(e.target.value)}
                          style={{
                            width: '100%', padding: '8px 10px', borderRadius: 6,
                            fontSize: 12, color: 'var(--fg)', outline: 'none', cursor: 'pointer',
                            background: 'rgba(12,12,9,0.03)', border: '1px solid var(--br-mid)',
                            fontFamily: 'var(--font-geist), system-ui',
                          }}
                        >
                          <option value="">Seleccionar empresa…</option>
                          {leads.map(l => (
                            <option key={l.slug} value={l.slug}>{l.empresa}</option>
                          ))}
                        </select>
                      </div>

                      {/* Title */}
                      <div>
                        <label style={{ fontSize: 10, color: 'var(--t-faint)', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
                          Título
                        </label>
                        <input
                          value={formTitle}
                          onChange={e => setFormTitle(e.target.value)}
                          placeholder="Primera reunión, demo…"
                          style={{
                            width: '100%', padding: '8px 10px', borderRadius: 6,
                            fontSize: 12, color: 'var(--fg)', outline: 'none',
                            background: 'rgba(12,12,9,0.03)', border: '1px solid var(--br-mid)',
                            fontFamily: 'var(--font-geist), system-ui',
                          }}
                        />
                      </div>

                      {/* Type */}
                      <div>
                        <label style={{ fontSize: 10, color: 'var(--t-faint)', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
                          Tipo
                        </label>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(Object.entries(EVENT_TYPE_LABELS) as [EventType, { label: string; color: string }][]).map(([type, info]) => (
                            <button
                              key={type}
                              onClick={() => setFormType(type)}
                              style={{
                                fontSize: 11, padding: '4px 8px', borderRadius: 4, cursor: 'pointer',
                                background: formType === type ? `${info.color}18` : 'transparent',
                                color: formType === type ? info.color : 'var(--t-faint)',
                                border: `1px solid ${formType === type ? `${info.color}40` : 'var(--br)'}`,
                                fontFamily: 'var(--font-geist), system-ui',
                                transition: 'all 120ms ease',
                              }}
                            >
                              {info.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label style={{ fontSize: 10, color: 'var(--t-faint)', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
                          Notas
                        </label>
                        <textarea
                          value={formNotes}
                          onChange={e => setFormNotes(e.target.value)}
                          placeholder="Opcional…"
                          rows={2}
                          style={{
                            width: '100%', padding: '8px 10px', borderRadius: 6,
                            fontSize: 12, color: 'var(--fg)', outline: 'none', resize: 'vertical',
                            background: 'rgba(12,12,9,0.03)', border: '1px solid var(--br-mid)',
                            fontFamily: 'var(--font-geist), system-ui', lineHeight: 1.5,
                          }}
                        />
                      </div>

                      <button
                        onClick={handleAddEvent}
                        disabled={saving || !formTitle.trim() || !formLeadSlug}
                        className="btn-primary"
                        style={{ justifyContent: 'center', opacity: (saving || !formTitle.trim() || !formLeadSlug) ? 0.4 : 1 }}
                      >
                        {saving ? <><Loader2 size={12} className="animate-spin" /> Guardando…</> : 'Guardar evento'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Events for selected day */}
              <div style={{ overflowY: 'auto', maxHeight: 420 }}>
                {dayEvents.length === 0 && !showAddForm ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--t-ghost)' }}>
                    <p style={{ fontSize: 13 }}>Sin eventos</p>
                    <p style={{ fontSize: 11, marginTop: 4 }}>Haz clic en "Añadir" para crear uno</p>
                  </div>
                ) : (
                  dayEvents.map(ev => {
                    const typeInfo = EVENT_TYPE_LABELS[ev.type]
                    const statusInfo = LEAD_STATUS_LABELS[ev.lead_slug as keyof typeof LEAD_STATUS_LABELS]
                    return (
                      <div
                        key={ev.id}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid var(--br)',
                          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: typeInfo.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {ev.title}
                            </span>
                          </div>
                          <a
                            href={`/pipeline/${ev.lead_slug}`}
                            style={{ fontSize: 11, color: 'var(--t-subtle)', textDecoration: 'none', letterSpacing: '-0.01em', display: 'block' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--fg)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--t-subtle)')}
                          >
                            {ev.empresa}
                          </a>
                          <span style={{
                            fontSize: 10, color: typeInfo.color, letterSpacing: '-0.01em',
                            background: `${typeInfo.color}14`, padding: '1px 6px', borderRadius: 3,
                            display: 'inline-block', marginTop: 4,
                          }}>
                            {typeInfo.label}
                          </span>
                          {ev.notes && (
                            <p style={{ fontSize: 11, color: 'var(--t-faint)', marginTop: 4, lineHeight: 1.45 }}>
                              {ev.notes}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(ev.id)}
                          disabled={deleting === ev.id}
                          style={{ padding: 5, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--t-ghost)', flexShrink: 0, borderRadius: 5, transition: 'color 130ms ease' }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--c-danger)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--t-ghost)')}
                        >
                          {deleting === ev.id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Trash2 size={13} strokeWidth={2} />
                          }
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
