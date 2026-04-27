'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, CheckCircle, AlertCircle, ArrowLeft, ChevronRight, Users, Zap } from 'lucide-react'
import Link from 'next/link'

type SyncResult = {
  contacts_fetched: number
  contacts_with_company: number
  inserted: number
  duplicates: number
  errors: number
  elapsed_seconds?: number
  first_error?: string
}

export default function HubspotSyncPage() {
  const [portalId, setPortalId] = useState<number | null>(null)
  const [connecting, setConnecting] = useState(true)
  const [connError, setConnError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState('')
  const [result, setResult] = useState<SyncResult | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/b2b/outreach/hubspot/properties')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setConnError(data.error); return }
        setPortalId(data.portalId)
      })
      .catch(e => setConnError(String(e)))
      .finally(() => setConnecting(false))
  }, [])

  const runSync = async () => {
    setSyncing(true)
    setSyncError(null)
    setResult(null)
    setSyncProgress('Descargando contactos de HubSpot...')
    try {
      const res = await fetch('/api/b2b/outreach/hubspot/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'all' }),
      })
      setSyncProgress('Guardando en base de datos...')
      const data = await res.json()
      if (!res.ok) { setSyncError(data.error ?? 'Error desconocido'); return }
      setResult(data)
    } catch (e) {
      setSyncError(String(e))
    } finally {
      setSyncing(false)
      setSyncProgress('')
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
        <Link href="/pipeline/outreach" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--t-subtle)', fontSize: 13, textDecoration: 'none' }}>
          <ArrowLeft size={13} strokeWidth={2} />
          Outreach
        </Link>
        <ChevronRight size={12} color="var(--t-ghost)" />
        <span style={{ fontSize: 13, color: 'var(--fg)' }}>Sincronizar HubSpot</span>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 6 }}>
        Sincronizar CRM completo
      </h1>
      <p style={{ fontSize: 13, color: 'var(--t-subtle)', marginBottom: 32, lineHeight: 1.6 }}>
        Importa todos los contactos de HubSpot. Tarda 2–4 minutos para un CRM grande.
        Los existentes se actualizan; se deduplicarán por empresa en la vista de outreach.
      </p>

      {/* Connection status */}
      <div style={{
        padding: '14px 18px',
        borderRadius: 10,
        border: '1px solid var(--br)',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        {connecting ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: 14, height: 14, border: '2px solid var(--br)', borderTopColor: 'var(--fg)', borderRadius: '50%' }}
            />
            <span style={{ fontSize: 13, color: 'var(--t-subtle)' }}>Conectando con HubSpot...</span>
          </>
        ) : connError ? (
          <>
            <AlertCircle size={15} color="#dc2626" />
            <div>
              <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 500 }}>Error de conexión</p>
              <p style={{ fontSize: 12, color: 'var(--t-ghost)', marginTop: 2 }}>{connError}</p>
              {connError.includes('HUBSPOT_PRIVATE_APP_TOKEN') && (
                <p style={{ fontSize: 12, color: 'var(--t-ghost)', marginTop: 4 }}>
                  Agrega <code style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.06)', padding: '1px 4px', borderRadius: 3 }}>HUBSPOT_PRIVATE_APP_TOKEN</code> a tus variables de entorno.
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <CheckCircle size={15} color="#15803d" />
            <div>
              <p style={{ fontSize: 13, color: '#15803d', fontWeight: 500 }}>Conectado a HubSpot</p>
              {portalId && <p style={{ fontSize: 12, color: 'var(--t-ghost)', marginTop: 1 }}>Portal ID: {portalId}</p>}
            </div>
          </>
        )}
      </div>

      {/* What gets imported */}
      {!connecting && !connError && (
        <div style={{
          padding: '14px 18px',
          borderRadius: 10,
          border: '1px solid var(--br)',
          background: 'rgba(12,12,9,0.02)',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Users size={14} color="var(--t-subtle)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>Qué se importa</span>
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 12, color: 'var(--t-subtle)', lineHeight: 1.8 }}>
            <li>Todos los contactos del CRM — sin filtros</li>
            <li>Empresa, cargo, email, teléfono, país, ciudad</li>
            <li>Programa comprado si tiene <code style={{ fontFamily: 'monospace', fontSize: 11, background: 'rgba(0,0,0,0.06)', padding: '0 3px', borderRadius: 2 }}>programas_30x</code></li>
            <li>Vista de outreach agrupada por empresa — mejor contacto seleccionado automáticamente</li>
          </ul>
        </div>
      )}

      {/* Sync button */}
      {!connecting && !connError && (
        <button
          onClick={runSync}
          disabled={syncing}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 8, marginBottom: 20,
            background: syncing ? 'rgba(12,12,9,0.15)' : 'var(--fg)',
            color: syncing ? 'var(--t-ghost)' : 'var(--bg)',
            fontSize: 13, fontWeight: 500, border: 'none',
            cursor: syncing ? 'default' : 'pointer',
            transition: 'all 150ms ease',
          }}
        >
          {syncing ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'var(--bg)', borderRadius: '50%' }}
              />
              {syncProgress || 'Sincronizando...'}
            </>
          ) : (
            <>
              <Zap size={14} />
              Sincronizar CRM completo
            </>
          )}
        </button>
      )}

      {/* Errors */}
      <AnimatePresence>
        {syncError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '12px 14px', borderRadius: 8, marginBottom: 16,
              background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)',
              fontSize: 13, color: '#dc2626',
            }}
          >
            <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              {syncError}
              {syncError.toLowerCase().includes('prospectos') && (
                <p style={{ fontSize: 12, marginTop: 6, color: '#b91c1c' }}>
                  La tabla <code style={{ fontFamily: 'monospace' }}>prospectos</code> no existe. Ejecuta el SQL en Supabase primero.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              border: '1px solid var(--br)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--br)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={16} color="#15803d" />
              <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.02em' }}>Sincronización completa</span>
              {result.elapsed_seconds && (
                <span style={{ fontSize: 12, color: 'var(--t-ghost)', marginLeft: 'auto' }}>
                  {result.elapsed_seconds}s
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {[
                { label: 'Clientes en HubSpot', value: result.contacts_fetched, sub: 'lifecyclestage=customer' },
                { label: 'Con empresa', value: result.contacts_with_company, sub: 'procesados' },
                { label: 'Nuevos', value: result.inserted, sub: 'insertados', color: '#15803d' },
                {
                  label: result.errors > 0 ? 'Errores DB' : 'Actualizados',
                  value: result.errors > 0 ? result.errors : result.duplicates,
                  sub: result.errors > 0 ? (result.first_error?.slice(0, 30) ?? 'error') : 'upsert',
                  color: result.errors > 0 ? '#dc2626' : '#92400e',
                },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: '18px 16px',
                  borderRight: i < 3 ? '1px solid var(--br)' : 'none',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.04em', color: s.color ?? 'var(--fg)' }}>{s.value}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg)', marginTop: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--t-ghost)' }}>{s.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--br)' }}>
              <Link
                href="/pipeline/outreach"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 7,
                  background: 'var(--fg)', color: 'var(--bg)',
                  fontSize: 13, fontWeight: 500, textDecoration: 'none',
                }}
              >
                Ver outreach
              </Link>
              <button
                onClick={runSync}
                style={{
                  marginLeft: 10, display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 7,
                  border: '1px solid var(--br)', background: 'transparent',
                  fontSize: 13, color: 'var(--t-subtle)', cursor: 'pointer',
                }}
              >
                <RefreshCw size={12} />
                Volver a sincronizar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
