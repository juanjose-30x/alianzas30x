import { createClient } from '@supabase/supabase-js'
import type { Prospecto, OutreachTarget, OutreachLog } from './prospecting-types'
import type { Lead } from './b2b-types'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
}

// ── PROSPECTOS ────────────────────────────────────────────────

export async function getAllProspectos(): Promise<Prospecto[]> {
  const { data, error } = await db()
    .from('prospectos')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Prospecto[]
}

export async function getProspectoById(id: string): Promise<Prospecto | null> {
  const { data } = await db().from('prospectos').select('*').eq('id', id).single()
  return data as Prospecto | null
}

export async function upsertProspectos(rows: Omit<Prospecto, 'id' | 'created_at' | 'updated_at'>[]): Promise<{
  inserted: number; duplicates: number; errors: number; first_error?: string
}> {
  let inserted = 0; let duplicates = 0; let errors = 0; let firstError: string | undefined
  const chunks = chunk(rows, 50)
  for (const batch of chunks) {
    const { data, error } = await db()
      .from('prospectos')
      .upsert(batch, { onConflict: 'source,source_ref', ignoreDuplicates: false })
      .select('id')
    if (error) {
      if (!firstError) firstError = error.message
      errors += batch.length
      continue
    }
    inserted += (data ?? []).length
    duplicates += batch.length - (data ?? []).length
  }
  return { inserted, duplicates, errors, first_error: firstError }
}

export async function patchProspecto(id: string, patch: Partial<Prospecto>) {
  const { data, error } = await db().from('prospectos').update(patch).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data as Prospecto
}

// ── OUTREACH LOG ──────────────────────────────────────────────

export async function insertOutreachLog(row: Omit<OutreachLog, 'id' | 'created_at'>): Promise<OutreachLog> {
  const { data, error } = await db().from('outreach_log').insert(row).select().single()
  if (error) throw new Error(error.message)
  return data as OutreachLog
}

export async function getOutreachLogForTarget(opts: {
  lead_id?: string; prospecto_id?: string
}): Promise<OutreachLog[]> {
  let q = db().from('outreach_log').select('*').order('created_at', { ascending: false }).limit(20)
  if (opts.lead_id) q = q.eq('lead_id', opts.lead_id)
  if (opts.prospecto_id) q = q.eq('prospecto_id', opts.prospecto_id)
  const { data } = await q
  return (data ?? []) as OutreachLog[]
}

// ── UNIFIED OUTREACH TARGETS ──────────────────────────────────
// Combina leads del pipeline + prospectos en una vista unificada

async function fetchAllFromTable<T>(table: string, orderCol: string): Promise<T[]> {
  const PAGE = 1000
  const all: T[] = []
  let from = 0
  while (true) {
    const { data, error } = await db()
      .from(table)
      .select('*')
      .order(orderCol, { ascending: false })
      .range(from, from + PAGE - 1)
    if (error || !data || data.length === 0) break
    all.push(...(data as T[]))
    if (data.length < PAGE) break
    from += PAGE
  }
  return all
}

export async function getAllOutreachTargets(): Promise<OutreachTarget[]> {
  const [leads, prospectos] = await Promise.all([
    fetchAllFromTable<Lead>('leads', 'updated_at'),
    fetchAllFromTable<Prospecto>('prospectos', 'created_at'),
  ])

  const fromLeads: OutreachTarget[] = leads.map(l => {
    const empresa = l.diagnostico_config?.nombre_empresa_display || l.empresa
    const diag = l.discovery_data
    const headcount = diag?.headcount_estimado ?? 0
    const areas = diag?.areas_identificadas?.length ?? 0
    return {
      id: `lead:${l.slug}`,
      kind: 'lead',
      empresa,
      contacto_nombre: l.contacto_nombre,
      contacto_cargo: l.contacto_cargo,
      contacto_whatsapp: l.contacto_whatsapp,
      contacto_email: l.contacto_email,
      industria: l.industria,
      pais: l.pais,
      source: 'pipeline',
      outreach_status: 'pendiente',
      last_outreach_at: null,
      context_badge: areas > 0
        ? `${areas} áreas · ${headcount} personas`
        : 'Sin diagnóstico aún',
      slug: l.slug,
      raw_lead_id: l.id,
    }
  })

  const fromProspects = groupProspectosByEmpresa(prospectos)

  return [...fromLeads, ...fromProspects]
}

