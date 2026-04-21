import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: Request) {
  const { submissions, areaSections, areaConversations, areasIntel } = await req.json()

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  // Build context: one block per person
  const personasContext = submissions.map((sub: {
    nombre: string; cargo: string; areas: string[]; herramientas: string[];
    retos_chips: string[]; roles: { nombre: string; headcount: number; necesidad?: string; nombrePersona?: string }[];
    chat_transcript: { role: string; content: string }[]; insight?: string
  }) => {
    const areaNames = sub.areas.map((id: string) => {
      const sec = areaSections.find((s: { area: { id: string; nombre: string } }) => s.area.id === id)
      return sec?.area.nombre ?? id
    }).join(', ')

    const chatText = (sub.chat_transcript ?? [])
      .filter((_: unknown, i: number) => i < 20)
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? sub.nombre.split(' ')[0] : 'IA'}: ${m.content}`)
      .join('\n')

    const intel = sub.areas.map((id: string) => areasIntel[id] ?? '').filter(Boolean).join('\n')

    return `
━━━ ${sub.nombre.toUpperCase()} · ${sub.cargo} ━━━
Área(s): ${areaNames}
Herramientas IA que usa: ${sub.herramientas?.filter((h: string) => h !== 'ninguna').join(', ') || 'ninguna'}
Retos que marcó: ${sub.retos_chips?.join(', ') || 'no especificados'}
Roles en su equipo: ${sub.roles?.map((r: { nombre: string; headcount: number; necesidad?: string; nombrePersona?: string }) => `${r.headcount}× ${r.nombre}${r.necesidad ? ` (necesidad: ${r.necesidad})` : ''}`).join(', ') || 'no especificados'}
Insight aprobado: ${sub.insight || 'ninguno'}
Intel del área (contexto 30X): ${intel || 'sin intel específica'}
Conversación en el diagnóstico:
${chatText || '(sin conversación registrada)'}
`.trim()
  }).join('\n\n')

  // Add area-level conversations from /propuesta if available
  const conversacionesPropuesta = Object.entries(areaConversations ?? {})
    .filter(([, msgs]) => Array.isArray(msgs) && (msgs as unknown[]).length > 0)
    .map(([areaId, msgs]) => {
      const sec = areaSections.find((s: { area: { id: string; nombre: string } }) => s.area.id === areaId)
      const name = sec?.area.nombre ?? areaId
      const text = (msgs as { role: string; content: string }[])
        .map(m => `${m.role === 'user' ? 'Juan José' : 'Asistente 30X'}: ${m.content}`)
        .join('\n')
      return `\n━━━ CONVERSACIÓN DE PROPUESTA — ${name.toUpperCase()} ━━━\n${text}`
    }).join('\n')

  const prompt = `Eres un estratega senior de 30X Escuela de Negocios. Juan José Sarmiento va a reunirse con los líderes de Tugó para presentar la propuesta de formación IA. Necesita un brief de preparación para esas conversaciones.

CONTEXTO POR PERSONA:
${personasContext}

${conversacionesPropuesta ? `CONVERSACIONES DE REVISIÓN (propuesta):\n${conversacionesPropuesta}` : ''}

Genera un brief de preparación para Juan José, estructurado persona por persona. Para CADA persona incluye exactamente estas secciones:

## [Nombre] — [Cargo]

**Lo que sabemos de él/ella:**
(Qué revela el diagnóstico sobre su perfil, madurez en IA, cómo respondió, qué priorizó, qué no mencionó — incluyendo si no llenó el diagnóstico directamente)

**Su problema real:**
(El dolor concreto que vive en su día a día, traducido desde sus respuestas y el contexto del área — no generalidades, sino situaciones específicas de alguien en ese cargo en Tugó)

**Programa recomendado: [Nombre] — $[precio] · [duración]**
(Por qué este programa es el correcto para esta persona específica, con argumentos concretos basados en su perfil y contexto)

**Advertencia para Juan José:**
(Riesgo o consideración táctica que Juan José debe tener en mente antes de hablar con esta persona — objeciones probables, sensibilidades, qué NO decir)

**El mensaje para esta persona:**
(Un párrafo en primera persona que Juan José puede adaptar — concreto, resonante, conectado con el mundo real de esa persona en Tugó)

---

Escribe en español colombiano, directo y sin rodeos. Sé específico — usa nombres, cargos, herramientas que mencionaron, situaciones reales del diagnóstico. El brief debe ser accionable, no genérico.`

  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-6'),
    prompt,
    maxOutputTokens: 4000,
  })

  return NextResponse.json({ brief: text })
}
