'use client'

import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LayoutGrid, CalendarDays, Plus, LogOut, Send, ClipboardList } from 'lucide-react'

const NAV = [
  { href: '/pipeline',                  icon: LayoutGrid,    label: 'Pipeline' },
  { href: '/pipeline/calendario',       icon: CalendarDays,  label: 'Calendario' },
  { href: '/pipeline/outreach',         icon: Send,          label: 'Outreach' },
  { href: '/pipeline/diagnosticos',     icon: ClipboardList, label: 'Diagnósticos' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) =>
    href === '/pipeline' ? pathname === '/pipeline' : pathname.startsWith(href)

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      height: '100dvh', position: 'sticky', top: 0,
      background: 'var(--bg)',
      borderRight: '1px solid var(--br)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>

      {/* Logo */}
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--br)' }}>
        <img
          src="https://framerusercontent.com/images/plKdkblus7WHMAC87JhoWVbrM84.webp"
          alt="30X"
          style={{ width: 72, height: 'auto', display: 'block', filter: 'brightness(0)' }}
        />
        <span style={{ fontSize: 10, color: 'var(--t-ghost)', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', marginTop: 6 }}>
          Pipeline B2B
        </span>
      </div>

      {/* New lead button */}
      <div style={{ padding: '14px 14px 10px' }}>
        <a href="/pipeline/nuevo" className="btn-primary" style={{ width: '100%', justifyContent: 'center', gap: 6 }}>
          <Plus size={13} strokeWidth={2.5} /> Nuevo lead
        </a>
      </div>

      {/* Nav links */}
      <nav style={{ padding: '4px 8px', flex: 1 }}>
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = isActive(href)
          return (
            <a
              key={href}
              href={href}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 7,
                fontSize: 13, fontWeight: active ? 600 : 400,
                letterSpacing: '-0.01em', textDecoration: 'none',
                color: active ? 'var(--fg)' : 'var(--t-subtle)',
                background: active ? 'rgba(12,12,9,0.07)' : 'transparent',
                position: 'relative',
                transition: 'background 140ms ease, color 140ms ease',
                marginBottom: 2,
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(12,12,9,0.04)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  style={{
                    position: 'absolute', left: 0, top: '20%', bottom: '20%',
                    width: 3, borderRadius: '0 2px 2px 0',
                    background: 'var(--fg)',
                  }}
                  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                />
              )}
              <Icon size={15} strokeWidth={active ? 2 : 1.75} />
              {label}
            </a>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px 12px 14px', borderTop: '1px solid var(--br)' }}>
        <p style={{ fontSize: 10, color: 'var(--t-ghost)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          30X Team
        </p>
        <button
          onClick={logout}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '7px 10px', borderRadius: 6,
            fontSize: 12, color: 'var(--t-faint)',
            background: 'transparent', border: 'none', cursor: 'pointer',
            letterSpacing: '-0.01em',
            transition: 'background 120ms ease, color 120ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(12,12,9,0.05)'; e.currentTarget.style.color = 'var(--fg)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--t-faint)' }}
        >
          <LogOut size={13} strokeWidth={1.75} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
