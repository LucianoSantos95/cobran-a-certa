CREATE OR REPLACE FUNCTION public.is_allowed_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(coalesce((auth.jwt() ->> 'email'), '')) = 'oluciano.dosantos@gmail.com'
$$;

CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.cobrancas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
  vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','pago')),
  pago_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.envios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cobranca_id UUID NOT NULL REFERENCES public.cobrancas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('lembrete','cobranca_atrasada')),
  data_envio TIMESTAMPTZ NOT NULL DEFAULT now(),
  status_envio TEXT NOT NULL CHECK (status_envio IN ('enviado','falhou')),
  erro TEXT
);

CREATE INDEX idx_cobrancas_user ON public.cobrancas(user_id, status, vencimento);
CREATE INDEX idx_envios_cobranca ON public.envios(cobranca_id);
CREATE UNIQUE INDEX idx_envios_unico_por_tipo ON public.envios(cobranca_id, tipo) WHERE status_envio = 'enviado';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cobrancas TO authenticated;
GRANT ALL ON public.cobrancas TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.envios TO authenticated;
GRANT ALL ON public.envios TO service_role;

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.envios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clientes_owner" ON public.clientes FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_allowed_user())
  WITH CHECK (auth.uid() = user_id AND public.is_allowed_user());

CREATE POLICY "cobrancas_owner" ON public.cobrancas FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_allowed_user())
  WITH CHECK (auth.uid() = user_id AND public.is_allowed_user());

CREATE POLICY "envios_owner" ON public.envios FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_allowed_user())
  WITH CHECK (auth.uid() = user_id AND public.is_allowed_user());