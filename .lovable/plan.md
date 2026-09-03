# Controle de Cobrança — MVP (Fase 1)

App interno de validação: cadastro de clientes e cobranças, disparo de e-mails de lembrete/cobrança e um dashboard com as métricas que provam o valor do produto.

## Acesso

- Login por e-mail + senha, com backend do Lovable Cloud.
- Acesso liberado somente para `oluciano.dosantos@gmail.com`. Qualquer outro e-mail que tente entrar é bloqueado (na tela e também nas regras do banco, para não dar pra burlar pelo navegador).
- Sem cadastro público: a tela de acesso só tem login. A conta desse e-mail é criada na primeira entrada.

## Telas (uma página só, tom claro e minimalista)

**Dashboard — 4 cards no topo**
- Total a Receber: soma das cobranças não pagas
- Total em Atraso: soma das cobranças não pagas com vencimento passado
- Taxa de Recuperação: % de cobranças que ficaram atrasadas, receberam pelo menos um envio e foram pagas depois disso
- Recebido no Mês: soma das cobranças pagas dentro do mês corrente

**Lista de cobranças**: Cliente | Valor | Vencimento | Status | Última ação ("Lembrete enviado 15/09"), com ação "marcar como paga" e botão para cadastrar cobrança.

**Clientes**: cadastro simples (nome, e-mail) em modal, com lista compacta.

**Log de envios**: Data | Cliente | Tipo (Lembrete/Cobrança) | Status do envio.

## Disparo de e-mails

- Sem agendamento automático nesta fase. Um botão "Rodar cobranças agora" executa a rotina do dia, com um aviso visível de que isso é temporário durante a validação e será automatizado depois.
- Regras fixas no código: no dia do vencimento envia **lembrete**; 7 dias após o vencimento envia **cobrança atrasada**. Só para cobranças pendentes, e no máximo um envio por tipo por cobrança.
- Cada tentativa vira uma linha em envios com status enviado/falhou.
- E-mails enviados pela infraestrutura do Lovable. Antes do primeiro envio real é preciso configurar um domínio de envio — abro esse passo durante a implementação; sem ele o resto do app funciona normalmente.
- Dois modelos de e-mail em português: lembrete (tom leve) e cobrança atrasada (tom firme), com nome do cliente, valor e vencimento.

## Dados

- `clientes`: id, user_id, nome, email, criado_em
- `cobrancas`: id, user_id, cliente_id, valor, vencimento, status (pendente/pago), pago_em, criado_em
- `envios`: id, user_id, cobranca_id, tipo (lembrete/cobranca_atrasada), data_envio, status_envio (enviado/falhou)

Todos os dados ficam vinculados ao usuário dono, com regras de acesso no banco.

## Fora desta rodada (Fase 2)

WhatsApp, regras e templates configuráveis, tela de admin com funil e retenção, link de pagamento Pix/boleto, cron automático. A estrutura de dados e o código de disparo ficam organizados para receber isso depois, sem reescrita.

## Detalhes técnicos

- Lovable Cloud (Postgres + Auth) com RLS por `auth.uid()` e grants explícitos; allowlist do e-mail validada no servidor.
- Server functions do TanStack Start para leitura/escrita; a rotina de cobrança é uma server function autenticada que seleciona as cobranças elegíveis, envia via helper de e-mail gerenciado e grava os envios.
- Taxa de recuperação calculada no servidor: cobranças pagas com `pago_em` posterior ao primeiro envio e vencimento anterior ao pagamento, sobre o total de cobranças que ficaram atrasadas e receberam envio.
- Tema claro próprio em `src/styles.css` (tokens semânticos), componentes shadcn, tabelas simples e cards com borda suave.
