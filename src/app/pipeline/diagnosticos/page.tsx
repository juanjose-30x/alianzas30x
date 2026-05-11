import { getMinimedSubmissions, getAgriglobalSubmissions } from '@/lib/diagnosticos-supabase'
import DiagnosticosClient from './DiagnosticosClient'

export const dynamic = 'force-dynamic'

export default async function DiagnosticosPage() {
  const [minimed, agriglobal] = await Promise.all([
    getMinimedSubmissions().catch(() => []),
    getAgriglobalSubmissions().catch(() => []),
  ])
  return <DiagnosticosClient minimed={minimed} agriglobal={agriglobal} />
}
