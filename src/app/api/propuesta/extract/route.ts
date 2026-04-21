import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: Request) {
  const { messages, areaContext } = await req.json()

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const conversationText = messages
    .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'JUAN JOSÉ' : 'ASISTENTE 30X'}: ${m.content}`)
    .join('\n\n')

  const prompt = `Basado en esta conversación de revisión del área ${areaContext.nombre} de Tugó, extrae las decisiones clave para armar la propuesta comercial.

DATOS DEL ÁREA:
- Personas: ${areaContext.personas?.map((p: { nombre: string; cargo: string }) => `${p.nombre} (${p.cargo})`).join(', ')}
- Headcount total: ${areaContext.headcount} personas
- Herramientas IA actuales: ${areaContext.herramientas?.join(', ') || 'ninguna'}
- Retos: ${areaContext.retos?.join(', ') || 'no especificados'}

CONVERSACIÓN:
${conversationText}

Devuelve ÚNICAMENTE un JSON válido con esta estructura exacta (sin markdown, sin explicaciones):
{
  "hook": "Pregunta provocadora para el cliente estilo '¿Cuántos X pierdes por Y que la IA resuelve en minutos?'",
  "problema": "2-3 oraciones describiendo el problema específico de esta área en Tugó",
  "programaNombre": "Nombre exacto del programa 30X más recomendado",
  "programaJustificacion": "2-3 oraciones de por qué este programa es el adecuado para esta área específica",
  "cupos": número entero de cupos recomendados basado en el headcount,
  "precioUSD": número del precio por cupo en USD (1950 para AI Sales, 1990 para Sales Machine, 1295 para Growth Rockstar, 3000 para AI for Executives, 1500 para Hardcore AI o Achievers, 1450 para Xtreme Growth)
}

Si no hay suficiente información en la conversación para una decisión, usa valores razonables basados en los datos del área.`

  const { text } = await generateText({
    model: anthropic('claude-haiku-4-5-20251001'),
    prompt,
    maxOutputTokens: 600,
  })

  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'parse_error', raw: text }, { status: 500 })
  }
}
