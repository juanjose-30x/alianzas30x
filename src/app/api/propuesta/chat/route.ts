import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'

export const runtime = 'edge'

export async function POST(req: Request) {
  const { messages, areaContext } = await req.json()

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const personasText = areaContext.personas
    ?.map((p: { nombre: string; cargo: string }) => `- ${p.nombre} (${p.cargo})`)
    .join('\n') ?? ''

  const rolesText = areaContext.roles
    ?.map((r: { nombre: string; headcount: number; necesidad?: string; nombrePersona?: string }) =>
      `- ${r.headcount}x ${r.nombre}${r.nombrePersona ? ` (${r.nombrePersona})` : ''}${r.necesidad ? ` → necesidad: "${r.necesidad}"` : ''}`
    ).join('\n') ?? ''

  const quotesText = areaContext.quotes?.length
    ? areaContext.quotes.map((q: string, i: number) => `${i + 1}. "${q}"`).join('\n')
    : 'Sin citas disponibles.'

  const systemPrompt = `Eres un consultor senior de 30X Escuela de Negocios ayudando a Juan José Sarmiento a revisar y afinar la propuesta de formación IA para el área de ${areaContext.nombre} en Tugó (empresa colombiana de muebles, multinacional, ~18 tiendas en Colombia).

━━━ DATOS DEL ÁREA: ${areaContext.emoji} ${areaContext.nombre} ━━━

PERSONAS QUE RESPONDIERON EL DIAGNÓSTICO:
${personasText || 'Sin información.'}

EQUIPO (${areaContext.headcount} personas en scope):
${rolesText || 'Sin roles definidos.'}

HERRAMIENTAS DE IA QUE USAN HOY:
${areaContext.herramientas?.filter((h: string) => h !== 'ninguna').join(', ') || 'Ninguna actualmente.'}

RETOS QUE IDENTIFICARON:
${areaContext.retos?.join(', ') || 'No especificados.'}

LO QUE DIJERON EN EL DIAGNÓSTICO (citas textuales):
${quotesText}

MADUREZ DEL ÁREA: ${areaContext.maturityScore}/100
${areaContext.insight ? `\nINSIGHT APROBADO:\n${areaContext.insight}` : ''}

━━━ CATÁLOGO 30X RELEVANTE ━━━

• AI Sales ($1,950 · 4 semanas) — Ventas B2B con IA: prospección automatizada, hiperpersonalización, forecasting. Instructores: Nicolás Rojas (Rappi), Andrés Bilbao (Dapta).
• Sales Machine ($1,990 · 8 semanas) — Playbook B2B completo desde prospección hasta cierre. Ideal para equipos que necesitan sistema desde cero.
• Growth Rockstar ($1,295 · 8 semanas) — Motor de adquisición, retención y monetización. Ideal para mercadeo y growth.
• AI for Executives ($3,000 · 8 semanas) — Estrategia de IA para C-Level y VPs: gobernanza, decisiones, transformación digital. Instructoras: Cinthya Sánchez (ex-Microsoft LATAM).
• Hardcore AI ($1,500 · 4 semanas) — Construye agentes y productos con código. Para perfiles técnicos.
• Operaciones (a la medida) — El sistema operativo de la empresa con IA. Automatización de procesos.
• Achievers ($1,500 · 8 semanas) — De mindset a MVP desplegado. Para ejecutivos que quieren construir.

━━━ TU ROL ━━━

Ayuda a Juan José a:
1. Afinar qué programa(s) son los más relevantes para ESTE equipo específico y por qué
2. Identificar quick wins y riesgos de adopción
3. Sugerir cómo personalizar el mensaje para los gerentes de esta área
4. Estimar si una cohorte pequeña (piloto) o grande tiene más sentido
5. Hacer cualquier ajuste a la propuesta que Juan José quiera

Responde en español colombiano, directo, sin bullets innecesarios. Eres el experto — da recomendaciones concretas, no generalidades.`

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: systemPrompt,
    messages,
    maxOutputTokens: 800,
  })

  return result.toTextStreamResponse()
}
