import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'
import { AREAS } from '@/lib/areas'

export const runtime = 'edge'

const AREA_IDS = AREAS.map(a => a.id).join(', ')

export async function POST(req: Request) {
  const { transcript, empresa } = await req.json()
  if (!transcript || !empresa) {
    return NextResponse.json({ error: 'transcript y empresa son requeridos' }, { status: 400 })
  }

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const prompt = `Eres un analista de ventas B2B de 30X Escuela de Negocios. Analiza este transcript de discovery call con "${empresa}" y extrae información estructurada.

IDs DE ÁREAS DISPONIBLES EN 30X (usa solo estos):
${AREA_IDS}

TRANSCRIPT:
${transcript}

Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta (sin markdown):
{
  "areas_identificadas": ["ventas", "mercadeo"],
  "roles_mencionados": [
    { "nombre": "Gerente Comercial", "headcount_estimado": 1, "area": "ventas" }
  ],
  "headcount_estimado": 0,
  "pain_points": [
    { "area": "ventas", "descripcion": "No tienen sistema de seguimiento de leads" }
  ],
  "herramientas_actuales": [],
  "decision_makers": [
    { "nombre": "Carlos Pérez", "cargo": "Director Comercial", "rol": "champion" }
  ],
  "senales_presupuesto": "desconocido",
  "contexto_empresa": "Párrafo breve describiendo la empresa y su situación actual",
  "notas_adicionales": "Cualquier dato relevante que no encaje en los campos anteriores",
  "tema_engagement": "ventas_ai",
  "intel_por_area": {
    "ventas": "Contexto clave del área ventas mencionado en la reunión — procesos actuales, dolores específicos, nivel de madurez IA, personas clave"
  }
}

Para "rol" de decision_makers usa solo: "champion", "sponsor", "blocker", "influencer".
Para "senales_presupuesto" usa solo: "alto", "medio", "bajo", "desconocido".
Para "tema_engagement": identifica el tema central de la alianza. Puede ser: "ventas_ai", "marketing_ai", "liderazgo_ai", "soft_skills", "operaciones_ai", "datos_ai", "general_ai". Elige el que mejor refleje de qué se habló.
Para "intel_por_area": incluye SOLO las áreas identificadas. Por cada área escribe 2-3 oraciones con lo más relevante mencionado en la reunión — qué procesos tienen, qué dolores expresaron, quién está involucrado, su nivel actual con IA. Esta info alimentará el chat de diagnóstico para hacer preguntas más inteligentes.
Si el transcript no menciona algo, deja el campo vacío o en su valor por defecto.`

  let text: string
  try {
    const result = await generateText({
      model: anthropic('claude-sonnet-4-6'),
      prompt,
      maxOutputTokens: 1500,
    })
    text = result.text
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al llamar a la IA'
    return NextResponse.json({ error: msg, code: 'ai_error' }, { status: 502 })
  }

  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Respuesta IA no es JSON válido', code: 'parse_error', raw: text }, { status: 500 })
  }
}
