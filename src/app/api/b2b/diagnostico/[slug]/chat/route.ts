import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { getLeadBySlug } from '@/lib/b2b-supabase'
import { AREAS, HERRAMIENTAS_IA } from '@/lib/areas'

export const runtime = 'edge'

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lead = await getLeadBySlug(slug)
  if (!lead) return new Response('Lead no encontrado', { status: 404 })

  const { messages, areaIds, nombre, cargo, roles } = await req.json()

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const empresa = lead.diagnostico_config.nombre_empresa_display || lead.empresa
  const areaNames = (areaIds as string[]).map(id => AREAS.find(a => a.id === id)?.nombre ?? id).join(' y ')

  const herramientasUsadas = (lead.discovery_data.herramientas_actuales ?? [])
    .map(id => (HERRAMIENTAS_IA as unknown as { id: string; nombre: string }[]).find(h => h.id === id)?.nombre ?? id)
    .join(', ')

  const painPoints = (lead.discovery_data.pain_points ?? [])
    .filter(pp => areaIds.includes(pp.area))
    .map(pp => `• ${pp.descripcion}`)
    .join('\n')

  const rolesText = (roles ?? [])
    .map((r: { headcount: number; nombre: string; necesidad?: string }) =>
      `${r.headcount}× ${r.nombre}${r.necesidad ? ` (necesidad: ${r.necesidad})` : ''}`)
    .join(', ')

  // Intel de la reunión por área (extraído del Grain)
  const intelPorArea = lead.discovery_data.intel_por_area ?? {}
  const intelArea = (areaIds as string[])
    .map(id => intelPorArea[id])
    .filter(Boolean)
    .join('\n')

  // Notas inferenciales del ejecutivo (no se revelan, solo orientan)
  const notasEjecutivo = lead.discovery_data.notas_ejecutivo?.trim() ?? ''

  const tema = lead.discovery_data.tema_engagement ?? 'general_ai'

  const temaLabel: Record<string, string> = {
    ventas_ai:       'ventas con IA — prospección, cierre, automatización comercial',
    marketing_ai:    'marketing con IA — contenido, crecimiento, automatización de campañas',
    liderazgo_ai:    'liderazgo y gestión con IA',
    soft_skills:     'habilidades blandas — comunicación, liderazgo, negociación',
    operaciones_ai:  'operaciones con IA — eficiencia, automatización de procesos',
    datos_ai:        'análisis de datos e inteligencia de negocio con IA',
    general_ai:      'transformación e inteligencia artificial',
  }

  const numRoles = (roles ?? []).filter((r: { nombre: string }) => r.nombre).length
  const maxExchanges = Math.max(7, numRoles + 5)

  const systemPrompt = `Eres el asistente de diagnóstico de 30X Escuela de Negocios. Estás haciendo un discovery con ${nombre}, ${cargo} de ${empresa} (${lead.industria ?? 'empresa'}).

MISIÓN: Entender las necesidades reales del área con foco en ${temaLabel[tema] ?? tema}. Explora si hay algo adicional relevante para la alianza estratégica con 30X más allá de lo ya conversado.

━━━ CONTEXTO DE ${empresa.toUpperCase()} ━━━
Industria: ${lead.industria ?? 'No especificada'}
${lead.discovery_data.contexto_empresa ? `Contexto: ${lead.discovery_data.contexto_empresa}` : ''}
Herramientas IA actuales: ${herramientasUsadas || 'Ninguna identificada aún'}
Señales de presupuesto: ${lead.discovery_data.senales_presupuesto}

━━━ LO QUE SE HABLÓ EN LA REUNIÓN (usa para personalizar, no cites literalmente) ━━━
${intelArea || painPoints || 'Sin contexto previo de reunión para esta área.'}

${notasEjecutivo ? `━━━ APUNTES INTERNOS (nunca revelar ni citar directamente) ━━━\n${notasEjecutivo}\n` : ''}
━━━ ÁREA EN DIAGNÓSTICO ━━━
${areaNames}
${rolesText ? `Equipo: ${rolesText}` : ''}

REGLAS:
- Español, tutéalo, tono cálido y directo como colega.
- Máximo 2 oraciones por respuesta. UNA sola pregunta por mensaje.
- Máximo ${maxExchanges} intercambios en total.
- NUNCA menciones programas, precios ni cursos de 30X.
- Sin bullets en tus respuestas. Como persona, no formulario.
- Usa el contexto de la reunión y los apuntes para hacer preguntas inteligentes. NUNCA los cites ni reveles.

PREGUNTAS OBLIGATORIAS (en orden natural, no mecánico):
1. ¿Qué quieren lograr diferente este año en el área? (negocio, no tecnología)
2. ¿Cuál es el mayor cuello de botella hoy?
3. Por cada rol del equipo, haz UNA pregunta específica sobre sus retos reales. Sé específico al rol y a lo que ${empresa} hace — no preguntes de forma genérica.
4. ¿Hay algo adicional a contemplar en la alianza con 30X, más allá de lo que ya se conversó?
5. ¿Cómo se vería el éxito si la alianza con 30X funcionara en 6 meses? (OBLIGATORIA — no cierres sin esta respuesta)
6. Antes de cerrar pregunta exactamente: "¿Hay algo más que debería tener en cuenta para el proceso de transformación en la alianza, o lo dejamos aquí?"

CIERRE: Después de recibir respuesta a las preguntas 4, 5 y 6, cierra con algo breve y genuino. Añade exactamente [CONVERSACION_COMPLETA] al final de tu mensaje de cierre (sin mostrárselo al usuario visualmente).`

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: systemPrompt,
    messages,
    maxOutputTokens: 400,
  })

  return result.toTextStreamResponse()
}
