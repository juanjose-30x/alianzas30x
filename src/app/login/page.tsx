'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/pipeline'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error al iniciar sesión')
        return
      }
      router.push(next)
      router.refresh()
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    fontSize: 13, color: 'var(--fg)', outline: 'none',
    background: 'rgba(12,12,9,0.03)',
    border: '1px solid var(--br-mid)',
    letterSpacing: '-0.01em',
    fontFamily: 'var(--font-geist), system-ui',
    transition: 'border-color 150ms ease',
  }

  return (
    <div style={{
      background: 'var(--bg)', minHeight: '100dvh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{ textAlign: 'center', marginBottom: '2.5rem' }}
      >
        <img
          src="https://framerusercontent.com/images/plKdkblus7WHMAC87JhoWVbrM84.webp"
          alt="30X"
          style={{ width: 80, height: 'auto', display: 'block', margin: '0 auto', filter: 'brightness(0)' }}
        />
        <p style={{ fontSize: 11, color: 'var(--t-ghost)', marginTop: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Pipeline B2B
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%', maxWidth: 360,
          background: 'var(--bg-card)',
          border: '1px solid var(--br-mid)',
          borderRadius: 14, padding: '2rem',
          boxShadow: 'var(--sh-md)',
        }}
      >
        <h1 style={{
          fontSize: '1.35rem', fontWeight: 800,
          letterSpacing: '-0.04em', color: 'var(--fg)',
          marginBottom: 4,
        }}>
          Iniciar sesión
        </h1>
        <p style={{ fontSize: 13, color: 'var(--t-subtle)', marginBottom: '1.75rem', letterSpacing: '-0.01em' }}>
          Acceso interno — 30X Alianzas.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--t-faint)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              style={inputStyle}
              placeholder="tu@30x.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div>
            <label style={{ fontSize: 11, color: 'var(--t-faint)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                style={{ ...inputStyle, paddingRight: 40 }}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--t-ghost)', padding: 2, display: 'flex',
                }}
              >
                {showPwd ? <EyeOff size={14} strokeWidth={2} /> : <Eye size={14} strokeWidth={2} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 12px', borderRadius: 8,
                background: 'var(--c-danger-surface)',
                border: '1px solid var(--c-danger-border)',
              }}
            >
              <AlertCircle size={13} color="var(--c-danger)" />
              <span style={{ fontSize: 12, color: 'var(--c-danger)' }}>{error}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="btn-primary"
            style={{
              width: '100%', justifyContent: 'center', marginTop: 4,
              opacity: (loading || !email || !password) ? 0.4 : 1,
              cursor: (loading || !email || !password) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading
              ? <><Loader2 size={13} className="animate-spin" /> Entrando…</>
              : <>Entrar <ArrowRight size={13} strokeWidth={2.5} /></>
            }
          </button>
        </form>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
