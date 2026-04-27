import { getLeadBySlug } from '@/lib/b2b-supabase'
import { notFound } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'

export default async function GraciasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const lead = await getLeadBySlug(slug)
  if (!lead) notFound()

  const empresa = lead.diagnostico_config.nombre_empresa_display || lead.empresa

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-6" style={{ background: '#09090b' }}>
      <div className="w-full max-w-md space-y-10">

        {/* Success moment */}
        <div className="flex flex-col items-center gap-6 text-center animate-slide-up">
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center animate-scale-in"
            style={{
              background: 'rgba(233,255,123,0.07)',
              border: '1px solid rgba(233,255,123,0.18)',
              boxShadow: 'inset 0 1px 0 rgba(233,255,123,0.1), 0 0 40px rgba(233,255,123,0.05)',
            }}
          >
            <CheckCircle2 size={26} style={{ color: '#E9FF7B' }} strokeWidth={1.5} />
          </div>

          {/* Title — cinematic scale */}
          <div className="space-y-3">
            <h1
              className="font-bold text-white"
              style={{
                fontSize: 'clamp(2rem, 6vw, 3rem)',
                letterSpacing: '-0.035em',
                lineHeight: 1.0,
                textWrap: 'balance',
              }}
            >
              Tu diagnóstico<br />
              <span style={{ color: '#E9FF7B' }}>está en camino</span>
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: '#71717a', maxWidth: '34ch', margin: '0 auto' }}>
              El equipo de 30X analiza tus respuestas de{' '}
              <span style={{ color: '#a1a1aa' }}>{empresa}</span>{' '}
              para preparar una propuesta de IA a tu medida.
            </p>
          </div>
        </div>

        {/* What happens next */}
        <div
          className="rounded-2xl p-5 space-y-4 animate-slide-up delay-2"
          style={{
            background: 'rgba(255,255,255,0.022)',
            border: '1px solid rgba(255,255,255,0.065)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <p className="text-xs" style={{ color: '#3f3f46', letterSpacing: '0.16em' }}>QUÉ PASA AHORA</p>
          <div className="space-y-4">
            {[
              {
                n: '01',
                label: 'Análisis personalizado',
                desc: 'Revisamos tus áreas, herramientas actuales y retos concretos.',
                color: '#E9FF7B',
              },
              {
                n: '02',
                label: 'Propuesta en 48 h',
                desc: 'Preparamos un plan de implementación de IA específico para tu equipo.',
                color: '#c4b5fd',
              },
              {
                n: '03',
                label: 'Reunión estratégica',
                desc: 'Conversamos sobre cómo ejecutar el plan y medimos el impacto.',
                color: '#60a5fa',
              },
            ].map(({ n, label, desc, color }) => (
              <div key={n} className="flex items-start gap-4">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    background: `${color}10`,
                    color,
                    border: `1px solid ${color}20`,
                    fontFamily: 'var(--font-geist-mono), monospace',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                  }}
                >
                  {n}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white" style={{ letterSpacing: '-0.01em' }}>{label}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#52525b' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Value signals */}
        <div className="flex items-center justify-center gap-0 animate-slide-up delay-3">
          {[
            { value: '48 h', label: 'propuesta lista' },
            { value: '100%', label: 'gratis' },
            { value: '30X', label: 'te acompaña' },
          ].map(({ value, label }, i) => (
            <div key={label} className="flex items-center">
              {i > 0 && <div className="w-px h-7 mx-6" style={{ background: 'rgba(255,255,255,0.07)' }} />}
              <div className="text-center">
                <div
                  className="font-bold tabular-nums"
                  style={{ color: '#E9FF7B', fontFamily: 'var(--font-geist-mono), monospace', fontSize: 15, letterSpacing: '-0.02em' }}
                >
                  {value}
                </div>
                <div className="text-xs mt-1" style={{ color: '#3f3f46' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs animate-fade-in delay-4" style={{ color: '#2d2d30' }}>© 30X Escuela de Negocios</p>
      </div>
    </div>
  )
}
