import { notFound } from 'next/navigation'
import { getLeadBySlug } from '@/lib/b2b-supabase'

export default async function SlugLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const lead = await getLeadBySlug(slug)
  if (!lead) notFound()
  return <>{children}</>
}
