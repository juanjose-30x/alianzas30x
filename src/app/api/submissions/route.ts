import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export async function POST(req: Request) {
  const supabase = getSupabase()
  const body = await req.json()

  const { data, error } = await supabase
    .from('submissions')
    .insert([{
      areas: body.areas,
      nombre: body.nombre,
      cargo: body.cargo,
      email: body.email,
      telefono: body.telefono,
      headcount: body.headcount,
      roles: body.roles,
      herramientas: body.herramientas,
      herramienta_otra: body.herramienta_otra,
      chat_transcript: body.chat_transcript,
      retos_chips: body.retos_chips,
      retos_adicionales: body.retos_adicionales,
      insight_aprobado: false,
    }])
    .select()
    .single()

  if (error) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id })
}

export async function GET() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
