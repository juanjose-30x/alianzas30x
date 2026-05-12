import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'
import { getLeadBySlug } from '@/lib/b2b-supabase'

export const runtime = 'edge'

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lead = await getLeadBySlug(slug)
  if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })

  const { messages, areaContext } = await req.json()
  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const empresa = lead.diagnostico_config.nombre_empresa_display || lead.empresa

  const conversationText = messages
    .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'EJECUTIVO 30X' : 'ASISTENTE'}: ${m.content}`)
    .join('\n\n')

  const prompt = `Basado en esta conversación de revisión del área ${areaContext.nombre} de ${empresa}, extrae las decisiones clave para armar la propuesta comercial.

DATOS DEL ÁREA:
- Personas: ${areaContext.personas?.map((p: { nombre: string; cargo: string }) => `${p.nombre} (${p.cargo})`).join(', ')}
- Headcount total: ${areaContext.headcount} personas
- Herramientas IA actuales: ${areaContext.herramientas?.join(', ') || 'ninguna'}
- Retos: ${areaContext.retos?.join(', ') || 'no especificados'}
- Contexto empresa: ${lead.discovery_data.contexto_empresa || empresa}

CONVERSACIÓN:
${conversationText}

Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta (sin markdown):
{
  "hook": "Pregunta provocadora para el cliente estilo '¿Cuántos X pierdes por Y que la IA resuelve en minutos?'",
  "problema": "2-3 oraciones describiendo el problema específico de esta área en ${empresa}",
  "programaNombre": "Nombre exacto del programa 30X más recomendado",
  "programaJustificacion": "2-3 oraciones de por qué este programa es el adecuado para esta área específica",
  "cupos": número entero de cupos recomendados basado en el headcount,
  "precioUSD": número del precio por cupo en USD (1950 para AI Sales, 1990 para Sales Machine, 1295 para Growth Rockstar, 3000 para AI for Executives, 1500 para Hardcore AI o Achievers)
}`

  let text: string
  try {
    const result = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      prompt,
      maxOutputTokens: 600,
    })
    text = result.text
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al generar extracción'
    return NextResponse.json({ error: msg, code: 'ai_error' }, { status: 502 })
  }

  try {
    const clean = text.replace(/```json[\s\S]*?```|```/g, '').trim()
    return NextResponse.json(JSON.parse(clean))
  } catch {
    return NextResponse.json({ error: 'Respuesta IA no es JSON válido', code: 'parse_error', raw: text }, { status: 500 })
  }
}
