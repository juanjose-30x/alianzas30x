import { createClient } from '@supabase/supabase-js'

export type EventType = 'meeting' | 'follow_up' | 'propuesta' | 'cierre' | 'otro'

export type PipelineEvent = {
  id: string
  created_at: string
  lead_id: string | null
  lead_slug: string
  empresa: string
  title: string
  date: string          // ISO date string yyyy-mm-dd
  type: EventType
  notes: string | null
  user_email: string | null
}

export type PipelineEventCreate = Omit<PipelineEvent, 'id' | 'created_at'>

export const EVENT_TYPE_LABELS: Record<EventType, { label: string; color: string }> = {
  meeting:    { label: 'Reunión',      color: '#3b82f6' },
  follow_up:  { label: 'Follow-up',   color: '#d97706' },
  propuesta:  { label: 'Propuesta',   color: '#7c3aed' },
  cierre:     { label: 'Cierre',      color: '#15803d' },
  otro:       { label: 'Otro',        color: '#6b7280' },
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export async function getEvents(year: number, month: number): Promise<PipelineEvent[]> {
  const supabase = getServiceClient()
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const end   = new Date(year, month, 0).toISOString().slice(0, 10) // last day of month
  const { data, error } = await supabase
    .from('pipeline_events')
    .select('*')
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as PipelineEvent[]
}

export async function getAllEvents(): Promise<PipelineEvent[]> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('pipeline_events')
    .select('*')
    .order('date', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as PipelineEvent[]
}

export async function createEvent(payload: PipelineEventCreate): Promise<PipelineEvent> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('pipeline_events')
    .insert(payload)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as PipelineEvent
}

export async function deleteEvent(id: string): Promise<void> {
  const supabase = getServiceClient()
  const { error } = await supabase
    .from('pipeline_events')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
}
