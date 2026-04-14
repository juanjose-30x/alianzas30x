import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'

export const runtime = 'edge'

const PROGRAMAS_30X = `
PROGRAMAS DE 30X (usa estos para recomendar, sin mencionar precios):
- AI SALES: Para equipos comerciales. Prospectar, calificar y cerrar con IA. Automatizar outreach y seguimiento.
- SALES MACHINE: Metodología de ventas, construcción de pipeline, proceso comercial estructurado. No exclusivo de IA.
- HARDCORE AI: Para perfiles técnicos y desarrolladores. Construir con IA, agentes, automatizaciones complejas, integración con sistemas.
- NEGOCIACIÓN: Para compradores, gerentes B2B y líderes. Técnicas de negociación de alto valor.
- ESTRATEGIA EJECUTIVA CON IA: Para gerentes y directivos. Toma de decisiones, liderazgo en transformación digital y IA.
- AI PARA OPERACIONES: Automatización de procesos, logística, planeación con IA.
- AI CREATIVA: Para diseño, mercadeo, contenido. Generación de imágenes, copy, video con IA.
- AI PARA DATOS: Análisis, reportes, Power BI + IA, toma de decisiones basada en datos.
`

export async function POST(req: Request) {
  const { type, submissions, areaName } = await req.json()

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  let systemPrompt = ''
  let userPrompt = ''

  if (type === 'person') {
    const s = submissions[0]
    const transcript = s.chat_transcript
      ?.filter((_: unknown, i: number) => i > 0)
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? s.nombre : 'Asistente'}: ${m.content}`)
      .join('\n') || 'Sin conversación registrada'

    const roles = s.roles?.map((r: { headcount: number; nombre: string; nombrePersona?: string; necesidad?: string }) =>
      `${r.headcount}x ${r.nombre}${r.nombrePersona ? ` (${r.nombrePersona})` : ''}${r.necesidad ? ` — necesidad: ${r.necesidad}` : ''}`
    ).join('\n') || 'No especificados'

    systemPrompt = `Eres consultor senior de 30X generando un diagnóstico comercial preciso y accionable.${PROGRAMAS_30X}
INSTRUCCIONES:
- Sé específico con los datos de esta persona, no genérico.
- Recomienda programas concretos de 30X justificando por qué.
- Propón un path de formación para el equipo (quién toma qué).
- Tono profesional pero directo. Máximo 300 palabras.
- Usa bullets solo donde aporte claridad.`

    userPrompt = `Genera el diagnóstico para:
PERSONA: ${s.nombre} — ${s.cargo}
ÁREA(S): ${s.areas?.join(', ')}
EQUIPO (${s.headcount} personas):
${roles}
HERRAMIENTAS QUE USA: ${s.herramientas?.join(', ') || 'ninguna'}
RETOS IDENTIFICADOS: ${s.retos_chips?.join(', ') || 'no especificados'}
CONVERSACIÓN:
${transcript}`

  } else if (type === 'area') {
    const transcripts = submissions.map((s: { nombre: string; cargo: string; headcount: number; herramientas: string[]; retos_chips: string[]; roles?: { headcount: number; nombre: string; necesidad?: string }[]; chat_transcript?: { role: string; content: string }[] }) => {
      const msgs = s.chat_transcript
        ?.filter((_: unknown, i: number) => i > 0)
        .map((m: { role: string; content: string }) => `  ${m.role === 'user' ? s.nombre : '30X'}: ${m.content}`)
        .join('\n') || '  Sin conversación'
      return `--- ${s.nombre} (${s.cargo}, ${s.headcount}p) ---\nHerramientas: ${s.herramientas?.join(', ') || 'ninguna'}\nRetos: ${s.retos_chips?.join(', ') || '—'}\nRoles: ${s.roles?.map((r: { headcount: number; nombre: string; necesidad?: string }) => `${r.headcount}x ${r.nombre}${r.necesidad ? ` (${r.necesidad})` : ''}`).join(', ') || '—'}\n${msgs}`
    }).join('\n\n')

    systemPrompt = `Eres consultor senior de 30X generando un diagnóstico consolidado de área para Tugó.${PROGRAMAS_30X}
INSTRUCCIONES:
- Consolida los patrones comunes entre los ${submissions.length} diagnóstico(s) del área.
- Identifica brechas, oportunidades y nivel de madurez en IA.
- Recomienda programas de 30X específicos para esta área con justificación.
- Propón una ruta de formación modular (quién, qué programa, en qué orden).
- Máximo 400 palabras. Profesional y accionable.`

    userPrompt = `Genera el diagnóstico consolidado del área de ${areaName} de Tugó.\n\nDIAGNÓSTICOS INDIVIDUALES:\n${transcripts}`

  } else if (type === 'global') {
    const resumen = submissions.map((s: { nombre: string; cargo: string; areas: string[]; headcount: number; herramientas: string[]; retos_chips: string[]; roles?: { headcount: number; nombre: string }[] }) =>
      `• ${s.nombre} (${s.cargo} · ${s.areas?.join('/')} · ${s.headcount}p): herramientas=[${s.herramientas?.join(', ') || 'ninguna'}] retos=[${s.retos_chips?.join(', ') || '—'}] roles=[${s.roles?.map((r: { headcount: number; nombre: string }) => `${r.headcount}x ${r.nombre}`).join(', ') || '—'}]`
    ).join('\n')

    systemPrompt = `Eres consultor senior de 30X generando la propuesta estratégica completa para Tugó.${PROGRAMAS_30X}
INSTRUCCIONES:
- Escribe una propuesta modular lista para presentar al equipo directivo de Tugó.
- Estructura: resumen ejecutivo → diagnóstico por área → propuesta de formación modular → roadmap sugerido → impacto esperado.
- Para cada área identifica qué programas de 30X aplican y para cuántas personas.
- Tono ejecutivo. Usa headers claros. Máximo 600 palabras.`

    userPrompt = `Genera la propuesta estratégica completa Tugó × 30X basada en ${submissions.length} diagnósticos.\n\nRESUMEN DE DIAGNÓSTICOS:\n${resumen}`
  }

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    maxOutputTokens: 800,
    temperature: 0.5,
  })

  return result.toTextStreamResponse()
}
