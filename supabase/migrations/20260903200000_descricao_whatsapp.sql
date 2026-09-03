-- Descrição/referência na cobrança (ex.: "Projeto site", "NF 042") e
-- WhatsApp do cliente (para o envio assistido via wa.me).
ALTER TABLE public.cobrancas ADD COLUMN IF NOT EXISTS descricao TEXT NOT NULL DEFAULT '';
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS whatsapp TEXT NOT NULL DEFAULT '';
