export type ProspectoSource = 'hubspot' | 'clay' | 'manual'
export type OutreachStatus = 'pendiente' | 'enviado' | 'respondio' | 'convertido' | 'descartado'

export type HubspotContext = {
  evento_asistido?: string
  program_end_date?: string
  luma_event?: string
  luma_event_date?: string
  luma_attended?: string
  fecha_clase_gratis?: string
  first_conversion?: string
  lifecycle_stage?: string
}

export type ClayContext = {
  buying_signals?: string[]
  funding_stage?: string
  recent_hires?: string[]
  tech_stack?: string[]
}

export type Prospecto = {
  id: string
  created_at: string
  updated_at: string
  source: ProspectoSource
  source_ref: string | null
  empresa: string
  empresa_website: string | null
  industria: string | null
  empresa_size: string | null
  pais: string | null
  ciudad: string | null
  contacto_nombre: string | null
  contacto_cargo: string | null
  contacto_email: string | null
  contacto_whatsapp: string | null
  contacto_linkedin: string | null
  context: HubspotContext | ClayContext | Record<string, unknown>
  outreach_status: OutreachStatus
  last_outreach_at: string | null
  lead_id: string | null
  clay_search_id: string | null
  notas_internas: string | null
}

export type OutreachLog = {
  id: string
  created_at: string
  lead_id: string | null
  prospecto_id: string | null
  programa_ofrecido: string | null
  mensaje: string
  action: 'generated' | 'copied' | 'opened_wa' | 'sent_api'
  channel: 'whatsapp' | 'email'
  sent_by: string
  context_snapshot: Record<string, unknown>
}

// Vista unificada para la UI de outreach
export type OutreachTarget = {
  id: string                          // `lead:${slug}` | `prospecto:${uuid}`
  kind: 'lead' | 'prospecto'
  empresa: string
  contacto_nombre: string | null
  contacto_cargo: string | null
  contacto_whatsapp: string | null
  contacto_email: string | null
  industria: string | null
  pais: string | null
  source: 'pipeline' | 'hubspot' | 'clay' | 'manual'
  outreach_status: string
  last_outreach_at: string | null
  context_badge: string               // ej: "Diagnóstico completo · 45 personas" / "AI Summit 2025"
  total_contacts?: number             // cuántas personas de esa empresa están en BD
  programas_comprados?: string[]      // lista de programas ya adquiridos por la empresa
  lifecycle_stage?: string            // company-level best stage: customer | opportunity | lead | luma | clase_gratis
  has_luma?: boolean                  // algún contacto de la empresa tiene evento Luma
  has_clase_gratis?: boolean          // algún contacto registró clase gratis
  luma_event_name?: string            // nombre del evento Luma más reciente
  slug: string | null                 // solo si kind='lead'
  raw_lead_id?: string
  raw_prospecto_id?: string
}

export type ClaySearchCriteria = {
  industrias: string[]
  tamanos: string[]
  paises: string[]
  senales_compra: string[]
  cargos_decisor: string[]
  max_empresas: number
  contactos_por_empresa: number
  notas: string
}

export type ClaySearch = {
  id: string
  created_at: string
  created_by: string
  criteria: ClaySearchCriteria
  status: 'pendiente' | 'corriendo' | 'completado' | 'fallido' | 'cancelado'
  clay_run_ref: string | null
  empresas_encontradas: number
  contactos_encontrados: number
  credits_estimados: number | null
  credits_gastados: number | null
  error_message: string | null
  finished_at: string | null
}

export const OUTREACH_STATUS_LABELS: Record<OutreachStatus, { label: string; color: string }> = {
  pendiente:   { label: 'Pendiente',   color: '#8c8a83' },
  enviado:     { label: 'Enviado',     color: '#1d4ed8' },
  respondio:   { label: 'Respondió',   color: '#15803d' },
  convertido:  { label: 'Convertido',  color: '#0c0c09' },
  descartado:  { label: 'Descartado',  color: '#b3b0a8' },
}

export const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  pipeline: { label: 'Pipeline',  color: '#0c0c09' },
  hubspot:  { label: 'HubSpot',   color: '#ff5c35' },
  clay:     { label: 'Clay',      color: '#6d28d9' },
  manual:   { label: 'Manual',    color: '#8c8a83' },
}

export const LIFECYCLE_LABELS: Record<string, { label: string; color: string; priority: number }> = {
  customer:               { label: 'Cliente',      color: '#15803d', priority: 6 },
  opportunity:            { label: 'Oportunidad',  color: '#1d4ed8', priority: 5 },
  salesqualifiedlead:     { label: 'SQL',          color: '#7c3aed', priority: 4 },
  marketingqualifiedlead: { label: 'MQL',          color: '#b45309', priority: 3 },
  luma:                   { label: 'Luma',         color: '#0891b2', priority: 2 },
  clase_gratis:           { label: 'Clase gratis', color: '#0d9488', priority: 1 },
  lead:                   { label: 'Lead',         color: '#8c8a83', priority: 0 },
  subscriber:             { label: 'Registro',     color: '#8c8a83', priority: 0 },
}
