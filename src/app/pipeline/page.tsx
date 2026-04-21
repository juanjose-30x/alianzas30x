import { getAllLeads } from '@/lib/b2b-supabase'
import PipelineClient from './PipelineClient'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const leads = await getAllLeads()
  return <PipelineClient leads={leads} />
}
