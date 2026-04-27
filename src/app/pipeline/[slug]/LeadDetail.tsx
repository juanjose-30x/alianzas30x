'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, X, AlertTriangle, Pencil, Check, Link, RefreshCw, Copy } from 'lucide-react'
import type { Lead, LeadSubmission, LeadStatus } from '@/lib/b2b-types'
import { listContainer, listItem } from '@/lib/motion'
import { LeadHeader }         from './LeadHeader'
import { LeadSubmissionList } from './LeadSubmissionList'
import { LeadMetaBar }        from './LeadMetaBar'
import { SubmissionPanel }    from './SubmissionPanel'

const ROL_BADGE: Record<string, string> = {
  champion:   '#15803d',
  sponsor:    '#6d28d9',
  influencer: '#1d4ed8',
  blocker:    '#b91c1c',
}

const SIGNAL_LABEL: Record<string, string> = {
  alto: 'Alto', medio: 'Medio', bajo: 'Bajo', desconocido: 'Desconocido',
}

const S = {
  nav: {
    position: 'sticky' as const, top: 0, zIndex: 40,
    background: 'rgba(243,242,238,0.88)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(12,12,9,0.09)',
  },
  navInner: {
    maxWidth: '56rem', margin: '0 auto',
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '0 2.5rem', height: 52,
  },
  wrap: { maxWidth: '56rem', margin: '0 auto', padding: '0 2.5rem', paddingBottom: '6rem' },
}