// ── UTILS ─────────────────────────────────────────────────────

const JUNK_EXACT = new Set([
  'no aplica', 'no', 'no tengo', 'no tengo empresa', 'independiente',
  'independientemente', 'emprendimiento', 'freelance', 'particular',
  'persona natural', 'n/a', 'na', '-', 'ninguna', 'ninguno',
  'ninguna empresa', 'no aplica.', 'no tiene', 'sin empresa',
  'propia', 'personal', 'emprendedor', 'emprendedora',
  'soy independiente', 'mi empresa', 'cuenta propia', 'trabajo independiente',
  'propio', 'desempleado', 'desempleada', 'inmobiliaria', 'consultor',
  'consultora', 'independiente.', 'empresa propia', 'ninguno',
  'estudiante', 'universidad', 'pensionado', 'pensionada', 'jubilado',
  'ama de casa', 'hogar', 'casa', 'ventas', 'seguros', 'construccion',
  'construcción', 'constructora', 'agencia de marketing', 'agencia',
  'negocio propio', 'negocio', 'comercio', 'comercial', 'empresa',
  'mi negocio', 'freelancer', 'tecnología', 'tecnologia', 'banco',
  'retail', 'salud', 'educacion', 'educación', 'finanzas', 'logistica',
  'logística', 'consultoria', 'consultoría', 'marketing', 'juridico',
  'jurídico', 'na.', 'contabilidad', 'varias', 'varios',
  'sector público', 'sector publico', 'empleado', 'empleada',
  'agencia de seguros', 'aún no tengo', 'aun no tengo',
])

const JUNK_STARTS = [
  'soy ', 'trabajo ', 'actualmente ', 'busco ', 'sin ', 'no ', 'aún ', 'aun ',
]

function isJunkEmpresa(raw: string): boolean {
  const norm = raw.toLowerCase().trim()
  if (norm.length < 3) return true
  if (JUNK_EXACT.has(norm)) return true
  if (JUNK_STARTS.some(k => norm.startsWith(k))) return true
  return false
}

const SENIOR_KEYWORDS = ['ceo', 'director', 'gerente', 'presidente', 'founder',
  'co-founder', 'cofundador', 'vp ', 'chief', 'socio', 'owner', 'propietario', 'head of']

function seniorityScore(cargo: string | null): number {
  if (!cargo) return 0
  const c = cargo.toLowerCase()
  return SENIOR_KEYWORDS.some(k => c.includes(k)) ? 2 : 1
}

function extractPrograms(p: Prospecto): string[] {
  const ctx = p.context as Record<string, unknown>
  const raw = (ctx.evento_asistido as string) ?? ''
  return raw.split(';').map(s => s.replace(/^Programa:\s*/i, '').trim()).filter(Boolean)
}

function formatCohortDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })
  } catch { return '' }
}

const STAGE_PRIORITY: Record<string, number> = {
  customer: 6, opportunity: 5, salesqualifiedlead: 4,
  marketingqualifiedlead: 3, luma: 2, clase_gratis: 1,
  lead: 0, subscriber: 0, other: 0,
}

