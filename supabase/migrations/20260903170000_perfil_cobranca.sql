-- Perfil de cobrança do prestador: instruções de pagamento que entram no
-- rodapé de toda mensagem enviada (chave Pix, dados bancários, etc.).
CREATE TABLE public.perfil_cobranca (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  instrucoes_pagamento TEXT NOT NULL DEFAULT '',
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.perfil_cobranca TO authenticated;
GRANT ALL ON public.perfil_cobranca TO service_role;

ALTER TABLE public.perfil_cobranca ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perfil_owner" ON public.perfil_cobranca FOR ALL TO authenticated
  USING (
    auth.uid() = user_id
    AND lower(coalesce(auth.jwt() ->> 'email', '')) = 'oluciano.dosantos@gmail.com'
  )
  WITH CHECK (
    auth.uid() = user_id
    AND lower(coalesce(auth.jwt() ->> 'email', '')) = 'oluciano.dosantos@gmail.com'
  );
