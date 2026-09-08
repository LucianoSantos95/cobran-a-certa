ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS descricao TEXT NOT NULL DEFAULT '';
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS whatsapp TEXT NOT NULL DEFAULT '';
ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS frequencia TEXT NOT NULL DEFAULT 'unica';
DO $$ BEGIN
  ALTER TABLE public.cobrancas ADD CONSTRAINT cobrancas_frequencia_check CHECK (frequencia IN ('unica','semanal','quinzenal','mensal'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;