import { getAllOutreachTargets } from '@/lib/outreach-supabase'
import { OutreachClient } from './OutreachClient'

export const dynamic = 'force-dynamic'

export default async function OutreachPage() {
  const targets = await getAllOutreachTargets()
  return <OutreachClient initialTargets={targets} />
}
