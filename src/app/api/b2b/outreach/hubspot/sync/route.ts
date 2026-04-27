import { NextRequest, NextResponse } from 'next/server'
import { searchContacts, listAllContacts } from '@/lib/hubspot'
import { upsertProspectos } from '@/lib/outreach-supabase'
import type { Prospecto, HubspotContext } from '@/lib/prospecting-types'

function normalizePhone(raw: string | null): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 7) return null
  if (raw.startsWith('+')) return `+${digits}`
  if (digits.startsWith('57') && digits.length >= 11) return `+${digits}`
  if (digits.length === 10) return `+57${digits}`
  return `+${digits}`
}

function get(contact: Record<string, string | null>, key: string): string {
  return (contact[key] ?? '').trim()
}

const JUNK = new Set([
  'no aplica', 'no', 'no tengo', 'no tengo empresa', 'independiente',
  'emprendimiento', 'freelance', 'particular', 'persona natural', 'n/a',
  'na', '-', 'ninguna', 'ninguno', 'sin empresa', 'no tiene',
])

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      mode?: 'all' | 'customers'
    }

    const mode = body.mode ?? 'all'
    const t0 = Date.now()

    // Fetch contacts from HubSpot
    let contacts
    if (mode === 'all') {
      // List API — sin límite, recorre todo el CRM
      contacts = await listAllContacts()
    } else {
      // Sólo customers (lifecyclestage = customer)
      contacts = await searchContacts({
        filterProperty: 'lifecyclestage',
        filterOperator: 'EQ',
        filterValue: 'customer',
        maxContacts: 10000,
      })
    }

    const prospectos: Omit<Prospecto, 'id' | 'created_at' | 'updated_at'>[] = []

    for (const contact of contacts) {
      const p = contact.properties
      const company = get(p, 'company')
      if (!company || company.length < 3) continue
      if (JUNK.has(company.toLowerCase().trim())) continue

      const email = get(p, 'email')
      const firstName = get(p, 'firstname')
      const lastName = get(p, 'lastname')
      const contactName = [firstName, lastName].filter(Boolean).join(' ') || null
      const phone = normalizePhone(get(p, 'mobilephone') || get(p, 'phone'))

      const context: HubspotContext = {}

      // Programs + cohort
      if (p.programas_30x) {
        context.evento_asistido = `Programa: ${p.programas_30x}`
        if (p.program_end_date) context.program_end_date = p.program_end_date
      }

      // Luma event
      if (p.luma_event_source) {
        context.luma_event = p.luma_event_source
        if (p.luma_event_date) context.luma_event_date = p.luma_event_date
        if (p.luma_attended) context.luma_attended = p.luma_attended
      }

      // Clase gratis
      if (p.fecha_inscripcion_clase_gratis) {
        context.fecha_clase_gratis = p.fecha_inscripcion_clase_gratis
      }

      // First conversion
      if (p.first_conversion_event_name) {
        context.first_conversion = p.first_conversion_event_name
      }

      // Lifecycle
      if (p.lifecyclestage) context.lifecycle_stage = p.lifecyclestage

      prospectos.push({
        source: 'hubspot',
        source_ref: email || `hs:${contact.id}`,
        empresa: company,
        empresa_website: get(p, 'website') || null,
        industria: get(p, 'industry') || null,
        empresa_size: null,
        pais: get(p, 'country') || null,
        ciudad: get(p, 'city') || null,
        contacto_nombre: contactName,
        contacto_cargo: get(p, 'jobtitle') || null,
        contacto_email: email || null,
        contacto_whatsapp: phone,
        contacto_linkedin: null,
        context,
        outreach_status: 'pendiente',
        last_outreach_at: null,
        lead_id: null,
        clay_search_id: null,
        notas_internas: null,
      })
    }

    const result = await upsertProspectos(prospectos)
    const elapsed = Math.round((Date.now() - t0) / 1000)

    if (result.errors > 0 && result.inserted === 0 && result.duplicates === 0) {
      return NextResponse.json({
        contacts_fetched: contacts.length,
        contacts_with_company: prospectos.length,
        elapsed_seconds: elapsed,
        ...result,
        error: result.first_error ?? 'Error al insertar en Supabase',
      }, { status: 500 })
    }

    return NextResponse.json({
      contacts_fetched: contacts.length,
      contacts_with_company: prospectos.length,
      elapsed_seconds: elapsed,
      ...result,
    })
  } catch (err) {
    console.error('[hubspot-sync]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
