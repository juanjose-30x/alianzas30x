import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { getLeadBySlug, getLeadSubmissions } from '@/lib/b2b-supabase'

export const runtime = 'edge'

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lead = await getLeadBySlug(slug)
  if (!lead) return new Response('No encontrado', { status: 404 })

  const { messages, token } = await req.json()

  // Validate token server-side on every request
  const expectedToken = lead.diagnostico_config.client_token
  if (!expectedToken || token !== expectedToken) {
    return new Response('No autorizado', { status: 401 })
  }

  const submissions = await getLeadSubmissions(lead.id)
  const empresa = lead.diagnostico_config.nombre_empresa_display || lead.empresa

  const subsContext = submissions.map(sub => {
    const tools = sub.herramientas?.filter(h => h !== 'ninguna') ?? []
    const lines = [
      `• ${sub.nombre} — ${sub.cargo}`,
      `  Área(s): ${sub.areas?.join(', ') || 'sin especificar'}`,
      `  Equipo a cargo: ${sub.headcount} personas`,
      tools.length > 0
        ? `  Herramientas IA en uso: ${tools.join(', ')}`
        : `  Sin herramientas IA actualmente`,
      sub.retos_chips?.length
        ? `  Retos: ${sub.retos_chips.join(', ')}`
        : '',
      sub.retos_adicionales
        ? `  Contexto: ${sub.retos_adicionales}`
        : '',
    ]
    if (sub.roles?.length) {
      lines.push(`  Roles del equipo: ${sub.roles.map(r => `${r.headcount}x ${r.nombre}`).join(', ')}`)
    }
    return lines.filter(Boolean).join('\n')
  }).join('\n\n')

  const totalHeadcount = submissions.reduce((s, sub) => s + (sub.headcount ?? 0), 0)

  const systemPrompt = `Eres un asistente analítico interno de ${empresa}. Tu función es ayudar al liderazgo a entender qué han compartido los diferentes equipos sobre sus necesidades, retos actuales y nivel de adopción tecnológica.

━━━ EMPRESA ━━━
Nombre: ${empresa}
Industria: ${lead.industria ?? 'no especificada'}
Total diagnósticos recibidos: ${submissions.length}
Total personas en scope: ${totalHeadcount}

━━━ DIAGNÓSTICOS POR ÁREA ━━━
${subsContext || '(sin diagnósticos registrados todavía)'}

━━━ CONTEXTO GENERAL ━━━
${lead.discovery_data?.contexto_empresa || '(sin contexto registrado)'}

━━━ INSTRUCCIONES ━━━
Responde con perspectiva ejecutiva y analítica:
- Identifica patrones entre áreas cuando sea relevante
- Señala brechas y prioridades con criterio
- Habla de las personas y equipos con respeto y contexto
- Puedes sugerir próximos pasos internos, mejores prácticas o preguntas que el liderazgo debería hacerse
- NO menciones proveedores externos, precios, ni programas de capacitación de ningún tipo
- NO hagas referencias a vendedores, consultoras ni servicios externos
- Responde siempre en español, de forma directa y ejecutiva`

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: systemPrompt,
    messages,
    maxOutputTokens: 900,
  })

  return result.toTextStreamResponse()
}
