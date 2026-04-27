import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'
import { getLeadBySlug } from '@/lib/b2b-supabase'

export const runtime = 'edge'

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lead = await getLeadBySlug(slug)
  if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 })

  const { submissions, areaConversations } = await req.json()
  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const empresa = lead.diagnostico_config.nombre_empresa_display || lead.empresa

  const personasContext = submissions.map((sub: {
    nombre: string; cargo: string; areas: string[]; herramientas: string[];
    retos_chips: string[]; roles: { nombre: string; headcount: number; necesidad?: string }[];
    chat_transcript: { role: string; content: string }[]; insight?: string
  }) => {
    const chatText = (sub.chat_transcript ?? []).slice(0, 16)
      .map((m: { role: string; content: string }) => `${m.role === 'user' ? sub.nombre.split(' ')[0] : 'IA'}: ${m.content}`)
      .join('\n')
    return `━━━ ${sub.nombre.toUpperCase()} · ${sub.cargo} ━━━
Áreas: ${sub.areas.join(', ')}
Herramientas: ${sub.herramientas?.filter((h: string) => h !== 'ninguna').join(', ') || 'ninguna'}
Retos: ${sub.retos_chips?.join(', ') || 'no especificados'}
Equipo: ${sub.roles?.map((r: { nombre: string; headcount: number; necesidad?: string }) => `${r.headcount}× ${r.nombre}${r.necesidad ? ` (${r.necesidad})` : ''}`).join(', ') || 'no especificado'}
Conversación diagnóstico:\n${chatText || '(sin conversación)'}`
  }).join('\n\n')

  const conversacionesPropuesta = Object.entries(areaConversations ?? {})
    .filter(([, msgs]) => Array.isArray(msgs) && (msgs as unknown[]).length > 0)
    .map(([area, msgs]) => {
      const text = (msgs as { role: string; content: string }[])
        .map(m => `${m.role === 'user' ? 'Ejecutivo 30X' : 'Asistente'}: ${m.content}`).join('\n')
      return `━━━ REVISIÓN PROPUESTA — ${area.toUpperCase()} ━━━\n${text}`
    }).join('\n\n')

  const prompt = `Eres un estratega senior de 30X Escuela de Negocios. Un ejecutivo de 30X va a reunirse con los líderes de ${empresa} para presentar la propuesta de formación IA.

CONTEXTO DE ${empresa.toUpperCase()}:
Industria: ${lead.industria ?? 'No especificada'}
${lead.discovery_data.contexto_empresa || ''}
Señales de presupuesto: ${lead.discovery_data.senales_presupuesto}
Decision makers: ${lead.discovery_data.decision_makers?.map(dm => `${dm.nombre} (${dm.cargo}, ${dm.rol})`).join(', ') || 'No identificados'}

TRANSCRIPT DISCOVERY CALL:
${lead.grain_transcript ? lead.grain_transcript.slice(0, 3000) : '(sin transcript)'}

DATOS POR PERSONA:
${personasContext}

${conversacionesPropuesta ? `CONVERSACIONES DE REVISIÓN:\n${conversacionesPropuesta}` : ''}

Genera un brief de preparación para el ejecutivo de 30X, persona por persona. Para CADA persona:

## [Nombre] — [Cargo]

**Lo que sabemos de él/ella:**
(Perfil, madurez en IA, cómo respondió, qué priorizó)

**Su problema real:**
(El dolor concreto en su día a día en ${empresa}, no generalidades)

**Programa recomendado: [Nombre] — $[precio] · [duración]**
(Por qué este programa específicamente para esta persona)

**Advertencia para el ejecutivo 30X:**
(Riesgo o consideración táctica — objeciones probables, qué NO decir)

**El mensaje para esta persona:**
(Párrafo que el ejecutivo puede adaptar — concreto y conectado con su realidad en ${empresa})

---

Español directo, sin rodeos. Usa nombres, cargos y situaciones reales del diagnóstico.`

  const { text } = await generateText({
    model: anthropic('claude-sonnet-4-6'),
    prompt,
    maxOutputTokens: 4000,
  })

  return NextResponse.json({ brief: text })
}
