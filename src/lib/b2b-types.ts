import type { Rol, ChatMessage } from './supabase'

export type LeadStatus =
  | 'discovery'
  | 'diagnostico_enviado'
  | 'diagnostico_parcial'
  | 'diagnostico_completo'
  | 'propuesta_lista'
  | 'negociacion'
  | 'cerrado_ganado'
  | 'cerrado_perdido'

export type DecisionMaker = {
  nombre: string
  cargo: string
  rol: 'champion' | 'blocker' | 'sponsor' | 'influencer'
}

export type PainPoint = {
  area: string
  descripcion: string
}

export type RolMencionado = {
  nombre: string
  headcount_estimado: number
  area: string
}

export type DiscoveryData = {
  areas_identificadas: string[]
  roles_mencionados: RolMencionado[]
  headcount_estimado: number
  pain_points: PainPoint[]
  herramientas_actuales: string[]
  decision_makers: DecisionMaker[]
  senales_presupuesto: 'alto' | 'medio' | 'bajo' | 'desconocido'
  contexto_empresa: string
  notas_adicionales: string
  // Discovery enriquecido
  tema_engagement?: string | null        // ej: "ventas_ai", "soft_skills", "liderazgo"
  notas_ejecutivo?: string | null        // apuntes inferenciales del ejecutivo 30X
  intel_por_area?: Record<string, string> // contexto específico por área extraído del transcript
}

export type DiagnosticoConfig = {
  areas_preseleccionadas: string[]
  mensaje_bienvenida: string
  nombre_empresa_display: string
  deadline: string | null
  client_token?: string | null
}

export type Lead = {
  id: string
  created_at: string
  updated_at: string
  slug: string
  empresa: string
  industria: string | null
  pais: string
  website: string | null
  status: LeadStatus
  grain_transcript: string | null
  grain_parsed_at: string | null
  discovery_data: DiscoveryData
  diagnostico_config: DiagnosticoConfig
  contacto_nombre: string | null
  contacto_email: string | null
  contacto_cargo: string | null
  contacto_whatsapp: string | null
  deal_value_usd: number | null
  notas_internas: string | null
  propuesta_password: string
  diagnostico_activo: boolean
}

export type LeadSubmission = {
  id: string
  created_at: string
  lead_id: string
  areas: string[]
  nombre: string
  cargo: string
  email?: string
  telefono?: string
  headcount: number
  roles?: Rol[]
  herramientas: string[]
  herramienta_otra?: string
  chat_transcript: ChatMessage[]
  retos_chips: string[]
  retos_adicionales?: string
  insight?: string
  insight_aprobado: boolean
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, { label: string; color: string }> = {
  discovery:              { label: 'Discovery',           color: '#6b7280' },
  diagnostico_enviado:    { label: 'Diagnóstico enviado', color: '#3b82f6' },
  diagnostico_parcial:    { label: 'Diagnóstico parcial', color: '#d97706' },
  diagnostico_completo:   { label: 'Diagnóstico listo',  color: '#7c3aed' },
  propuesta_lista:        { label: 'Propuesta lista',     color: '#65a30d' },
  negociacion:            { label: 'En negociación',      color: '#ea580c' },
  cerrado_ganado:         { label: 'Cerrado',             color: '#16a34a' },
  cerrado_perdido:        { label: 'Perdido',             color: '#dc2626' },
}
