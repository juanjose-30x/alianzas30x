import { getAllLeads } from '@/lib/b2b-supabase'
import PipelineClient from './PipelineClient'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  let leads: Awaited<ReturnType<typeof getAllLeads>> = []
  try {
    leads = await getAllLeads()
  } catch (e) {
    console.error('[Pipeline] Error loading leads:', e)
  }
  return <PipelineClient leads={leads} />
}
