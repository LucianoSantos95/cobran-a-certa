-- Feedback: nome de quem enviou, nota em estrelas (1-5) e comentário opcional.
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS nome TEXT NOT NULL DEFAULT '';
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS estrelas SMALLINT
  CHECK (estrelas IS NULL OR estrelas BETWEEN 1 AND 5);

-- comentário deixa de ser obrigatório (a nota em estrelas basta)
ALTER TABLE public.feedback ALTER COLUMN mensagem DROP NOT NULL;
ALTER TABLE public.feedback ALTER COLUMN mensagem SET DEFAULT '';
