'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, ExternalLink, ChevronRight, Search, Building2, Users, DollarSign } from 'lucide-react'
import type { Lead } from '@/lib/b2b-types'
import { LEAD_STATUS_LABELS } from '@/lib/b2b-types'

type LeadWithCount = Lead & { submissions_count: number }

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? (typeof window !== 'undefined' ? window.location.origin : '')

export default function PipelineClient({ leads }: { leads: LeadWithCount[] }) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filtered = leads.filter(l => {
    const matchSearch = l.empresa.toLowerCase().includes(search.toLowerCase()) ||
      l.slug.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || l.status === filterStatus
    return matchSearch && matchStatus
  })

  const totalDeal = leads
    .filter(l => !['cerrado_perdido'].includes(l.status))
    .reduce((a, l) => a + (l.deal_value_usd ?? 0), 0)

  const activeLeads = leads.filter(l => !['cerrado_ganado', 'cerrado_perdido'].includes(l.status)).length

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', fontFamily: 'Figtree, sans-serif' }}>

      {/* NAV */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
        style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <span className="text-white font-bold" style={{ fontFamily: 'Inter Tight, sans-serif' }}>
            30X <span style={{ color: '#E9FF7B' }}>·</span> Pipeline B2B
          </span>
        </div>
        <a href="/pipeline/nuevo"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all"
          style={{ background: '#E9FF7B', color: '#0a0a0a', fontFamily: 'Inter Tight' }}>
          <Plus size={14} /> Nuevo lead
        </a>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Building2, value: String(activeLeads), label: 'Leads activos', color: '#E9FF7B' },
            { icon: Users, value: String(leads.filter(l => l.status === 'diagnostico_completo').length), label: 'Listos para propuesta', color: '#C084FC' },
            { icon: DollarSign, value: `$${(totalDeal / 1000).toFixed(0)}k`, label: 'Pipeline USD', color: '#34D399' },
          ].map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Icon size={16} style={{ color }} className="mb-2 opacity-60" />
              <div className="text-2xl font-bold" style={{ fontFamily: 'Inter Tight, sans-serif', color }}>{value}</div>
              <div className="text-white/40 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[200px]"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Search size={14} className="text-white/30" />
            <input
              className="bg-transparent text-white text-sm outline-none flex-1 placeholder:text-white/25"
              placeholder="Buscar empresa..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', ...Object.keys(LEAD_STATUS_LABELS)].map(s => {
              const info = s === 'all' ? { label: 'Todos', color: '#ffffff' } : LEAD_STATUS_LABELS[s as keyof typeof LEAD_STATUS_LABELS]
              return (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={filterStatus === s
                    ? { background: info.color, color: '#0a0a0a' }
                    : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {info.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* LEADS TABLE */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            {leads.length === 0 ? (
              <div className="space-y-3">
                <div className="text-4xl">🎯</div>
                <p className="text-white font-semibold" style={{ fontFamily: 'Inter Tight' }}>Sin leads aún</p>
                <p className="text-sm">Crea tu primer lead para empezar el pipeline.</p>
                <a href="/pipeline/nuevo" className="inline-flex items-center gap-2 mt-2 px-5 py-2 rounded-full text-sm font-bold"
                  style={{ background: '#E9FF7B', color: '#0a0a0a' }}>
                  <Plus size={13} /> Crear primer lead
                </a>
              </div>
            ) : (
              <p>Sin resultados para "{search}"</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((lead, i) => {
              const status = LEAD_STATUS_LABELS[lead.status]
              return (
                <motion.div key={lead.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-2xl px-5 py-4 flex items-center gap-4 group"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>

                  {/* Empresa */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold text-sm truncate" style={{ fontFamily: 'Inter Tight' }}>{lead.empresa}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                        style={{ background: `${status.color}18`, color: status.color, border: `1px solid ${status.color}33` }}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-white/30 text-xs">{lead.slug}</span>
                      {lead.industria && <span className="text-white/25 text-xs">· {lead.industria}</span>}
                      {lead.contacto_nombre && <span className="text-white/25 text-xs">· {lead.contacto_nombre}</span>}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-6 shrink-0">
                    <div className="text-center">
                      <div className="text-white font-bold text-sm" style={{ fontFamily: 'Inter Tight' }}>{lead.submissions_count}</div>
                      <div className="text-white/30 text-xs">diagnósticos</div>
                    </div>
                    {lead.deal_value_usd ? (
                      <div className="text-center">
                        <div className="font-bold text-sm" style={{ color: '#34D399', fontFamily: 'Inter Tight' }}>${lead.deal_value_usd.toLocaleString()}</div>
                        <div className="text-white/30 text-xs">USD</div>
                      </div>
                    ) : null}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={`/${lead.slug}/diagnostico`} target="_blank"
                      className="text-xs px-3 py-1.5 rounded-full transition-all"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                      <ExternalLink size={11} className="inline mr-1" />Form
                    </a>
                    <a href={`/${lead.slug}/propuesta`} target="_blank"
                      className="text-xs px-3 py-1.5 rounded-full transition-all"
                      style={{ background: 'rgba(233,255,123,0.1)', color: '#E9FF7B' }}>
                      Propuesta
                    </a>
                    <a href={`/pipeline/${lead.slug}`}
                      className="text-white/30 hover:text-white/70 transition-colors">
                      <ChevronRight size={16} />
                    </a>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
