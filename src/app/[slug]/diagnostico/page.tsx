import { getLeadBySlug } from '@/lib/b2b-supabase'
import { notFound } from 'next/navigation'
import { Lock } from 'lucide-react'
import B2BDiagnosticoForm from '@/components/b2b/B2BDiagnosticoForm'

export default async function DiagnosticoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lead = await getLeadBySlug(slug)
  if (!lead) notFound()

  if (!lead.diagnostico_activo) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-6" style={{ background: '#09090b' }}>
        <div className="text-center space-y-4 max-w-sm">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <Lock size={20} style={{ color: '#71717a' }} />
          </div>
          <div>
            <p className="text-white text-lg font-bold tracking-tight">
              Formulario no disponible
            </p>
            <p className="text-sm mt-1.5" style={{ color: '#71717a' }}>
              Contacta a tu ejecutivo de 30X para más información.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <B2BDiagnosticoForm
      leadSlug={slug}
      empresa={lead.diagnostico_config.nombre_empresa_display || lead.empresa}
      areasPreseleccionadas={lead.diagnostico_config.areas_preseleccionadas}
      mensajeBienvenida={lead.diagnostico_config.mensaje_bienvenida}
      discoveryData={lead.discovery_data}
    />
  )
}
