import { NextResponse } from 'next/server'
import { getLeadBySlug, createLeadSubmission } from '@/lib/b2b-supabase'

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lead = await getLeadBySlug(slug)
  if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })

  const body = await req.json()
  const { areas, nombre, cargo, email, telefono, headcount, roles,
    herramientas, herramienta_otra, chat_transcript, retos_chips, retos_adicionales } = body

  if (!Array.isArray(areas) || areas.length === 0 || !nombre || !cargo) {
    return NextResponse.json({ error: 'Faltan campos requeridos: areas, nombre, cargo', code: 'missing_fields' }, { status: 400 })
  }

  const areasPermitidas = lead.diagnostico_config.areas_preseleccionadas
  if (areasPermitidas.length > 0) {
    const invalidas = areas.filter((a: string) => !areasPermitidas.includes(a))
    if (invalidas.length > 0) {
      return NextResponse.json({ error: `Áreas no permitidas: ${invalidas.join(', ')}`, code: 'invalid_areas' }, { status: 400 })
    }
  }

  let submission
  try {
    submission = await createLeadSubmission(lead.id, {
      areas, nombre, cargo, email, telefono,
      headcount: headcount ?? 1,
      roles: roles ?? [],
      herramientas: herramientas ?? [],
      herramienta_otra,
      chat_transcript: chat_transcript ?? [],
      retos_chips: retos_chips ?? [],
      retos_adicionales,
      insight: undefined,
      insight_aprobado: false,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al guardar el diagnóstico'
    return NextResponse.json({ error: msg, code: 'db_error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: submission.id })
}
