import { getLeadBySlug, getLeadSubmissions } from '@/lib/b2b-supabase'
import { notFound } from 'next/navigation'
import EmpresaClient from './EmpresaClient'

export const dynamic = 'force-dynamic'

export default async function EmpresaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { slug } = await params
  const { token } = await searchParams

  const lead = await getLeadBySlug(slug)
  if (!lead) notFound()

  const expectedToken = lead.diagnostico_config.client_token
  if (!expectedToken || token !== expectedToken) notFound()

  const submissions = await getLeadSubmissions(lead.id)
  const empresa = lead.diagnostico_config.nombre_empresa_display || lead.empresa

  return (
    <EmpresaClient
      slug={slug}
      token={token!}
      empresa={empresa}
      industria={lead.industria}
      submissions={submissions}
      areas={lead.discovery_data?.areas_identificadas ?? []}
    />
  )
}
