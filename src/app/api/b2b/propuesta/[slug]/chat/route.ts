import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { getLeadBySlug, getLeadSubmissions } from '@/lib/b2b-supabase'
import { AREAS, HERRAMIENTAS_IA } from '@/lib/areas'

export const runtime = 'edge'

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lead = await getLeadBySlug(slug)
  if (!lead) return new Response('Lead no encontrado', { status: 404 })

  const { messages, areaContext } = await req.json()
  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const empresa = lead.diagnostico_config.nombre_empresa_display || lead.empresa

  const personasText = areaContext.personas
    ?.map((p: { nombre: string; cargo: string }) => `- ${p.nombre} (${p.cargo})`).join('\n') ?? ''

  const rolesText = areaContext.roles
    ?.map((r: { nombre: string; headcount: number; necesidad?: string; nombrePersona?: string }) =>
      `- ${r.headcount}x ${r.nombre}${r.nombrePersona ? ` (${r.nombrePersona})` : ''}${r.necesidad ? ` → necesidad: "${r.necesidad}"` : ''}`
    ).join('\n') ?? ''

  const quotesText = areaContext.quotes?.length
    ? areaContext.quotes.map((q: string, i: number) => `${i + 1}. "${q}"`).join('\n')
    : 'Sin citas disponibles.'

  const diagnosis30x = lead.discovery_data.diagnosis_30x
  const intelArea = lead.discovery_data.intel_por_area?.[areaContext.nombre?.toLowerCase() ?? '']
  const notasEjecutivo = lead.discovery_data.notas_ejecutivo

  const systemPrompt = `Eres un consultor senior de 30X Escuela de Negocios ayudando a preparar la propuesta de formación IA para el área de ${areaContext.nombre} en ${empresa} (${lead.industria ?? 'empresa'}, ${lead.pais ?? 'Latinoamérica'}).

━━━ CONTEXTO DE ${empresa.toUpperCase()} ━━━
${lead.discovery_data.contexto_empresa || ''}
Señales de presupuesto: ${lead.discovery_data.senales_presupuesto}
${diagnosis30x ? `\n━━━ DIAGNÓSTICO 30X ━━━\n${diagnosis30x}` : ''}
${intelArea ? `\n━━━ INTEL DEL ÁREA ${areaContext.nombre?.toUpperCase()} ━━━\n${intelArea}` : ''}
${notasEjecutivo ? `\n━━━ NOTAS DEL EJECUTIVO ━━━\n${notasEjecutivo}` : ''}

━━━ DATOS DEL ÁREA: ${areaContext.emoji} ${areaContext.nombre} ━━━

PERSONAS QUE RESPONDIERON EL DIAGNÓSTICO:
${personasText || 'Sin información.'}

EQUIPO (${areaContext.headcount} personas en scope):
${rolesText || 'Sin roles definidos.'}

HERRAMIENTAS DE IA QUE USAN HOY:
${areaContext.herramientas?.join(', ') || 'Ninguna actualmente.'}

RETOS QUE IDENTIFICARON:
${areaContext.retos?.join(', ') || 'No especificados.'}

LO QUE DIJERON EN EL DIAGNÓSTICO:
${quotesText}

MADUREZ DEL ÁREA: ${areaContext.maturityScore}/100
${areaContext.insight ? `\nINSIGHT:\n${areaContext.insight}` : ''}

━━━ CATÁLOGO 30X RELEVANTE ━━━
• AI Sales ($1,950 · 4 semanas) — Ventas B2B con IA. Instructores: Nicolás Rojas (Rappi), Andrés Bilbao (Dapta).
• Sales Machine ($1,990 · 8 semanas) — Playbook B2B completo.
• Growth Rockstar ($1,295 · 8 semanas) — Motor de adquisición, retención y monetización.
• AI for Executives ($3,000 · 8 semanas) — Estrategia de IA para C-Level y VPs.
• Hardcore AI ($1,500 · 4 semanas) — Construye agentes y productos con código.
• Achievers ($1,500 · 8 semanas) — De mindset a MVP desplegado.
• Operaciones (a la medida) — Automatización de procesos con IA.

━━━ TU ROL ━━━
Ayuda a afinar qué programa(s) son más relevantes para ESTE equipo en ${empresa}, identificar quick wins, riesgos de adopción y cómo personalizar el mensaje para esta empresa.
Responde en español, directo y concreto. Da recomendaciones específicas, no generalidades.`

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: systemPrompt,
    messages,
    maxOutputTokens: 800,
  })

  return result.toTextStreamResponse()
}
