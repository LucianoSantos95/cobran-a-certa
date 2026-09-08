CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text NOT NULL,
  mensagem text NOT NULL,
  status text NOT NULL DEFAULT 'aberto',
  resposta_admin text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tickets_user_id_idx ON public.tickets(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tickets_select_own_or_admin" ON public.tickets;
CREATE POLICY "tickets_select_own_or_admin" ON public.tickets
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'oluciano.dosantos@gmail.com');

DROP POLICY IF EXISTS "tickets_insert_own" ON public.tickets;
CREATE POLICY "tickets_insert_own" ON public.tickets
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tickets_update_own_or_admin" ON public.tickets;
CREATE POLICY "tickets_update_own_or_admin" ON public.tickets
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'oluciano.dosantos@gmail.com')
  WITH CHECK (auth.uid() = user_id OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'oluciano.dosantos@gmail.com');

CREATE OR REPLACE FUNCTION public.update_atualizado_em()
RETURNS TRIGGER AS $$ BEGIN NEW.atualizado_em = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS tickets_set_atualizado_em ON public.tickets;
CREATE TRIGGER tickets_set_atualizado_em BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_atualizado_em();