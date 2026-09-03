# Cobrança Certa

Controle de Cobrança (Projeto Completo)

Quero construir um app SaaS chamado "Controle de Cobrança", focado em
PMEs e prestadores de serviço avulso no Brasil que sofrem com clientes
que atrasam pagamento. Ferramentas como Superlógica, Vindi e Asaas
servem negócio de assinatura recorrente — o meu produto é pra quem
cobra por projeto/serviço pontual, não recorrente.

Este documento descreve a visão completa do produto. Nem tudo aqui
deve ser construído agora — cada seção está marcada com
**[CONSTRUIR AGORA]** ou **[FASE 2 — NÃO CONSTRUIR AGORA]**. Construa
somente o que estiver marcado como AGORA nesta primeira rodada.

## Acesso — restrição temporária [CONSTRUIR AGORA]

Nesta fase de validação, o acesso ao app inteiro deve ser restrito
somente ao e-mail **oluciano.dosantos@gmail.com**. Não abrir cadastro
público ainda — é uso interno, só pra validar a estrutura antes de
liberar pra qualquer usuário externo.

## O que o produto faz

Automatiza o lembrete de cobrança por WhatsApp e e-mail, num tom que
evolui (lembrete leve → firme → final) conforme o atraso aumenta, pra
que o prestador não precise redigir e mandar essas mensagens na mão.

## Modelo de dados

**[CONSTRUIR AGORA]**
- **clientes**: id, nome, email, criado_em
- **cobrancas**: id, cliente_id, valor, vencimento, status (pendente/
  pago), pago_em (data em que foi marcado como pago — usada pra
  calcular se o pagamento veio depois de um lembrete), criado_em
- **envios**: id, cobranca_id, tipo (lembrete/cobranca_atrasada),
  data_envio, status_envio (enviado/falhou)

**[FASE 2 — NÃO CONSTRUIR AGORA]**
- **clientes**: adicionar campo whatsapp
- **regras_cobranca**: id, gatilho (ex: -3 dias, no dia, +1 dia, +7
  dias), canal (whatsapp/email), template_id — regras configuráveis
  pelo usuário, hoje ficam fixas no código
- **templates_mensagem**: id, estagio (lembrete leve/firme/final),
  texto editável pelo usuário — hoje o texto fica fixo no código

## Fluxo principal

**[CONSTRUIR AGORA]**
1. Usuário cadastra cliente (nome, e-mail)
2. Usuário cadastra cobrança (cliente, valor, vencimento)
3. Job agendado roda 1x por dia: dispara **lembrete** no dia do
   vencimento (se pendente), dispara **cobrança** 7 dias após o
   vencimento (se ainda pendente) — regras fixas, não configuráveis
   nesta fase
4. Envio é registrado na tabela de envios
5. Quando o cliente paga, o usuário marca a cobrança como paga
   (`pago_em` é preenchido) — o ciclo de disparo pra aquela cobrança
   para

**[FASE 2 — NÃO CONSTRUIR AGORA]**
- Motor de regras configurável (usuário define os próprios gatilhos)
- Templates de mensagem editáveis pelo usuário

## Canais de envio

**[CONSTRUIR AGORA]**
- **E-mail**: via Resend

**[FASE 2 — NÃO CONSTRUIR AGORA]**
- **WhatsApp**: via Z-API ou Evolution API (não é a API oficial do
  WhatsApp Business — mais barato e rápido de configurar; migrar pra
  API oficial só se o produto crescer)

## Telas — área do usuário

**[CONSTRUIR AGORA] Dashboard** (4 cards no topo):
- Total a Receber (soma do valor de cobranças com status ≠ pago)
- Total em Atraso (soma do valor de cobranças vencidas com status ≠
  pago)
- Taxa de Recuperação (% de cobranças que ficaram atrasadas E foram
  pagas depois de receber pelo menos um lembrete — não é só "quanto
  entrou", é "quanto o lembrete ajudou a recuperar")
- Recebido no Mês (soma de cobranças pagas dentro do mês corrente)

**[CONSTRUIR AGORA] Lista de cobranças**: tabela com Cliente | Valor |
Vencimento | Status | Última ação (ex: "Lembrete enviado 15/09")

**[CONSTRUIR AGORA] Log de envios**: tabela com Data | Cliente | Tipo
(Lembrete/Cobrança) | Status do envio

**[FASE 2 — NÃO CONSTRUIR AGORA] Configurações**: onde o usuário edita
as regras de cobrança e os templates de mensagem por estágio

## Tela de admin (visão de operação, não de um cliente específico)

**[FASE 2 — NÃO CONSTRUIR AGORA]** — só entra depois que o MVP validar
com uso real. Quando construída, deve seguir a mesma restrição de
acesso do topo do documento: visível somente pra
oluciano.dosantos@gmail.com, nunca pra usuário comum.

Funil visual no topo, com número e % de queda em cada etapa:
Visita ao template Notion → Lead capturado → Conta criada → Cliente
cadastrado → Cobrança cadastrada

Cards abaixo do funil:
- **Ativação**: % de leads que cadastraram pelo menos 1 cobrança;
  tempo médio entre criar conta e cadastrar a primeira cobrança
- **Uso agregado**: total de cobranças na plataforma; usuários ativos
  na semana; média de cobranças por usuário ativo
- **Saúde de envio**: total de e-mails/mensagens disparados; taxa de
  falha de envio; distribuição por tipo de mensagem
- **Taxa de recuperação agregada**: mesma fórmula da tela do usuário,
  somando todos os usuários da base — essa é a métrica que prova o
  produto e pode virar prova social depois
- **Retenção**: % de usuários ativados na semana 1 que continuam
  ativos na semana 3

## Fase 2 — outros itens (não construir agora, só deixar espaço na arquitetura)

- Link de pagamento (Pix/boleto) embutido direto na mensagem de
  cobrança, fechando o ciclo sem o cliente sair da conversa

## Estilo visual

**[CONSTRUIR AGORA]** Clean, minimalista, tom claro — mesma linha
visual do Hub Central (cards com bordas suaves, tipografia direta, sem
exagero de cor). Interface simples, cabe numa página só (dashboard +
as duas tabelas), sem navegação complexa nesta fase.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/919d28d9-0477-4e31-b1ef-b2cec78bd290).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
