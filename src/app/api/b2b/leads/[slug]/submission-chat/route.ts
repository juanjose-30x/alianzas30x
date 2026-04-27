import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { getLeadBySlug } from '@/lib/b2b-supabase'

export const runtime = 'edge'

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lead = await getLeadBySlug(slug)
  if (!lead) return new Response('Lead no encontrado', { status: 404 })

  const { messages, submission } = await req.json()
  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const empresa = lead.diagnostico_config.nombre_empresa_display || lead.empresa

  const transcriptText = (submission.chat_transcript ?? [])
    .map((m: { role: string; content: string }) =>
      `${m.role === 'user' ? submission.nombre.split(' ')[0] : 'IA'}: ${m.content}`
    ).join('\n\n')

  const systemPrompt = `Eres un consultor senior de 30X analizando el diagnóstico de IA de ${submission.nombre}, ${submission.cargo} en ${empresa}.

━━━ PERFIL ━━━
Nombre: ${submission.nombre}
Cargo: ${submission.cargo}
Áreas: ${submission.areas?.join(', ')}
Headcount a cargo: ${submission.headcount} personas
Herramientas IA que usa hoy: ${submission.herramientas?.filter((h: string) => h !== 'ninguna').join(', ') || 'ninguna'}
Retos identificados: ${submission.retos_chips?.join(', ') || 'no especificados'}
${submission.roles?.length ? `\nEquipo:\n${submission.roles.map((r: { headcount: number; nombre: string; necesidad?: string }) => `- ${r.headcount}x ${r.nombre}${r.necesidad ? ` (${r.necesidad})` : ''}`).join('\n')}` : ''}

━━━ CONTEXTO ${empresa.toUpperCase()} ━━━
${lead.discovery_data.contexto_empresa || ''}
Industria: ${lead.industria ?? 'no especificada'}

━━━ CONVERSACIÓN DEL DIAGNÓSTICO ━━━
${transcriptText || '(sin conversación registrada)'}

━━━ CATÁLOGO 30X ━━━
• AI Sales ($1,950 · 4 sem) — Ventas B2B con IA
• Sales Machine ($1,990 · 8 sem) — Playbook B2B completo
• Growth Rockstar ($1,295 · 8 sem) — Motor de adquisición y retención
• AI for Executives ($3,000 · 8 sem) — IA para C-Level y VPs
• Hardcore AI ($1,500 · 4 sem) — Agentes y productos con código
• Achievers ($1,500 · 8 sem) — De mindset a MVP
• Operaciones (a la medida) — Automatización de procesos

Ayuda a entender qué programa es más relevante para esta persona, qué objeciones puede tener, cómo personalizar el mensaje y qué quick wins puedes mostrarle.
Responde en español, directo y concreto.`

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: systemPrompt,
    messages,
    maxOutputTokens: 800,
  })

  return result.toTextStreamResponse()
}
