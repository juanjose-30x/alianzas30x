import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { NextResponse } from 'next/server'

const anthropic = createAnthropic()

export async function POST(req: Request) {
  const { empresa, website } = await req.json()

  let url = website?.trim()

  // Try to guess website from empresa name if none provided
  if (!url && empresa) {
    const slug = empresa.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]/g, '')
    url = `https://www.${slug}.com`
  }

  if (!url) return NextResponse.json({ error: 'Empresa o website requerido' }, { status: 400 })
  if (!url.startsWith('http')) url = `https://${url}`

  let pageText = ''
  let resolvedUrl = url

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
      signal: AbortSignal.timeout(8000),
    })
    resolvedUrl = res.url || url
    const html = await res.text()
    pageText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000)
  } catch {
    // If fetch fails, still try to extract with just empresa name
    pageText = `Empresa: ${empresa}`
  }

  try {
    const { text } = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      prompt: `Analiza el siguiente contenido web de una empresa y extrae información básica.

Empresa: ${empresa || 'desconocida'}
URL: ${resolvedUrl}
Contenido:
${pageText}

Extrae y responde SOLO en JSON válido con estos campos:
{
  "industria": "sector principal en 1-3 palabras (ej: Retail, Manufactura, Tecnología, Salud, Finanzas)",
  "pais": "país principal de operación (ej: Colombia, México, España)",
  "descripcion": "qué hace la empresa en máximo 15 palabras"
}

Solo el JSON, sin texto adicional.`,
    })

    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON')
    const parsed = JSON.parse(match[0])
    return NextResponse.json({ ...parsed, website: resolvedUrl })
  } catch {
    return NextResponse.json({
      industria: '',
      pais: 'Colombia',
      descripcion: '',
      website: resolvedUrl,
    })
  }
}
