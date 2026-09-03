-- =========================================================================
-- Perfil do usuário (nome + foto), feedback da plataforma e bucket de avatares
-- =========================================================================

-- ---- profiles -----------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- dono lê o próprio; o admin lê todos (para a tela de Operação)
CREATE POLICY "profiles_read" ON public.profiles FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'oluciano.dosantos@gmail.com'
  );

CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- cria a linha de profile em todo cadastro novo
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name',
      ''
    ),
    coalesce(new.email, '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- backfill de quem já existe
INSERT INTO public.profiles (id, nome, email)
SELECT
  id,
  coalesce(raw_user_meta_data ->> 'name', raw_user_meta_data ->> 'full_name', ''),
  coalesce(email, '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ---- feedback ---------------------------------------------------------------
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL DEFAULT '',
  mensagem TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- qualquer usuário autenticado envia o próprio feedback
CREATE POLICY "feedback_insert_own" ON public.feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- só o admin lê
CREATE POLICY "feedback_admin_read" ON public.feedback FOR SELECT TO authenticated
  USING (lower(coalesce(auth.jwt() ->> 'email', '')) = 'oluciano.dosantos@gmail.com');

-- ---- storage: bucket de avatares -----------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_owner_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_owner_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_owner_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
