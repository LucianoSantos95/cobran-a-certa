# Subdomínio de envio: `cobrancadireta.appfocus.com.br`

## Um ponto antes de começar

Consultei o DNS agora: **`appfocus.com.br` não aparece como registrado** (a consulta volta vazia direto no Registro.br). Ou seja, hoje não dá para criar um subdomínio nele.

Também conferi o `focusinteligente.com.br`, que é seu e está na Hostinger: o registro de verificação (TXT) já está publicado corretamente; **falta só a delegação NS do subdomínio** — por isso o e-mail nunca saiu. Não era um problema de escolha de nome.

Então há dois caminhos. Escolha um e eu sigo.

## Caminho A — registrar o appfocus.com.br (o nome que você quer)

1. Registrar `appfocus.com.br` no Registro.br (ou em qualquer registrador brasileiro).
2. Apontar o domínio para um provedor de DNS onde você consiga criar registros (Hostinger e Cloudflare servem).
3. Eu cadastro `cobrancadireta.appfocus.com.br` como remetente no projeto e te passo os registros exatos.
4. Você adiciona no painel do DNS:
   - 1 registro **TXT** de verificação, no domínio raiz.
   - 2 registros **NS** com o nome `cobrancadireta`, apontando para os dois servidores que eu te informar.
5. Eu confirmo a verificação e faço o teste de envio.

Prazo: depende do registro do domínio (algumas horas) mais a propagação do DNS.

## Caminho B — usar o domínio que você já tem (mais rápido, hoje)

Usar `cobrancadireta.focusinteligente.com.br`. Passo a passo no painel da Hostinger:

1. Hostinger → **Domínios** → `focusinteligente.com.br` → **Zona DNS**.
2. Adicionar **duas** linhas (eu te passo os valores exatos assim que criar o remetente no projeto):

| Tipo | Nome | Aponta para |
|---|---|---|
| NS | `cobrancadireta` | (servidor 1 que eu informar) |
| NS | `cobrancadireta` | (servidor 2 que eu informar) |

3. Manter o registro TXT de verificação que eu indicar (o atual já está lá).
4. Apagar qualquer outro registro com o nome `cobrancadireta` (A, CNAME ou MX), pois conflita com a delegação.

Prazo: normalmente de 15 minutos a algumas horas.

## O que eu faço depois, nos dois casos

1. Confiro na internet se os registros já estão publicados.
2. Confirmo a verificação do remetente no projeto.
3. Volto os e-mails de conta para a identidade do Cobrança Certa (hoje estão no remetente padrão da plataforma).
4. Ajusto o remetente do app para o novo endereço.
5. Crio um cliente de teste, disparo uma cobrança real para `oluciano.dosantos@gmail.com` e confiro no histórico se saiu como enviada.
6. Apago os dados de teste.

## Detalhes técnicos

- Consulta DNS-over-HTTPS: `appfocus.com.br` retorna NXDOMAIN com SOA de `com.br` (não delegado/não registrado); `focusinteligente.com.br` usa `ns1/ns2.dns-parking.com` (Hostinger), TXT `_lovable-email` presente e correto, `NS notify.*` ausente.
- A plataforma delega a zona do subdomínio via NS e passa a gerenciar SPF/DKIM/MX dentro dela.
- Ajuste de código no fim: `SENDER_DOMAIN` e `FROM_DOMAIN` em `src/lib/email-templates/send-email.ts` e as constantes equivalentes em `src/routes/lovable/email/auth/webhook.ts`.
- Reativação dos e-mails de conta com a marca do app via `toggle_project_emails` (`enabled: true`) após a verificação.
