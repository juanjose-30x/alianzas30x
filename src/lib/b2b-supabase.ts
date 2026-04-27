import { createClient } from '@supabase/supabase-js'
import type { Lead, LeadSubmission, LeadStatus, DiscoveryData, DiagnosticoConfig } from './b2b-types'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

// ── LEADS ────────────────────────────────────────────────────

export async function getAllLeads(): Promise<(Lead & { submissions_count: number })[]> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)

  const leads = (data ?? []) as Lead[]

  // Get counts in a separate query to avoid FK dependency
  const counts: Record<string, number> = {}
  if (leads.length > 0) {
    const { data: subs } = await supabase
      .from('lead_submissions')
      .select('lead_id')
      .in('lead_id', leads.map(l => l.id))
    for (const s of subs ?? []) {
      counts[s.lead_id] = (counts[s.lead_id] ?? 0) + 1
    }
  }

  return leads.map(l => ({ ...l, submissions_count: counts[l.id] ?? 0 }))
}

export async function getLeadBySlug(slug: string): Promise<Lead | null> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) return null
  return data as Lead
}

export async function createLead(payload: {
  slug: string
  empresa: string
  industria?: string
  pais?: string
  website?: string
  contacto_nombre?: string
  contacto_email?: string
  contacto_cargo?: string
  contacto_whatsapp?: string
  deal_value_usd?: number
  grain_transcript?: string
  discovery_data?: DiscoveryData
  diagnostico_config?: DiagnosticoConfig
}): Promise<Lead> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('leads')
    .insert({
      ...payload,
      diagnostico_config: {
        areas_preseleccionadas: payload.discovery_data?.areas_identificadas ?? [],
        mensaje_bienvenida: '',
        nombre_empresa_display: payload.empresa,
        deadline: null,
        ...payload.diagnostico_config,
      },
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Lead
}

export async function updateLead(slug: string, patch: Partial<Lead>): Promise<void> {
  const supabase = getServiceClient()
  const { error } = await supabase
    .from('leads')
    .update(patch)
    .eq('slug', slug)
  if (error) throw new Error(error.message)
}

export async function updateLeadStatus(slug: string, status: LeadStatus): Promise<void> {
  return updateLead(slug, { status })
}

// ── LEAD SUBMISSIONS ─────────────────────────────────────────

export async function getLeadSubmissions(leadId: string): Promise<LeadSubmission[]> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('lead_submissions')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as LeadSubmission[]
}

export async function createLeadSubmission(
  leadId: string,
  payload: Omit<LeadSubmission, 'id' | 'created_at' | 'lead_id'>
): Promise<LeadSubmission> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('lead_submissions')
    .insert({ lead_id: leadId, ...payload })
    .select()
    .single()
  if (error) throw new Error(error.message)

  // Auto-update lead status
  const submissions = await getLeadSubmissions(leadId)
  const lead = await supabase.from('leads').select('diagnostico_config').eq('id', leadId).single()
  const areasEsperadas = (lead.data?.diagnostico_config?.areas_preseleccionadas ?? []) as string[]
  const areasRecibidas = [...new Set(submissions.flatMap(s => s.areas))]
  const completo = areasEsperadas.length > 0 && areasEsperadas.every(a => areasRecibidas.includes(a))

  await supabase
    .from('leads')
    .update({ status: completo ? 'diagnostico_completo' : 'diagnostico_parcial' })
    .eq('id', leadId)

  return data as LeadSubmission
}

export async function updateLeadSubmissionInsight(
  submissionId: string,
  insight: string,
  aprobado: boolean
): Promise<void> {
  const supabase = getServiceClient()
  const { error } = await supabase
    .from('lead_submissions')
    .update({ insight, insight_aprobado: aprobado })
    .eq('id', submissionId)
  if (error) throw new Error(error.message)
}
