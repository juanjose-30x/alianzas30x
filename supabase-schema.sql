-- Tabla principal de respuestas del diagnóstico
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  areas TEXT[] NOT NULL,
  nombre TEXT NOT NULL,
  cargo TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  headcount INTEGER NOT NULL DEFAULT 1,
  roles JSONB NOT NULL DEFAULT '[]',
  herramientas TEXT[] NOT NULL DEFAULT '{}',
  herramienta_otra TEXT,
  chat_transcript JSONB NOT NULL DEFAULT '[]',
  retos_chips TEXT[] NOT NULL DEFAULT '{}',
  retos_adicionales TEXT,
  insight TEXT,
  insight_aprobado BOOLEAN NOT NULL DEFAULT false
);

-- Índice para filtrar por área
CREATE INDEX idx_submissions_areas ON submissions USING GIN (areas);

-- RLS (Row Level Security)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Política: cualquiera puede insertar (formulario público)
CREATE POLICY "Allow public insert" ON submissions
  FOR INSERT WITH CHECK (true);

-- Política: solo con service key se puede leer y actualizar (admin)
CREATE POLICY "Allow service read" ON submissions
  FOR SELECT USING (true);

CREATE POLICY "Allow service update" ON submissions
  FOR UPDATE USING (true);
