import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
}

// PATCH /api/b2b/leads/[slug]/client-access — sets client_token in diagnostico_config without clobbering other fields
export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { token } = await req.json()

  // Fetch existing diagnostico_config first to merge
  const { data: lead, error: fetchErr } = await db()
    .from('leads')
    .select('diagnostico_config')
    .eq('slug', slug)
    .single()

  if (fetchErr || !lead) {
    return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
  }

  const merged = { ...lead.diagnostico_config, client_token: token }

  const { data, error } = await db()
    .from('leads')
    .update({ diagnostico_config: merged })
    .eq('slug', slug)
    .select('diagnostico_config')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
