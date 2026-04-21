import { createClient } from '@supabase/supabase-js'
import type { Submission } from '@/lib/supabase'
import { AREAS, HERRAMIENTAS_IA } from '@/lib/areas'
import ProposalView from './ProposalView'

async function getSubmissions(): Promise<Submission[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).filter(
    (s) => !['administracionsales@30x.com', 'juanjose@30x.com'].includes((s.email ?? '').toLowerCase())
  )
}

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
  proyectos:           ['ai-for-executives', 'hardcore-ai'],
  'servicio-al-cliente': ['ai-sales', 'operaciones'],
  presidencia:           ['ai-for-executives'],
}

const PROGRAMS: Record<string, { name: string; tagline: string; duration: string; price: string; url: string; color: string }> = {
  'ai-sales':          { name: 'AI Sales',           tagline: 'Ventas B2B con IA',              duration: '4 semanas', price: '$1,950 USD', url: 'https://30x.com/programas/ai-sales',          color: '#E9FF7B' },
  'sales-machine':     { name: 'Sales Machine',       tagline: 'Playbook completo de ventas B2B', duration: '8 semanas', price: '$1,990 USD', url: 'https://30x.com/programas/sales-machine',     color: '#E9FF7B' },
  'growth-rockstar':   { name: 'Growth Rockstar',     tagline: 'Construye tu motor de growth',   duration: '8 semanas', price: '$1,295 USD', url: 'https://30x.com/programas/growth-rockstar',   color: '#0099FF' },
  'ai-for-executives': { name: 'AI for Executives',   tagline: 'Gobierna la IA como ejecutivo',  duration: '8 semanas', price: '$3,000 USD', url: 'https://30x.com/programas/ai-for-executives', color: '#C084FC' },
  'hardcore-ai':       { name: 'Hardcore AI',         tagline: 'Construye agentes con código',   duration: '4 semanas', price: '$1,500 USD', url: 'https://30x.com/programas/hardcore-ai',       color: '#F97316' },
  'operaciones':       { name: 'Operaciones',         tagline: 'El sistema operativo con IA',    duration: 'A la medida', price: 'A la medida', url: 'https://30x.com/programas/operaciones',   color: '#34D399' },
}

function maturityScore(subs: Submission[]): number {
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

function extractQuotes(subs: Submission[]): string[] {
  const quotes: string[] = []
  for (const sub of subs) {
    for (const msg of sub.chat_transcript ?? []) {
      if (msg.role === 'user') {
        const clean = msg.content.replace('[CONVERSACION_COMPLETA]', '').trim()
        if (clean.length > 60 && clean.length < 400) {
          quotes.push(clean)
        }
      }
    }
  }
  return quotes.slice(0, 3)
}

export default async function PropuestaPage() {
  const submissions = await getSubmissions()

  // Aggregate globals
  const totalPersonas = submissions.reduce((s, sub) => s + (sub.headcount ?? 0), 0)
  const allAreaIds = [...new Set(submissions.flatMap(s => s.areas))]
  const totalAreas = allAreaIds.length
  const noToolCount = submissions.filter(s => s.herramientas?.includes('ninguna') || (s.herramientas ?? []).length === 0).length

  // Top retos
  const retosCount: Record<string, number> = {}
  for (const sub of submissions) {
    for (const r of sub.retos_chips ?? []) {
      retosCount[r] = (retosCount[r] ?? 0) + 1
    }
  }
  const topRetos = Object.entries(retosCount).sort((a, b) => b[1] - a[1]).slice(0, 10)

  // Top tools
  const toolsCount: Record<string, number> = {}
  for (const sub of submissions) {
    for (const h of sub.herramientas ?? []) {
      if (h !== 'ninguna') toolsCount[h] = (toolsCount[h] ?? 0) + 1
    }
  }
  const topTools = Object.entries(toolsCount).sort((a, b) => b[1] - a[1]).slice(0, 8)

  // Global recommended programs
  const recommendedIds = [...new Set(allAreaIds.flatMap(id => AREA_PROGRAM_MAP[id] ?? []))]
  const recommendedPrograms = recommendedIds.filter(id => PROGRAMS[id]).map(id => PROGRAMS[id])

  // Build area sections
  const byArea: Record<string, Submission[]> = {}
  for (const sub of submissions) {
    for (const areaId of sub.areas) {
      if (!byArea[areaId]) byArea[areaId] = []
      if (!byArea[areaId].find(s => s.id === sub.id)) byArea[areaId].push(sub)
    }
  }

  const areaSections = AREAS
    .filter(a => byArea[a.id] && byArea[a.id].length > 0)
    .map(area => {
      const subs = byArea[area.id]
      const herramientas = subs.flatMap(s => s.herramientas ?? [])
      const retos = subs.flatMap(s => s.retos_chips ?? [])
      const quotes = extractQuotes(subs)
      const insights = subs
        .filter(s => s.insight_aprobado && s.insight)
        .map(s => ({ nombre: s.nombre, cargo: s.cargo, text: s.insight! }))
      const programIds = AREA_PROGRAM_MAP[area.id] ?? []
      const programs = programIds.filter(id => PROGRAMS[id]).map(id => PROGRAMS[id])
      const totalHeadcount = subs.reduce((acc, s) => acc + (s.headcount ?? 0), 0)

      return {
        area,
        submissions: subs,
        totalHeadcount,
        herramientas,
        retos,
        quotes,
        insights,
        programs,
        maturityScore: maturityScore(subs),
      }
    })
    .sort((a, b) => b.maturityScore - a.maturityScore) // Áreas más maduras primero

  const herramientaData = HERRAMIENTAS_IA as unknown as { id: string; nombre: string; emoji: string; color: string }[]

  return (
    <ProposalView
      submissions={submissions}
      totalPersonas={totalPersonas}
      totalAreas={totalAreas}
      topRetos={topRetos}
      topTools={topTools}
      noToolCount={noToolCount}
      recommendedPrograms={recommendedPrograms}
      areaSections={areaSections}
      herramientaData={herramientaData}
    />
  )
}
