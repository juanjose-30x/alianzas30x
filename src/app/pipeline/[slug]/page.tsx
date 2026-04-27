import { getLeadBySlug, getLeadSubmissions } from '@/lib/b2b-supabase'
import { notFound } from 'next/navigation'
import LeadDetail from './LeadDetail'

export const dynamic = 'force-dynamic'

export default async function LeadDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lead = await getLeadBySlug(slug)
  if (!lead) notFound()

  const submissions = await getLeadSubmissions(lead.id)

  return <LeadDetail lead={lead} submissions={submissions} />
}
