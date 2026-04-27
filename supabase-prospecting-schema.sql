-- ============================================================
-- 30X PROSPECTING + OUTREACH SCHEMA
-- Ejecutar en Supabase SQL Editor después de supabase-b2b-schema.sql
-- ============================================================

-- ── TABLA: prospectos ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prospectos (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),

  -- Origen
  source     TEXT NOT NULL CHECK (source IN ('hubspot','clay','manual')),
  source_ref TEXT,  -- id externo (HubSpot contact id, Clay row id)

  -- Empresa
  empresa         TEXT NOT NULL,
  empresa_website TEXT,
  industria       TEXT,
  empresa_size    TEXT,
  pais            TEXT DEFAULT 'Colombia',
  ciudad          TEXT,

  -- Contacto
  contacto_nombre   TEXT,
  contacto_cargo    TEXT,
  contacto_email    TEXT,
  contacto_whatsapp TEXT,   -- E.164: +573001234567
  contacto_linkedin TEXT,

  -- Contexto flexible por origen:
  -- HubSpot: { evento_asistido, fecha_evento, evento_ciudad, lifecycle_stage }
  -- Clay:    { buying_signals[], funding_stage, recent_hires[], tech_stack[] }
  -- Manual:  { notas }
  context JSONB NOT NULL DEFAULT '{}',

  -- Outreach
  outreach_status TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (outreach_status IN ('pendiente','enviado','respondio','convertido','descartado')),
  last_outreach_at TIMESTAMPTZ,

  -- Link diagnóstico asociado
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Clay run que lo generó (nullable)
  clay_search_id UUID,

  -- Notas internas
  notas_internas TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_prospectos_source_ref
  ON prospectos(source, source_ref) WHERE source_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prospectos_status   ON prospectos(outreach_status);
CREATE INDEX IF NOT EXISTS idx_prospectos_source   ON prospectos(source);
CREATE INDEX IF NOT EXISTS idx_prospectos_empresa  ON prospectos(LOWER(empresa));
CREATE INDEX IF NOT EXISTS idx_prospectos_lead     ON prospectos(lead_id);

CREATE OR REPLACE FUNCTION update_prospectos_ts()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER prospectos_ts BEFORE UPDATE ON prospectos
  FOR EACH ROW EXECUTE FUNCTION update_prospectos_ts();

ALTER TABLE prospectos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prospectos_all" ON prospectos USING (true) WITH CHECK (true);


-- ── TABLA: outreach_log ──────────────────────────────────────
-- Un registro por cada acción de outreach (generar, copiar, abrir WA, etc.)
CREATE TABLE IF NOT EXISTS outreach_log (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Referencia al contacto (uno de los dos)
  lead_id      UUID REFERENCES leads(id)      ON DELETE CASCADE,
  prospecto_id UUID REFERENCES prospectos(id) ON DELETE CASCADE,

  programa_ofrecido TEXT,    -- slug del programa: 'ai-sales', 'ai-for-executives', etc.
  mensaje           TEXT NOT NULL,
  action            TEXT NOT NULL CHECK (action IN ('generated','copied','opened_wa','sent_api')),
  channel           TEXT NOT NULL DEFAULT 'whatsapp',
  sent_by           TEXT NOT NULL,  -- email del usuario que disparó

  -- Snapshot del contexto usado (para auditoría)
  context_snapshot JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_outreach_log_lead      ON outreach_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_outreach_log_prospecto ON outreach_log(prospecto_id);
CREATE INDEX IF NOT EXISTS idx_outreach_log_created   ON outreach_log(created_at DESC);

ALTER TABLE outreach_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "outreach_log_all" ON outreach_log USING (true) WITH CHECK (true);


-- ── TABLA: clay_searches ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS clay_searches (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT NOT NULL,

  criteria   JSONB NOT NULL,  -- criterios completos del formulario
  status     TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (status IN ('pendiente','corriendo','completado','fallido','cancelado')),

  clay_run_ref        TEXT,
  empresas_encontradas  INTEGER DEFAULT 0,
  contactos_encontrados INTEGER DEFAULT 0,
  credits_estimados   INTEGER,
  credits_gastados    INTEGER,
  error_message       TEXT,
  raw_response        JSONB,
  finished_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_clay_searches_status  ON clay_searches(status);
CREATE INDEX IF NOT EXISTS idx_clay_searches_created ON clay_searches(created_at DESC);

ALTER TABLE clay_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clay_searches_all" ON clay_searches USING (true) WITH CHECK (true);

-- Agregar FK de prospectos → clay_searches ahora que la tabla existe
ALTER TABLE prospectos
  ADD CONSTRAINT fk_prospectos_clay_search
  FOREIGN KEY (clay_search_id) REFERENCES clay_searches(id) ON DELETE SET NULL;
