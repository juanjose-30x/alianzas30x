import { NextRequest, NextResponse } from 'next/server'
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { PROGRAMAS_30X, sugerirPrograma } from '@/lib/programas-30x'
import type { OutreachTarget } from '@/lib/prospecting-types'
import type { Programa } from '@/lib/programas-30x'

const anthropic = createAnthropic()

function buildPrompt(target: OutreachTarget, programa: Programa): string {
  const cargo = target.contacto_cargo || 'líder'
  const empresa = target.empresa
  const industria = target.industria || 'tu industria'
  const stage = target.lifecycle_stage ?? 'lead'

  let contexto = ''
  let angulo = ''

  if (target.source === 'hubspot') {
    const programas = target.programas_comprados?.length ? target.programas_comprados.join(', ') : ''
    const multiPersona = (target.total_contacts ?? 1) > 2

    if (stage === 'customer' && programas) {
      contexto = `Esta empresa ya es cliente de 30X. Programas comprados: ${programas}.`
      if (multiPersona) contexto += ` ${target.total_contacts} personas de esta empresa han pasado por 30X.`
      angulo = 'Proponer el siguiente programa complementario al que ya tienen.'
    } else if (stage === 'luma') {
      const badge = target.context_badge
      contexto = `El contacto asistió o se registró al evento de Luma: "${badge}".`
      angulo = 'Conectar la experiencia del evento con el programa que se ofrece.'
    } else if (stage === 'clase_gratis') {
      contexto = 'El contacto se registró a una clase gratis de 30X.'
      angulo = 'Convertir el interés mostrado en la clase gratis en inscripción al programa.'
    } else if (['opportunity', 'salesqualifiedlead', 'marketingqualifiedlead'].includes(stage)) {
      contexto = `El contacto está en etapa "${stage}" en el CRM — mostró interés pero no ha comprado.`
      angulo = 'Retomar la conversación y cerrar la oportunidad.'
    } else {
      contexto = 'El contacto está en la base de datos de 30X como lead.'
      angulo = 'Primer contacto — despertar interés en el programa.'
    }

    if (multiPersona && stage !== 'customer') {
      contexto += ` ${target.total_contacts} personas de ${empresa} han estado en contacto con 30X.`
    }
  } else if (target.source === 'clay') {
    contexto = `Señales de compra detectadas: ${target.context_badge}.`
    angulo = 'Primer contacto frío — despertar interés con base en las señales de compra.'
  } else if (target.source === 'pipeline') {
    contexto = target.context_badge && target.context_badge !== 'Sin diagnóstico aún'
      ? `Empresa con diagnóstico completado: ${target.context_badge}.`
      : 'Empresa en el pipeline de 30X.'
    angulo = 'Avanzar la conversación con base en el diagnóstico realizado.'
  }

  return `Eres un consultor B2B experto en ventas de programas de capacitación ejecutiva en Latinoamérica. Tu tono es cálido, directo y ejecutivo — sin spam ni frases genéricas de vendedor.

Redacta un mensaje de WhatsApp para contacto B2B. Debe:
- Empezar con el nombre de pila (sin "Hola" genérico si puedes ser más creativo)
- Ser breve (máximo 4 oraciones)
- Mencionar el programa y POR QUÉ es relevante para su cargo/empresa específica
- Incluir una llamada a acción concreta (agendar 20 min, resolver una duda, etc.)
- NO usar emojis, NO sonar como template de marketing
- Idioma: español colombiano, tuteo o usted según el cargo (CEO/Director → usted, Manager/Head → tú)
${angulo ? `- Ángulo del mensaje: ${angulo}` : ''}

Datos del contacto:
- Nombre: ${target.contacto_nombre || '(desconocido)'}
- Cargo: ${cargo}
- Empresa: ${empresa}
- Industria: ${industria}
- Contexto: ${contexto}

Programa a ofrecer:
- Nombre: ${programa.nombre}
- Pitch: ${programa.pitch}
- Duración: ${programa.duracion}
- Precio: USD ${programa.precio_usd > 0 ? programa.precio_usd.toLocaleString() : 'a la medida'}

Responde ÚNICAMENTE con el texto del mensaje de WhatsApp, sin comillas ni explicaciones.`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { target: OutreachTarget; programa_slug?: string }
    const { target, programa_slug } = body

    if (!target) return NextResponse.json({ error: 'target requerido' }, { status: 400 })

    const programa = programa_slug
      ? (PROGRAMAS_30X.find(p => p.slug === programa_slug) ?? sugerirPrograma(target.contacto_cargo ?? '', target.industria ?? ''))
      : sugerirPrograma(target.contacto_cargo ?? '', target.industria ?? '')

    const prompt = buildPrompt(target, programa)

    const { text } = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      prompt,
      maxOutputTokens: 400,
    })

    return NextResponse.json({
      mensaje: text.trim(),
      programa_slug: programa.slug,
      programa_nombre: programa.nombre,
    })
  } catch (err) {
    console.error('[outreach-generate]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
