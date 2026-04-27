// HubSpot Private App API client

const BASE = 'https://api.hubapi.com'

function headers() {
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN
  if (!token || token === 'your_private_app_token_here') {
    throw new Error('HUBSPOT_PRIVATE_APP_TOKEN no está configurado en las variables de entorno')
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export type HubSpotContact = {
  id: string
  properties: Record<string, string | null>
}

type HubSpotPage = {
  results: HubSpotContact[]
  paging?: { next?: { after: string } }
}

const STANDARD_PROPS = [
  'firstname', 'lastname', 'email', 'phone', 'mobilephone',
  'jobtitle', 'company', 'industry', 'country', 'city', 'website',
  'lifecyclestage', 'hs_lead_status', 'programas_30x',
  'luma_event_source', 'luma_event_date', 'luma_attended',
  'program_end_date', 'fecha_inscripcion_clase_gratis', 'first_conversion_event_name',
]

// Search contacts using HubSpot search API (supports filters)
export async function searchContacts(opts: {
  extraProps?: string[]
  filterProperty?: string
  filterOperator?: string   // HAS_PROPERTY, EQ, NEQ, CONTAINS, etc.
  filterValue?: string      // required for EQ/NEQ/CONTAINS operators
  maxContacts?: number
}): Promise<HubSpotContact[]> {
  const { extraProps = [], filterProperty, filterOperator = 'HAS_PROPERTY', filterValue, maxContacts = 10000 } = opts
  const props = [...new Set([...STANDARD_PROPS, ...extraProps])]
  const all: HubSpotContact[] = []
  let after = 0

  const filter = filterProperty
    ? {
        filterGroups: [{
          filters: [{
            propertyName: filterProperty,
            operator: filterOperator,
            ...(filterValue ? { value: filterValue } : {}),
          }]
        }],
      }
    : {}

  while (all.length < maxContacts) {
    const payload = { ...filter, properties: props, limit: 100, after }
    const res = await fetch(`${BASE}/crm/v3/objects/contacts/search`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`HubSpot API error ${res.status}: ${text}`)
    }

    const page: HubSpotPage & { total?: number } = await res.json()
    all.push(...page.results)

    const nextAfter = page.paging?.next?.after
    if (!nextAfter) break
    after = parseInt(nextAfter)
  }

  return all.slice(0, maxContacts)
}

// Fetch ALL contacts via List API (no 10k limit, cursor-based pagination)
// Use this instead of searchContacts when you need the full CRM
export async function listAllContacts(extraProps: string[] = []): Promise<HubSpotContact[]> {
  const props = [...new Set([...STANDARD_PROPS, ...extraProps])]
  const all: HubSpotContact[] = []
  let after: string | undefined

  while (true) {
    const url = new URL(`${BASE}/crm/v3/objects/contacts`)
    url.searchParams.set('limit', '100')
    url.searchParams.set('properties', props.join(','))
    if (after) url.searchParams.set('after', after)

    const res = await fetch(url.toString(), { headers: headers() })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`HubSpot API error ${res.status}: ${text}`)
    }

    const page: HubSpotPage = await res.json()
    all.push(...page.results)

    const nextAfter = page.paging?.next?.after
    if (!nextAfter) break
    after = nextAfter
  }

  return all
}

// Fetch contact custom properties metadata (to let user pick the event property)
export type HubSpotProperty = {
  name: string
  label: string
  type: string
  groupName: string
}

export async function fetchContactProperties(): Promise<HubSpotProperty[]> {
  const res = await fetch(`${BASE}/crm/v3/properties/contacts`, { headers: headers() })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HubSpot API error ${res.status}: ${text}`)
  }
  const data = await res.json() as { results: HubSpotProperty[] }
  // Return only enumeration and string types, exclude internal hs_ props (too many)
  return data.results.filter(p =>
    (p.type === 'string' || p.type === 'enumeration' || p.type === 'date') &&
    !p.name.startsWith('hs_') &&
    !p.name.startsWith('hubspot_')
  )
}

// Verify the token works at all
export async function verifyToken(): Promise<{ valid: boolean; portalId?: number; error?: string }> {
  try {
    const res = await fetch(`${BASE}/integrations/v1/me`, { headers: headers() })
    if (!res.ok) return { valid: false, error: `HTTP ${res.status}` }
    const data = await res.json() as { portalId: number }
    return { valid: true, portalId: data.portalId }
  } catch (e) {
    return { valid: false, error: String(e) }
  }
}
