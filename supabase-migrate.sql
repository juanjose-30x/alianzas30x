-- Agrega columnas nuevas si no existen (seguro correr múltiples veces)
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS roles JSONB NOT NULL DEFAULT '[]';
