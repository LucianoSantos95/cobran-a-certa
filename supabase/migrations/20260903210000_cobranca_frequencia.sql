-- Frequência da cobrança. "unica" = pontual (padrão). Nas recorrentes, ao
-- marcar como paga o app cria automaticamente a próxima (semana / quinzena /
-- mês), sem cron.
ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS frequencia TEXT NOT NULL DEFAULT 'unica'
  CHECK (frequencia IN ('unica', 'semanal', 'quinzenal', 'mensal'));
