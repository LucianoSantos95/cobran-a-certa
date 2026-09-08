-- Chamados de suporte. Qualquer usuário autenticado abre o próprio; o dono
-- acompanha o status; só o admin lê todos e marca como concluído.
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'concluido')),
  resposta_admin TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tickets_insert_own" ON public.tickets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tickets_read" ON public.tickets FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'oluciano.dosantos@gmail.com'
  );

CREATE POLICY "tickets_update_admin" ON public.tickets FOR UPDATE TO authenticated
  USING (lower(coalesce(auth.jwt() ->> 'email', '')) = 'oluciano.dosantos@gmail.com')
  WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) = 'oluciano.dosantos@gmail.com');
