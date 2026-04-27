import { getAllEvents } from '@/lib/events-supabase'
import { getAllLeads } from '@/lib/b2b-supabase'
import { CalendarioClient } from './CalendarioClient'

export const dynamic = 'force-dynamic'

export default async function CalendarioPage() {
  const [events, leadsRaw] = await Promise.all([
    getAllEvents().catch(() => []),
    getAllLeads().catch(() => []),
  ])

  const leads = leadsRaw.map(l => ({
    id:     l.id,
    slug:   l.slug,
    empresa: l.empresa,
    status: l.status,
  }))

  return <CalendarioClient initialEvents={events} leads={leads} />
}
