# Cobrança Certa

Lembretes de cobrança por e-mail e WhatsApp para quem cobra **por projeto ou
serviço pontual** (e não por assinatura recorrente), com um tom que evolui
conforme o atraso: leve no vencimento, mais firme depois de 7 dias. O prestador
cadastra clientes e cobranças, e o sistema cuida de lembrar e de registrar o
que foi enviado.

> **Status:** protótipo funcional, pausado como SaaS. Em setembro de 2026 a
> decisão foi entregar o produto como um **sistema duplicável no Notion**
> (gratuito, no [Hub Central](https://app.focusinteligente.com.br)). Este
> repositório documenta a versão web e fica como referência técnica.

Parte do ecossistema [Focus Inteligente](https://focusinteligente.com.br).

## O que o app faz

- Cadastro de clientes e de cobranças (valor, vencimento, descrição, frequência
  única, semanal, quinzenal ou mensal; ao marcar uma recorrente como paga, gera
  a próxima).
- Régua de estágios: **lembrete** no vencimento (até 6 dias de atraso) e
  **cobrança** firme a partir de 7 dias.
- Envio por e-mail (Resend) com instruções de pagamento no rodapé, e botão de
  WhatsApp por linha que abre a conversa com a mensagem já escrita no tom do
  estágio.
- Envio automático ligável ou desligável por cliente; rotina diária que decide
  o que enviar e mostra o que a próxima rodada vai disparar.
- Histórico de envios e painel com valores a receber, atrasados e recebidos.
- Multiusuário, com isolamento por usuário no banco (RLS). A tela de admin com
  métricas agregadas da base é restrita ao dono.
- Chamados de suporte e feedback com nota dentro do app.

## Stack

TanStack Start (React 19, TanStack Router e server functions), Vite 8, Tailwind
CSS 4, Supabase (Postgres, autenticação e storage), Resend para e-mail,
Recharts e Framer Motion. A build gera um worker para Cloudflare (Nitro).
Construído com a plataforma Lovable.

## Decisões que valem registrar

- **Datas no fuso de São Paulo** (`src/lib/datas.ts`). O vencimento é um dia, não
  um instante; usar UTC "vira o dia" por volta das 21h e erra o atraso.
- **Valores em Real digitados à mão** (`src/lib/moeda.ts`): aceita `1.500,00`,
  `1500,00`, `R$ 1.500,00` e `1500.00`, e o campo usa máscara "centavos
  primeiro".
- **Regras de cobrança no servidor**, em server functions
  (`src/lib/cobranca.functions.ts`), com a mesma régua usada para montar a
  mensagem de WhatsApp (`src/lib/whatsapp.ts`).

## Estrutura

```
src/
  routes/        rotas (file-based): auth, painel, configurações, suporte, admin
  lib/           regras de negócio, server functions e templates de e-mail
  components/    layout, ui (shadcn) e magicui (animações)
  integrations/  clientes do Supabase e da Lovable
supabase/
  migrations/    esquema do banco
docs/
  ESCOPO-ORIGINAL.md   visão e escopo original do produto
```

## Rodando localmente

Pré-requisitos: Node 20+ (ou Bun) e um projeto Supabase.

```bash
bun install        # ou: npm install
cp .env.example .env
bun run dev        # ou: npm run dev
```

O `.env` versionado contém apenas as chaves **públicas** do Supabase (URL e
chave publishable), como explicado no `.gitignore`. Segredos de servidor
(`LOVABLE_API_KEY` para o envio de e-mail e `LOVABLE_CRON_SECRET` para a rotina
diária) são configurados no painel e nunca entram no repositório.

## Scripts

| Comando | O que faz |
|---|---|
| `bun run dev` | servidor de desenvolvimento |
| `bun run build` | build de produção |
| `bun run test` | testes das regras de negócio |
| `bun run lint` | ESLint com Prettier |
| `bun run format` | formata o código |

## Testes

Cobrem as funções puras onde um erro custa dinheiro ou cobra a pessoa errada:
conversão e máscara de valores (`moeda.test.ts`), datas e dias de atraso no
fuso de São Paulo, incluindo a virada perto da meia-noite (`datas.test.ts`), e a
normalização de telefone e o tom da mensagem de WhatsApp por estágio de atraso
(`whatsapp.test.ts`).

## Documentação

- [`docs/ESCOPO-ORIGINAL.md`](docs/ESCOPO-ORIGINAL.md): visão e escopo originais
  do produto, escritos como briefing para a construção na Lovable.
