-- Por cliente: incluir (ou não) nas cobranças automáticas por e-mail.
-- Ligado por padrão; quando desligado, "Rodar cobranças" e "Próximos envios"
-- ignoram esse cliente e o prestador cuida dele na mão.
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS envio_automatico BOOLEAN NOT NULL DEFAULT true;