function companyLifecycleStage(contacts: Prospecto[]): string {
  let best = 'lead'
  let bestP = -1
  for (const c of contacts) {
    const ctx = c.context as Record<string, unknown>
    // Check Luma
    if (ctx.luma_event && (STAGE_PRIORITY['luma'] > bestP)) {
      best = 'luma'; bestP = STAGE_PRIORITY['luma']
    }
    // Check clase gratis
    if (ctx.fecha_clase_gratis && (STAGE_PRIORITY['clase_gratis'] > bestP)) {
      best = 'clase_gratis'; bestP = STAGE_PRIORITY['clase_gratis']
    }
    // Check HubSpot lifecycle stage
    const stage = (ctx.lifecycle_stage as string) ?? 'lead'
    const p = STAGE_PRIORITY[stage] ?? 0
    if (p > bestP) { best = stage; bestP = p }
  }
  return best
}

function groupProspectosByEmpresa(prospectos: Prospecto[]): OutreachTarget[] {
  const map = new Map<string, Prospecto[]>()
  for (const p of prospectos) {
    const key = p.empresa.toLowerCase().trim()
    if (isJunkEmpresa(key)) continue
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }

  const targets: OutreachTarget[] = []
  for (const contacts of map.values()) {
    const best = [...contacts].sort((a, b) => {
      const scoreA = seniorityScore(a.contacto_cargo) + (a.contacto_whatsapp ? 1 : 0) + (a.contacto_email ? 1 : 0)
      const scoreB = seniorityScore(b.contacto_cargo) + (b.contacto_whatsapp ? 1 : 0) + (b.contacto_email ? 1 : 0)
      return scoreB - scoreA
    })[0]

    const allPrograms = [...new Set(contacts.flatMap(extractPrograms))]

    // Gather all programs WITH cohort dates
    const programsWithDates: string[] = []
    for (const c of contacts) {
      const ctx = c.context as Record<string, unknown>
      const evt = (ctx.evento_asistido as string) ?? ''
      const endDate = ctx.program_end_date as string | undefined
      if (evt) {
        const cleaned = evt.replace(/^Programa:\s*/i, '').split(';').map(s => s.trim()).filter(Boolean)
        for (const prog of cleaned) {
          const dateStr = endDate ? ` (${formatCohortDate(endDate)})` : ''
          programsWithDates.push(`${prog}${dateStr}`)
        }
      }
    }
    const uniquePrograms = [...new Set(programsWithDates)]

    const stage = companyLifecycleStage(contacts)

    // Luma / clase gratis flags (independent of priority stage)
    const lumaContact = contacts.find(c => (c.context as Record<string, unknown>).luma_event)
    const hasLuma = !!lumaContact
    const lumaEventName = hasLuma ? (lumaContact!.context as Record<string, unknown>).luma_event as string : undefined
    const hasClaseGratis = contacts.some(c => (c.context as Record<string, unknown>).fecha_clase_gratis)

    // Build badge
    let badge = ''
    if (uniquePrograms.length > 0) {
      badge = uniquePrograms.slice(0, 2).join(' · ')
    } else if (hasLuma && lumaEventName) {
      badge = `Luma: ${lumaEventName}`
    } else if (hasClaseGratis) {
      badge = 'Clase gratis registrada'
    } else {
      badge = allPrograms.slice(0, 2).join(' · ') || (best.source === 'clay' ? 'Prospecto Clay' : 'HubSpot')
    }

    const source = best.source === 'hubspot' ? 'hubspot' : best.source === 'clay' ? 'clay' : 'manual'

    targets.push({
      id: `prospecto:${best.id}`,
      kind: 'prospecto',
      empresa: best.empresa,
      contacto_nombre: best.contacto_nombre,
      contacto_cargo: best.contacto_cargo,
      contacto_whatsapp: best.contacto_whatsapp,
      contacto_email: best.contacto_email,
      industria: best.industria,
      pais: best.pais,
      source,
      outreach_status: best.outreach_status,
      last_outreach_at: best.last_outreach_at,
      context_badge: badge,
      total_contacts: contacts.length,
      programas_comprados: allPrograms,
      lifecycle_stage: stage,
      has_luma: hasLuma,
      luma_event_name: lumaEventName,
      has_clase_gratis: hasClaseGratis,
      slug: null,
      raw_prospecto_id: best.id,
    })
  }
  return targets
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}
