// Migration: Tugó submissions → lead_submissions
// Run: node scripts/migrate-tugo.mjs

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const TEST_EMAILS = ['administracionsales@30x.com', 'juanjose@30x.com']

async function run() {
  console.log('▶ Iniciando migración Tugó...\n')

  // 1. Crear lead de Tugó (si no existe)
  const { data: existing } = await supabase.from('leads').select('id').eq('slug', 'tugo').single()

  let leadId

  if (existing) {
    console.log('✓ Lead Tugó ya existe, usando el existente:', existing.id)
    leadId = existing.id
  } else {
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        slug: 'tugo',
        empresa: 'Tugó',
        industria: 'Retail / Muebles y Decoración',
        pais: 'Colombia',
        status: 'diagnostico_completo',
        diagnostico_activo: false,
        discovery_data: {
          areas_identificadas: ['ventas', 'logistica', 'mercadeo', 'visual', 'tecnologia',
            'seguridad', 'financiero', 'gestion-humana', 'compras', 'proyectos',
            'sac', 'presidencia', 'operaciones', 'comercial'],
          roles_mencionados: [],
          headcount_estimado: 0,
          pain_points: [],
          herramientas_actuales: [],
          decision_makers: [],
          senales_presupuesto: 'desconocido',
          contexto_empresa: 'Empresa colombiana del sector retail de muebles y decoración.',
          notas_adicionales: 'Lead migrado desde el sistema anterior (tugo-app).',
        },
        diagnostico_config: {
          areas_preseleccionadas: ['ventas', 'logistica', 'mercadeo', 'visual', 'tecnologia',
            'seguridad', 'financiero', 'gestion-humana', 'compras', 'proyectos',
            'sac', 'presidencia', 'operaciones', 'comercial'],
          mensaje_bienvenida: '',
          nombre_empresa_display: 'Tugó',
          deadline: null,
        },
      })
      .select()
      .single()

    if (leadError) {
      console.error('✗ Error creando lead:', leadError.message)
      process.exit(1)
    }

    console.log('✓ Lead Tugó creado:', lead.id)
    leadId = lead.id
  }

  // 2. Leer submissions viejos
  const { data: submissions, error: subError } = await supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: true })

  if (subError) {
    console.error('✗ Error leyendo submissions:', subError.message)
    process.exit(1)
  }

  const filtered = (submissions ?? []).filter(
    s => !TEST_EMAILS.includes((s.email ?? '').toLowerCase())
  )

  console.log(`\n▶ ${filtered.length} submissions encontrados (${(submissions ?? []).length - filtered.length} de prueba excluidos)\n`)

  // 3. Verificar cuáles ya fueron migrados
  const { data: existing_subs } = await supabase
    .from('lead_submissions')
    .select('id')
    .eq('lead_id', leadId)

  if ((existing_subs ?? []).length > 0) {
    console.log(`⚠ Ya hay ${existing_subs.length} submissions migrados. Saltando los existentes...\n`)
  }

  // 4. Insertar en lead_submissions
  let migrated = 0
  let skipped = 0

  for (const sub of filtered) {
    // Check if already migrated (by original id stored in a field, or just insert all if fresh)
    const { error: insertError } = await supabase
      .from('lead_submissions')
      .insert({
        id: sub.id,  // preserve original ID
        lead_id: leadId,
        created_at: sub.created_at,
        areas: sub.areas ?? [],
        nombre: sub.nombre,
        cargo: sub.cargo,
        email: sub.email ?? null,
        telefono: sub.telefono ?? null,
        headcount: sub.headcount ?? 0,
        roles: sub.roles ?? [],
        herramientas: sub.herramientas ?? [],
        herramienta_otra: sub.herramienta_otra ?? null,
        chat_transcript: sub.chat_transcript ?? [],
        retos_chips: sub.retos_chips ?? [],
        retos_adicionales: sub.retos_adicionales ?? null,
        insight: sub.insight ?? null,
        insight_aprobado: sub.insight_aprobado ?? false,
      })

    if (insertError) {
      if (insertError.code === '23505') {
        // Duplicate key — already migrated
        skipped++
      } else {
        console.error(`  ✗ Error migrando ${sub.nombre}:`, insertError.message)
      }
    } else {
      console.log(`  ✓ ${sub.nombre} — ${sub.cargo}`)
      migrated++
    }
  }

  console.log(`\n✅ Migración completada`)
  console.log(`   Migrados: ${migrated}`)
  console.log(`   Ya existían: ${skipped}`)
  console.log(`\n🔗 Propuesta: alianzas30x.vercel.app/tugo/propuesta`)
}

run().catch(console.error)
