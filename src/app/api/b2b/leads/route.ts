import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { Lead } from '@/lib/b2b-types'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
}

export async function GET() {
  const { data, error } = await db()
    .from('leads')
    .select('*, lead_submissions(count)')
    .order('updated_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const leads = (data ?? []).map((d: Lead & { lead_submissions: { count: number }[] }) => ({
    ...d,
    submissions_count: d.lead_submissions?.[0]?.count ?? 0,
  }))
  return NextResponse.json(leads)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { slug, empresa, industria, pais, website, contacto_nombre, contacto_email,
    contacto_cargo, contacto_whatsapp, deal_value_usd, grain_transcript, discovery_data } = body

  if (!slug || !empresa) {
    return NextResponse.json({ error: 'slug y empresa son requeridos' }, { status: 400 })
  }

  const { data, error } = await db()
    .from('leads')
    .insert({
      slug, empresa, industria, pais, website,
      contacto_nombre, contacto_email, contacto_cargo, contacto_whatsapp,
      deal_value_usd, grain_transcript,
      discovery_data: discovery_data ?? {},
      diagnostico_config: {
        areas_preseleccionadas: discovery_data?.areas_identificadas ?? [],
        mensaje_bienvenida: '',
        nombre_empresa_display: empresa,
        deadline: null,
      },
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
