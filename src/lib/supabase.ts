import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Rol = {
  id: string
  nombre: string
  headcount: number
  necesidad: string
  nombrePersona?: string
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}
