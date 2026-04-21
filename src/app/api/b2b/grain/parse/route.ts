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

  const prompt = `Eres un analista de ventas B2B de 30X Escuela de Negocios. Analiza este transcript de discovery call con "${empresa}" y extrae información estructurada para preparar el diagnóstico de IA.

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
  "notas_adicionales": "Cualquier dato relevante que no encaje en los campos anteriores"
}

Para "rol" de decision_makers usa solo: "champion", "sponsor", "blocker", "influencer".
Para "senales_presupuesto" usa solo: "alto", "medio", "bajo", "desconocido".
Si el transcript no menciona algo, deja el campo vacío o en su valor por defecto.`

  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-6'),
    prompt,
    maxOutputTokens: 1500,
  })

  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'parse_error', raw: text }, { status: 500 })
  }
}