export default function LeadDetail({ lead, submissions }: { lead: Lead; submissions: LeadSubmission[] }) {
  const [updatingStatus,      setUpdatingStatus]      = useState(false)
  const [currentStatus,       setCurrentStatus]       = useState<LeadStatus>(lead.status)
  const [activeSubmission,    setActiveSubmission]    = useState<LeadSubmission | null>(null)
  const [showPropuestaWarning,setShowPropuestaWarning]= useState(false)

  // Optimistic lead metadata update from edit panel
  const [leadMeta, setLeadMeta] = useState({
    empresa: lead.empresa,
    industria: lead.industria,
    pais: lead.pais,
    website: lead.website,
    contacto_nombre: lead.contacto_nombre,
    contacto_cargo: lead.contacto_cargo,
    contacto_email: lead.contacto_email,
    contacto_whatsapp: lead.contacto_whatsapp,
  })

  // Context inline edit
  const [editingContext, setEditingContext] = useState(false)
  const [contextDraft,   setContextDraft]  = useState(lead.discovery_data?.contexto_empresa ?? '')
  const [savedContext,   setSavedContext]  = useState(lead.discovery_data?.contexto_empresa ?? '')
  const [savingContext,  setSavingContext] = useState(false)

  // Notas ejecutivo inline edit
  const [editingNotas, setEditingNotas] = useState(false)
  const [notasDraft,   setNotasDraft]   = useState(lead.discovery_data?.notas_ejecutivo ?? '')
  const [savedNotas,   setSavedNotas]   = useState(lead.discovery_data?.notas_ejecutivo ?? '')
  const [savingNotas,  setSavingNotas]  = useState(false)

  const empresa = lead.diagnostico_config.nombre_empresa_display || leadMeta.empresa

  // ── Propuesta coverage ────────────────────────────────────────
  const areasEnScope = lead.discovery_data?.areas_identificadas ?? []

  const areaCoverage = areasEnScope.map(area => {
    const matching = submissions
      .filter(s => s.areas?.includes(area))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return { area, sub: matching[0] ?? null }
  })

  const areasCubiertas  = areaCoverage.filter(a => a.sub !== null).length
  const areasPendientes = areaCoverage.filter(a => a.sub === null).map(a => a.area)
  const propuestaLista  = areasEnScope.length > 0 && areasPendientes.length === 0

  const uniqueSubs = new Map<string, LeadSubmission>()
  areaCoverage.forEach(({ sub }) => { if (sub) uniqueSubs.set(sub.id, sub) })
  const totalCupos = Array.from(uniqueSubs.values()).reduce((sum, s) => sum + (s.headcount ?? 0), 0)
  // ─────────────────────────────────────────────────────────────

  const forceChangeStatus = async (status: LeadStatus) => {
    setUpdatingStatus(true)
    try {
      await fetch(`/api/b2b/leads/${lead.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      setCurrentStatus(status)
    } catch (e) { console.error(e) }
    setUpdatingStatus(false)
  }

  const changeStatus = async (status: LeadStatus) => {
    if (status === 'propuesta_lista' && !propuestaLista) {
      setShowPropuestaWarning(true)
      return
    }
    await forceChangeStatus(status)
  }

  const saveContext = async () => {
    setSavingContext(true)
    try {
      await fetch(`/api/b2b/leads/${lead.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discovery_data: { ...lead.discovery_data, contexto_empresa: contextDraft.trim() },
        }),
      })
      setSavedContext(contextDraft.trim())
      setEditingContext(false)
    } catch (e) { console.error(e) }
    setSavingContext(false)
  }

  const saveNotas = async () => {
    setSavingNotas(true)
    try {
      await fetch(`/api/b2b/leads/${lead.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discovery_data: { ...lead.discovery_data, notas_ejecutivo: notasDraft.trim() },
        }),
      })
      setSavedNotas(notasDraft.trim())
      setEditingNotas(false)
    } catch (e) { console.error(e) }
    setSavingNotas(false)
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh' }}>

      {/* NAV */}
      <header style={S.nav}>
        <div style={S.navInner}>
          <a
            href="/pipeline"
            style={{ color: 'var(--t-subtle)', fontSize: 13, letterSpacing: '-0.01em', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--fg)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--t-subtle)')}
          >
            Pipeline
          </a>
          <span style={{ color: 'rgba(12,12,9,0.18)', fontSize: 14, margin: '0 2px' }}>/</span>
          <span style={{ color: 'var(--t-subtle)', fontSize: 13, letterSpacing: '-0.01em' }}>{empresa}</span>
        </div>
      </header>

      <div
        style={{
          ...S.wrap,
          transition: 'margin-right 300ms cubic-bezier(0.32, 0.72, 0, 1)',
          marginRight: activeSubmission ? 480 : 0,
        }}
      >
        {/* HEADER */}
        <LeadHeader
          lead={{ ...lead, ...leadMeta }}
          currentStatus={currentStatus}
          onStatusChange={changeStatus}
          updatingStatus={updatingStatus}
          onLeadUpdate={patch => setLeadMeta(prev => ({ ...prev, ...patch }))}
        />

        {/* DIAGNÓSTICOS */}
        <section style={{ paddingTop: '3rem', paddingBottom: '3rem', borderBottom: '1px solid var(--br)' }}>
          <p className="label-caps" style={{ marginBottom: '1.5rem' }}>Diagnósticos recibidos</p>
          <LeadSubmissionList
            lead={lead}
            submissions={submissions}
            activeSubmissionId={activeSubmission?.id}
            onSelect={s => setActiveSubmission(prev => prev?.id === s.id ? null : s)}
          />
        </section>

        {/* PROPUESTA COVERAGE */}
        {areasEnScope.length > 0 && (
          <section style={{ paddingTop: '3rem', paddingBottom: '3rem', borderBottom: '1px solid var(--br)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <p className="label-caps">Cobertura para propuesta</p>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: propuestaLista ? '#15803d' : areasCubiertas > 0 ? '#b45309' : '#b3b0a8',
                background: propuestaLista ? '#15803d14' : areasCubiertas > 0 ? '#b4530914' : 'rgba(12,12,9,0.05)',
                border: `1px solid ${propuestaLista ? '#15803d28' : areasCubiertas > 0 ? '#b4530928' : 'var(--br)'}`,
                borderRadius: 4, padding: '2px 9px', letterSpacing: '-0.01em',
              }}>
                {areasCubiertas} / {areasEnScope.length} áreas
              </span>
            </div>

            <div style={{ border: '1px solid var(--br)', borderRadius: 10, overflow: 'hidden' }}>
              {areaCoverage.map(({ area, sub }, i) => {
                const covered = sub !== null
                return (
                  <div
                    key={area}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr auto',
                      gap: 12, alignItems: 'center',
                      padding: '13px 16px',
                      borderBottom: i < areaCoverage.length - 1 ? '1px solid var(--br)' : 'none',
                      background: covered ? 'var(--bg-card)' : 'rgba(12,12,9,0.015)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                        background: covered ? '#15803d' : 'var(--t-ghost)',
                        boxShadow: covered ? '0 0 0 3px #15803d18' : 'none',
                      }} />
                      <span style={{ fontSize: 13, fontWeight: covered ? 600 : 400, color: covered ? 'var(--fg)' : 'var(--t-subtle)', letterSpacing: '-0.02em' }}>
                        {area}
                      </span>
                    </div>

                    {covered ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                        <span style={{ fontSize: 12, color: 'var(--fg)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                          {sub!.nombre}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--t-faint)', flexShrink: 0 }}>· {sub!.cargo}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--t-ghost)', fontStyle: 'italic' as const }}>Sin diagnóstico</span>
                    )}

                    <span style={{
                      fontSize: 13, fontWeight: 700,
                      fontFamily: 'var(--font-geist-mono), monospace',
                      color: covered ? 'var(--fg)' : 'var(--t-ghost)',
                      letterSpacing: '-0.03em', textAlign: 'right' as const, minWidth: 80,
                    }}>
                      {covered ? `${sub!.headcount} cupos` : '—'}
                    </span>
                  </div>
                )
              })}

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr auto',
                gap: 12, alignItems: 'center',
                padding: '13px 16px',
                background: 'rgba(12,12,9,0.03)',
                borderTop: '2px solid var(--br)',
              }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--t-faint)' }}>
                  Total propuesta
                </span>
                <span />
                <span style={{
                  fontSize: 17, fontWeight: 800,
                  fontFamily: 'var(--font-geist-mono), monospace',
                  color: totalCupos > 0 ? 'var(--fg)' : 'var(--t-ghost)',
                  letterSpacing: '-0.05em', textAlign: 'right' as const, minWidth: 80,
                }}>
                  {totalCupos > 0 ? `${totalCupos} cupos` : '—'}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              {propuestaLista ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <CheckCircle2 size={14} color="#15803d" strokeWidth={2.5} />
                    <span style={{ fontSize: 12, color: '#15803d', letterSpacing: '-0.01em' }}>
                      Todas las áreas cubiertas — propuesta lista
                    </span>
                  </div>
                  {currentStatus !== 'propuesta_lista' && (
                    <button
                      onClick={() => changeStatus('propuesta_lista')}
                      disabled={updatingStatus}
                      className="btn-primary"
                      style={{ fontSize: 12, opacity: updatingStatus ? 0.5 : 1 }}
                    >
                      Marcar como propuesta lista
                    </button>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#b45309', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--t-faint)', letterSpacing: '-0.01em' }}>
                    Pendiente:{' '}
                    <span style={{ color: 'var(--t-subtle)', fontWeight: 500 }}>{areasPendientes.join(', ')}</span>
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* DISCOVERY: CONTEXTO */}
        {lead.discovery_data && (
          <section style={{ paddingTop: '3rem', paddingBottom: '3rem', borderBottom: '1px solid var(--br)' }}>

            {/* Contexto empresa — editable */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <p className="label-caps">Contexto</p>
                {!editingContext ? (
                  <button
                    onClick={() => { setContextDraft(savedContext); setEditingContext(true) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 10px', borderRadius: 6, fontSize: 11,
                      background: 'none', border: '1px solid var(--br)',
                      cursor: 'pointer', color: 'var(--t-faint)', letterSpacing: '-0.01em',
                      fontFamily: 'var(--font-geist), system-ui',
                      transition: 'border-color 130ms ease, color 130ms ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--br-mid)'; e.currentTarget.style.color = 'var(--t-subtle)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--br)'; e.currentTarget.style.color = 'var(--t-faint)' }}
                  >
                    <Pencil size={11} strokeWidth={2} /> Editar
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => { setContextDraft(savedContext); setEditingContext(false) }}
                      style={{
                        padding: '5px 10px', borderRadius: 6, fontSize: 11,
                        background: 'none', border: '1px solid var(--br)',
                        cursor: 'pointer', color: 'var(--t-faint)',
                        fontFamily: 'var(--font-geist), system-ui',
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveContext}
                      disabled={savingContext}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '5px 12px', borderRadius: 6, fontSize: 11,
                        background: 'var(--fg)', color: '#fff',
                        border: 'none', cursor: 'pointer',
                        fontFamily: 'var(--font-geist), system-ui',
                        opacity: savingContext ? 0.5 : 1,
                      }}
                    >
                      <Check size={11} strokeWidth={2.5} />
                      {savingContext ? 'Guardando…' : 'Guardar'}
                    </button>
                  </div>
                )}
              </div>

              <AnimatePresence mode="wait">
                {editingContext ? (
                  <motion.textarea
                    key="edit"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    value={contextDraft}
                    onChange={e => setContextDraft(e.target.value)}
                    rows={5}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 8,
                      fontSize: 14, color: 'var(--fg)', lineHeight: 1.65,
                      letterSpacing: '-0.01em', resize: 'vertical' as const,
                      background: 'rgba(12,12,9,0.03)', border: '1px solid var(--br-mid)',
                      outline: 'none', fontFamily: 'var(--font-geist), system-ui',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--br-str)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--br-mid)')}
                    autoFocus
                  />
                ) : (
                  <motion.p
                    key="view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ fontSize: 14, color: savedContext ? 'var(--t-muted)' : 'var(--t-ghost)', lineHeight: 1.7, letterSpacing: '-0.01em', fontStyle: savedContext ? 'normal' : 'italic' as const }}
                  >
                    {savedContext || 'Sin contexto registrado.'}
                  </motion.p>
                )}
              </AnimatePresence>

              {lead.discovery_data.senales_presupuesto && lead.discovery_data.senales_presupuesto !== 'desconocido' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                  <span style={{ fontSize: 11, color: 'var(--t-ghost)', letterSpacing: '-0.01em' }}>Señal presupuesto</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--t-subtle)' }}>
                    {SIGNAL_LABEL[lead.discovery_data.senales_presupuesto]}
                  </span>
                </div>
              )}
            </div>

            {/* Notas del ejecutivo */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <p className="label-caps">Notas del ejecutivo</p>
                  <p style={{ fontSize: 11, color: 'var(--t-ghost)', marginTop: 2, letterSpacing: '-0.01em' }}>
                    Apuntes inferenciales — no se muestran al cliente, alimentan el chat de diagnóstico
                  </p>
                </div>
                {!editingNotas ? (
                  <button
                    onClick={() => { setNotasDraft(savedNotas); setEditingNotas(true) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 10px', borderRadius: 6, fontSize: 11,
                      background: 'none', border: '1px solid var(--br)',
                      cursor: 'pointer', color: 'var(--t-faint)', letterSpacing: '-0.01em',
                      fontFamily: 'var(--font-geist), system-ui',
                      transition: 'border-color 130ms ease, color 130ms ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--br-mid)'; e.currentTarget.style.color = 'var(--t-subtle)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--br)'; e.currentTarget.style.color = 'var(--t-faint)' }}
                  >
                    <Pencil size={11} strokeWidth={2} /> {savedNotas ? 'Editar' : 'Agregar notas'}
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => { setNotasDraft(savedNotas); setEditingNotas(false) }}
                      style={{
                        padding: '5px 10px', borderRadius: 6, fontSize: 11,
                        background: 'none', border: '1px solid var(--br)',
                        cursor: 'pointer', color: 'var(--t-faint)',
                        fontFamily: 'var(--font-geist), system-ui',
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveNotas}
                      disabled={savingNotas}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '5px 12px', borderRadius: 6, fontSize: 11,
                        background: 'var(--fg)', color: '#fff',
                        border: 'none', cursor: 'pointer',
                        fontFamily: 'var(--font-geist), system-ui',
                        opacity: savingNotas ? 0.5 : 1,
                      }}
                    >
                      <Check size={11} strokeWidth={2.5} />
                      {savingNotas ? 'Guardando…' : 'Guardar'}
                    </button>
                  </div>
                )}
              </div>

              <AnimatePresence mode="wait">
                {editingNotas ? (
                  <motion.textarea
                    key="edit-notas"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    value={notasDraft}
                    onChange={e => setNotasDraft(e.target.value)}
                    rows={4}
                    placeholder="Ej: Isaac parece el campeón pero el director decide. El área de seguros puede ser más relevante de lo que parece. No mencionar precio en el primer contacto."
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 8,
                      fontSize: 14, color: 'var(--fg)', lineHeight: 1.65,
                      letterSpacing: '-0.01em', resize: 'vertical' as const,
                      background: 'rgba(12,12,9,0.03)', border: '1px solid var(--br-mid)',
                      outline: 'none', fontFamily: 'var(--font-geist), system-ui',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--br-str)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--br-mid)')}
                    autoFocus
                  />
                ) : (
                  <motion.p
                    key="view-notas"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      fontSize: 14, lineHeight: 1.7, letterSpacing: '-0.01em',
                      color: savedNotas ? 'var(--t-muted)' : 'var(--t-ghost)',
                      fontStyle: savedNotas ? 'normal' : 'italic' as const,
                      borderLeft: savedNotas ? '2px solid var(--br-mid)' : 'none',
                      paddingLeft: savedNotas ? 12 : 0,
                    }}
                  >
                    {savedNotas || 'Sin notas. Agrega apuntes inferenciales de la reunión.'}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Decision makers + áreas en dos columnas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {lead.discovery_data.decision_makers?.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--t-faint)', marginBottom: 12 }}>
                    Decision makers
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                    {lead.discovery_data.decision_makers.map((dm, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: ROL_BADGE[dm.rol] ?? 'var(--t-faint)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)', letterSpacing: '-0.02em' }}>{dm.nombre}</span>
                          <span style={{ fontSize: 12, color: 'var(--t-subtle)', marginLeft: 6 }}>{dm.cargo}</span>
                        </div>
                        <span style={{ fontSize: 11, color: ROL_BADGE[dm.rol] ?? 'var(--t-subtle)', flexShrink: 0 }}>{dm.rol}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lead.discovery_data.areas_identificadas?.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--t-faint)', marginBottom: 12 }}>
                    Áreas en scope
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                    {lead.discovery_data.areas_identificadas.map(a => {
                      const recibida = submissions.some(s => s.areas?.includes(a))
                      return (
                        <span
                          key={a}
                          style={{
                            fontSize: 12, padding: '4px 10px', borderRadius: 4,
                            background: recibida ? '#15803d14' : 'rgba(12,12,9,0.05)',
                            color: recibida ? '#15803d' : 'var(--t-subtle)',
                            border: `1px solid ${recibida ? '#15803d28' : 'var(--br)'}`,
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}
                        >
                          {recibida && <CheckCircle2 size={10} />}{a}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* META BAR */}
        <section style={{ paddingTop: '2rem' }}>
          <LeadMetaBar lead={lead} />
        </section>

        {/* ACCESO CLIENTE */}
        <ClientAccessPanel slug={lead.slug} initialToken={lead.diagnostico_config.client_token ?? null} empresa={empresa} />

      </div>

      {/* SUBMISSION PANEL */}
      <AnimatePresence>
        {activeSubmission && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 32, stiffness: 300, mass: 0.9 }}
          >
            <SubmissionPanel
              sub={activeSubmission}
              slug={lead.slug}
              onClose={() => setActiveSubmission(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* PROPUESTA WARNING MODAL */}
      <AnimatePresence>
        {showPropuestaWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(12,12,9,0.45)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '2rem',
            }}
            onClick={() => setShowPropuestaWarning(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 6 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400, mass: 0.8 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--br-mid)',
                borderRadius: 14, padding: '2rem',
                width: '100%', maxWidth: 420, boxShadow: 'var(--sh-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(180,83,9,0.08)', border: '1px solid rgba(180,83,9,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <AlertTriangle size={16} color="#b45309" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="label-caps" style={{ marginBottom: 3 }}>Áreas sin diagnóstico</p>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--fg)', lineHeight: 1.2 }}>
                      {areasPendientes.length} área{areasPendientes.length > 1 ? 's' : ''} sin conversar
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowPropuestaWarning(false)}
                  style={{ padding: 5, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--t-faint)', borderRadius: 6, display: 'flex' }}
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              <p style={{ fontSize: 13, color: 'var(--t-subtle)', lineHeight: 1.6, letterSpacing: '-0.01em', marginBottom: '1.25rem' }}>
                Para tener los cupos correctos en la propuesta necesitas un diagnóstico de cada área. Sin estos datos la propuesta quedará incompleta.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5, marginBottom: '1.5rem' }}>
                {areasPendientes.map(area => (
                  <div
                    key={area}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '9px 13px',
                      background: 'rgba(180,83,9,0.05)', border: '1px solid rgba(180,83,9,0.15)',
                      borderRadius: 7,
                    }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#b45309', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--fg)', letterSpacing: '-0.02em' }}>{area}</span>
                    <span style={{ fontSize: 11, color: 'var(--t-ghost)', marginLeft: 'auto' }}>Sin diagnóstico</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setShowPropuestaWarning(false)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13,
                    background: 'rgba(12,12,9,0.05)', border: '1px solid var(--br-mid)',
                    cursor: 'pointer', color: 'var(--t-subtle)', letterSpacing: '-0.01em',
                    fontFamily: 'var(--font-geist), system-ui',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => { setShowPropuestaWarning(false); await forceChangeStatus('propuesta_lista') }}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13,
                    background: 'var(--fg)', color: '#ffffff', border: 'none',
                    cursor: 'pointer', letterSpacing: '-0.01em', fontWeight: 500,
                    fontFamily: 'var(--font-geist), system-ui',
                  }}
                >
                  Avanzar de todas formas
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

// ── CLIENT ACCESS PANEL ────────────────────────────────────────

function ClientAccessPanel({
  slug,
  initialToken,
  empresa,
}: {
  slug: string
  initialToken: string | null
  empresa: string
}) {
  const [token, setToken]     = useState<string | null>(initialToken)
  const [saving, setSaving]   = useState(false)
  const [copied, setCopied]   = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const clientUrl = token ? `${origin}/empresa/${slug}?token=${token}` : null

  const generateToken = useCallback(async () => {
    const newToken = crypto.randomUUID().replace(/-/g, '').slice(0, 24)
    setSaving(true)
    try {
      await fetch(`/api/b2b/leads/${slug}/client-access`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: newToken }),
      })
      setToken(newToken)
    } catch (e) { console.error(e) }
    setSaving(false)
  }, [slug])

  const copyUrl = useCallback(() => {
    if (!clientUrl) return
    navigator.clipboard.writeText(clientUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [clientUrl])

  return (
    <section style={{ paddingTop: '1.5rem', paddingBottom: '2rem', borderTop: '1px solid var(--br)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link size={12} color="var(--t-faint)" />
          <p className="label-caps">Acceso cliente</p>
        </div>
        <button
          onClick={generateToken}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 6, fontSize: 11,
            background: 'none', border: '1px solid var(--br)',
            cursor: 'pointer', color: 'var(--t-faint)',
            fontFamily: 'var(--font-geist), system-ui',
            opacity: saving ? 0.5 : 1,
            transition: 'border-color 130ms ease, color 130ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--br-mid)'; e.currentTarget.style.color = 'var(--t-subtle)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--br)'; e.currentTarget.style.color = 'var(--t-faint)' }}
        >
          <RefreshCw size={10} strokeWidth={2} />
          {token ? 'Regenerar' : 'Generar acceso'}
        </button>
      </div>

      {token && clientUrl ? (
        <div>
          <p style={{ fontSize: 12, color: 'var(--t-subtle)', marginBottom: 10, letterSpacing: '-0.01em' }}>
            Comparte este link con{' '}
            <span style={{ fontWeight: 600, color: 'var(--fg)' }}>{empresa}</span>
            {' '}— solo quien tenga el link puede acceder.
          </p>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px',
            background: 'rgba(12,12,9,0.03)', border: '1px solid var(--br)',
            borderRadius: 8,
          }}>
            <span style={{
              flex: 1, fontSize: 12, color: 'var(--t-muted)',
              fontFamily: 'var(--font-geist-mono), monospace',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {clientUrl}
            </span>
            <button
              onClick={copyUrl}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 6, fontSize: 11, flexShrink: 0,
                background: copied ? 'rgba(21,128,61,0.08)' : 'rgba(12,12,9,0.06)',
                border: `1px solid ${copied ? 'rgba(21,128,61,0.25)' : 'var(--br)'}`,
                cursor: 'pointer',
                color: copied ? '#15803d' : 'var(--t-subtle)',
                fontFamily: 'var(--font-geist), system-ui',
                transition: 'all 150ms ease',
              }}
            >
              <Copy size={10} strokeWidth={2} />
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 12, color: 'var(--t-ghost)', fontStyle: 'italic' }}>
          Sin link activo. Genera uno para dar acceso al dashboard del cliente.
        </p>
      )}
    </section>
  )
}
