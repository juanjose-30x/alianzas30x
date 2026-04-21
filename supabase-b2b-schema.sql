-- ============================================================
-- 30X B2B MULTI-TENANT SCHEMA
-- Ejecutar en Supabase SQL Editor
-- NO modifica tablas existentes de Tugó
-- ============================================================

-- ── TABLA: leads ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),

  -- Identidad
  slug              TEXT NOT NULL UNIQUE,
  empresa           TEXT NOT NULL,
  industria         TEXT,
  pais              TEXT DEFAULT 'Colombia',
  website           TEXT,

  -- Pipeline
  status TEXT NOT NULL DEFAULT 'discovery'
    CHECK (status IN (
      'discovery',
      'diagnostico_enviado',
      'diagnostico_parcial',
      'diagnostico_completo',
      'propuesta_lista',
      'negociacion',
      'cerrado_ganado',
      'cerrado_perdido'
    )),

  -- Grain
  grain_transcript  TEXT,
  grain_parsed_at   TIMESTAMPTZ,

  -- Datos extraídos por Claude del transcript
  discovery_data JSONB NOT NULL DEFAULT '{
    "areas_identificadas": [],
    "roles_mencionados": [],
    "headcount_estimado": 0,
    "pain_points": [],
    "herramientas_actuales": [],
    "decision_makers": [],
    "senales_presupuesto": "desconocido",
    "contexto_empresa": "",
    "notas_adicionales": ""
  }',

  -- Config del formulario de diagnóstico
  diagnostico_config JSONB NOT NULL DEFAULT '{
    "areas_preseleccionadas": [],
    "mensaje_bienvenida": "",
    "nombre_empresa_display": "",
    "deadline": null
  }',

  -- Contacto principal
  contacto_nombre TEXT,
  contacto_email  TEXT,
  contacto_cargo  TEXT,
  contacto_whatsapp TEXT,

  -- Comercial
  deal_value_usd    INTEGER,
  notas_internas    TEXT,

  -- Acceso
  propuesta_password  TEXT NOT NULL DEFAULT 'propuesta30x',
  diagnostico_activo  BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_leads_slug   ON leads(slug);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_leads_updated_at();

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_service_only" ON leads USING (true);


-- ── TABLA: lead_submissions ──────────────────────────────────
-- Misma estructura que submissions de Tugó + lead_id
CREATE TABLE IF NOT EXISTS lead_submissions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT now(),

  lead_id     UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Mismo payload que submissions
  areas             TEXT[]  NOT NULL,
  nombre            TEXT    NOT NULL,
  cargo             TEXT    NOT NULL,
  email             TEXT,
  telefono          TEXT,
  headcount         INTEGER NOT NULL DEFAULT 1,
  roles             JSONB   NOT NULL DEFAULT '[]',
  herramientas      TEXT[]  NOT NULL DEFAULT '{}',
  herramienta_otra  TEXT,
  chat_transcript   JSONB   NOT NULL DEFAULT '[]',
  retos_chips       TEXT[]  NOT NULL DEFAULT '{}',
  retos_adicionales TEXT,
  insight           TEXT,
  insight_aprobado  BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_lead_submissions_lead_id ON lead_submissions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_submissions_areas   ON lead_submissions USING GIN(areas);

-- RLS: inserción pública (el form del gerente), lectura con service key
ALTER TABLE lead_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_submissions_public_insert" ON lead_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "lead_submissions_service_read" ON lead_submissions
  FOR SELECT USING (true);

CREATE POLICY "lead_submissions_service_update" ON lead_submissions
  FOR UPDATE USING (true);
