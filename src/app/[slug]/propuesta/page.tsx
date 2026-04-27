import { getLeadBySlug, getLeadSubmissions } from '@/lib/b2b-supabase'
import { notFound } from 'next/navigation'
import { AREAS, HERRAMIENTAS_IA } from '@/lib/areas'
import B2BProposalView from '@/components/b2b/B2BProposalView'

export const dynamic = 'force-dynamic'

const AREA_PROGRAM_MAP: Record<string, string[]> = {
  ventas:              ['ai-sales', 'sales-machine'],
  logistica:           ['ai-sales', 'operaciones'],
  mercadeo:            ['growth-rockstar', 'ai-sales'],
  visual:              ['ai-sales', 'growth-rockstar'],
  tecnologia:          ['hardcore-ai', 'ai-for-executives'],
  seguridad:           ['ai-for-executives', 'operaciones'],
  financiero:          ['ai-for-executives', 'operaciones'],
  'gestion-humana':    ['ai-for-executives', 'operaciones'],
  compras:             ['ai-for-executives', 'operaciones'],
  proyectos:           ['ai-sales', 'hardcore-ai'],
  sac:                 ['ai-sales', 'operaciones'],
  presidencia:         ['ai-for-executives'],
  operaciones:         ['operaciones', 'ai-for-executives'],
  comercial:           ['ai-for-executives', 'growth-rockstar'],
}

const PROGRAMS: Record<string, { name: string; tagline: string; duration: string; price: string; url: string; color: string }> = {
  'ai-sales':          { name: 'AI Sales',         tagline: 'Ventas B2B con IA',             duration: '4 semanas', price: '$1,950 USD', url: 'https://30x.com/programas/ai-sales',          color: '#E9FF7B' },
  'sales-machine':     { name: 'Sales Machine',     tagline: 'Playbook completo de ventas B2B', duration: '8 semanas', price: '$1,990 USD', url: 'https://30x.com/programas/sales-machine',     color: '#E9FF7B' },
  'growth-rockstar':   { name: 'Growth Rockstar',   tagline: 'Motor de adquisición y retención', duration: '8 semanas', price: '$1,295 USD', url: 'https://30x.com/programas/growth-rockstar',   color: '#0099FF' },
  'ai-for-executives': { name: 'AI for Executives', tagline: 'Gobierna la IA como ejecutivo',  duration: '8 semanas', price: '$3,000 USD', url: 'https://30x.com/programas/ai-for-executives', color: '#C084FC' },
  'hardcore-ai':       { name: 'Hardcore AI',       tagline: 'Construye agentes con código',   duration: '4 semanas', price: '$1,500 USD', url: 'https://30x.com/programas/hardcore-ai',       color: '#F97316' },
  'operaciones':       { name: 'Operaciones',       tagline: 'El sistema operativo con IA',    duration: 'A la medida', price: 'A la medida', url: 'https://30x.com/programas/operaciones',   color: '#34D399' },
  'achievers':         { name: 'Achievers',         tagline: 'De mindset a MVP desplegado',    duration: '8 semanas', price: '$1,500 USD', url: 'https://30x.com/programas/achievers',        color: '#F59E0B' },
}

function maturityScore(subs: Awaited<ReturnType<typeof getLeadSubmissions>>) {
  if (!subs.length) return 0
  let score = 0
  for (const sub of subs) {
    const tools = sub.herramientas ?? []
    if (!tools.includes('ninguna') && tools.length > 0) score += 30
    if (tools.length > 2) score += 10
    if ((sub.chat_transcript ?? []).length > 6) score += 20
    if (sub.insight_aprobado) score += 20
    if ((sub.retos_chips ?? []).length > 2) score += 10
  }
  return Math.min(100, Math.round(score / subs.length))
}

function extractQuotes(subs: Awaited<ReturnType<typeof getLeadSubmissions>>) {
  const quotes: string[] = []
  for (const sub of subs) {
    for (const msg of sub.chat_transcript ?? []) {
      if (msg.role === 'user') {
        const clean = msg.content.replace('[CONVERSACION_COMPLETA]', '').trim()
        if (clean.length > 60 && clean.length < 400) quotes.push(clean)
      }
    }
  }
  return quotes.slice(0, 3)
}

export default async function PropuestaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lead = await getLeadBySlug(slug)
  if (!lead) notFound()

  const submissions = await getLeadSubmissions(lead.id)
  const herramientaData = HERRAMIENTAS_IA as unknown as { id: string; nombre: string; emoji: string; color: string }[]

  const byArea: Record<string, typeof submissions> = {}
  for (const sub of submissions) {
    for (const areaId of sub.areas) {
      if (!byArea[areaId]) byArea[areaId] = []
      if (!byArea[areaId].find(s => s.id === sub.id)) byArea[areaId].push(sub)
    }
  }

  // Include areas with submissions + areas preselected by the lead (even without submissions)
  const areaIdsToShow = new Set([
    ...Object.keys(byArea),
    ...lead.diagnostico_config.areas_preseleccionadas,
  ])

  const areaSections = AREAS
    .filter(a => areaIdsToShow.has(a.id))
    .map(area => {
      const subs = byArea[area.id] ?? []
      return {
        area,
        submissions: subs,
        totalHeadcount: subs.reduce((acc, s) => acc + (s.headcount ?? 0), 0),
        herramientas: subs.flatMap(s => s.herramientas ?? []),
        retos: subs.flatMap(s => s.retos_chips ?? []),
        quotes: extractQuotes(subs),
        insights: subs.filter(s => s.insight_aprobado && s.insight).map(s => ({ nombre: s.nombre, cargo: s.cargo, text: s.insight! })),
        programs: (AREA_PROGRAM_MAP[area.id] ?? []).filter(id => PROGRAMS[id]).map(id => PROGRAMS[id]),
        maturityScore: maturityScore(subs),
      }
    })
    .sort((a, b) => b.maturityScore - a.maturityScore)

  const areasIntel = Object.fromEntries(
    AREAS.map(a => [a.id, (a as unknown as { intel?: string }).intel ?? ''])
  )

  return (
    <B2BProposalView
      lead={lead}
      submissions={submissions}
      areaSections={areaSections}
      herramientaData={herramientaData}
      areasIntel={areasIntel}
    />
  )
}
