import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Rol = {
  id: string
  nombre: string
  headcount: number
  necesidad: string
  nombrePersona?: string
}

export type Submission = {
  id: string
  created_at: string
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

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}
