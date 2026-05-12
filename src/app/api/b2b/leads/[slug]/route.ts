import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { data, error } = await db()
    .from('leads')
    .select('*, lead_submissions(*)')
    .eq('slug', slug)
    .single()
  if (error) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let patch: Record<string, unknown>
  try {
    patch = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido', code: 'invalid_json' }, { status: 400 })
  }

  if (!patch || typeof patch !== 'object' || Array.isArray(patch) || Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Patch vacío o inválido', code: 'invalid_patch' }, { status: 400 })
  }

  const FORBIDDEN = ['id', 'created_at', 'slug']
  for (const key of FORBIDDEN) {
    if (key in patch) {
      return NextResponse.json({ error: `Campo no editable: ${key}`, code: 'forbidden_field' }, { status: 400 })
    }
  }

  const { data, error } = await db()
    .from('leads')
    .update(patch)
    .eq('slug', slug)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message, code: 'db_error' }, { status: 500 })
  return NextResponse.json(data)
}
