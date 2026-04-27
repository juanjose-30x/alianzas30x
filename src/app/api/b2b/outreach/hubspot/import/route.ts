import { NextRequest, NextResponse } from 'next/server'
import { upsertProspectos } from '@/lib/outreach-supabase'
import type { Prospecto, HubspotContext } from '@/lib/prospecting-types'

// HubSpot CSV column aliases (handles different export formats)
const COL = {
  email:      ['email', 'correo', 'e-mail', 'email address'],
  first_name: ['first name', 'nombre', 'firstname', 'first_name'],
  last_name:  ['last name', 'apellido', 'lastname', 'last_name'],
  company:    ['company', 'empresa', 'company name', 'organization'],
  job_title:  ['job title', 'cargo', 'title', 'jobtitle', 'job_title', 'position'],
  phone:      ['phone', 'phone number', 'mobile', 'whatsapp', 'teléfono', 'telefono', 'celular'],
  industry:   ['industry', 'industria', 'sector'],
  country:    ['country', 'país', 'pais', 'country/region'],
  city:       ['city', 'ciudad', 'city/town'],
  website:    ['website', 'sitio web', 'company website', 'website url', 'web'],
  event:      ['event', 'evento', 'event attended', 'evento asistido', 'evento_asistido', 'last_event'],
  event_date: ['event date', 'fecha evento', 'event_date', 'fecha_evento', 'date of event'],
  lifecycle:  ['lifecycle stage', 'lifecycle_stage', 'etapa', 'stage'],
  linkedin:   ['linkedin', 'linkedin url', 'linkedin_url', 'contacto linkedin'],
}

function findCol(headers: string[], aliases: string[]): number {
  const normalized = headers.map(h => h.trim().toLowerCase())
  for (const alias of aliases) {
    const idx = normalized.findIndex(h => h === alias.toLowerCase())
    if (idx !== -1) return idx
  }
  return -1
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean)
  if (lines.length < 2) return { headers: [], rows: [] }

  const parse = (line: string): string[] => {
    const result: string[] = []
    let cur = ''
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
        else inQuote = !inQuote
      } else if (ch === ',' && !inQuote) {
        result.push(cur.trim()); cur = ''
      } else {
        cur += ch
      }
    }
    result.push(cur.trim())
    return result
  }

  const headers = parse(lines[0])
  const rows = lines.slice(1).map(parse)
  return { headers, rows }
}

function normalizePhone(raw: string): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 7) return null
  // If no country code prefix, assume Colombia (+57)
  if (digits.startsWith('57') && digits.length >= 11) return `+${digits}`
  if (digits.length === 10 && !raw.startsWith('+')) return `+57${digits}`
  return `+${digits}`
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const text = await file.text()
    const { headers, rows } = parseCSV(text)
    if (!headers.length) return NextResponse.json({ error: 'CSV vacío o inválido' }, { status: 400 })

    // Map column indices
    const ci = {
      email:      findCol(headers, COL.email),
      first_name: findCol(headers, COL.first_name),
      last_name:  findCol(headers, COL.last_name),
      company:    findCol(headers, COL.company),
      job_title:  findCol(headers, COL.job_title),
      phone:      findCol(headers, COL.phone),
      industry:   findCol(headers, COL.industry),
      country:    findCol(headers, COL.country),
      city:       findCol(headers, COL.city),
      website:    findCol(headers, COL.website),
      event:      findCol(headers, COL.event),
      event_date: findCol(headers, COL.event_date),
      lifecycle:  findCol(headers, COL.lifecycle),
      linkedin:   findCol(headers, COL.linkedin),
    }

    const get = (row: string[], idx: number) => (idx !== -1 ? row[idx] ?? '' : '').trim()

    const prospectos: Omit<Prospecto, 'id' | 'created_at' | 'updated_at'>[] = []

    for (const row of rows) {
      const company = get(row, ci.company)
      if (!company) continue  // empresa is required

      const email = get(row, ci.email)
      const firstName = get(row, ci.first_name)
      const lastName = get(row, ci.last_name)
      const contactName = [firstName, lastName].filter(Boolean).join(' ') || null
      const phone = normalizePhone(get(row, ci.phone))
      const evento = get(row, ci.event)
      const eventDate = get(row, ci.event_date)
      const lifecycle = get(row, ci.lifecycle)

      const context: HubspotContext = {}
      if (evento) context.evento_asistido = evento
      if (eventDate) context.luma_event_date = eventDate
      if (lifecycle) context.lifecycle_stage = lifecycle

      prospectos.push({
        source: 'hubspot',
        source_ref: email || null,         // email = unique ref for HubSpot contacts
        empresa: company,
        empresa_website: get(row, ci.website) || null,
        industria: get(row, ci.industry) || null,
        empresa_size: null,
        pais: get(row, ci.country) || null,
        ciudad: get(row, ci.city) || null,
        contacto_nombre: contactName,
        contacto_cargo: get(row, ci.job_title) || null,
        contacto_email: email || null,
        contacto_whatsapp: phone,
        contacto_linkedin: get(row, ci.linkedin) || null,
        context,
        outreach_status: 'pendiente',
        last_outreach_at: null,
        lead_id: null,
        clay_search_id: null,
        notas_internas: null,
      })
    }

    if (!prospectos.length) {
      return NextResponse.json({ error: 'No se encontraron filas válidas (se requiere columna "empresa" o "company")' }, { status: 400 })
    }

    const result = await upsertProspectos(prospectos)

    return NextResponse.json({
      total: prospectos.length,
      ...result,
      columns_detected: Object.fromEntries(
        Object.entries(ci).filter(([, v]) => v !== -1).map(([k, v]) => [k, headers[v]])
      ),
    })
  } catch (err) {
    console.error('[hubspot-import]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
