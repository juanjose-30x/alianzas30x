import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

const EXCLUDED_EMAILS = ['administracionsales@30x.com', 'juanjose@30x.com']

export type MinimedSubmission = {
  id: string
  created_at: string
  nombre: string
  cargo: string
  areas: string[]
  headcount: number
  email: string
  telefono: string
  roles: string[]
  herramientas: string[]
  herramienta_otra?: string
  chat_transcript: { role: 'user' | 'assistant'; content: string }[]
  retos_chips: string[]
  insight?: string
  insight_aprobado: boolean
}

export type AgriglobalSubmission = {
  id: string
  created_at: string
  nombre: string
  rol: string
  programa: string
  email: string
  telefono: string
  chat_transcript: { role: 'user' | 'assistant'; content: string }[]
  retos_chips: string[]
  insight_aprobado: boolean
}

export async function getMinimedSubmissions(): Promise<MinimedSubmission[]> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return ((data ?? []) as MinimedSubmission[]).filter(
    s => !EXCLUDED_EMAILS.includes((s.email ?? '').toLowerCase())
  )
}

export async function getAgriglobalSubmissions(): Promise<AgriglobalSubmission[]> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('agriglobal_submissions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as AgriglobalSubmission[]
}
