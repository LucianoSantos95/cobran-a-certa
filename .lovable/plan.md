# Liberar o subdomínio de envio de e-mails

## O que descobri agora

Consultei os registros do seu domínio na internet:

- O registro de verificação (TXT) **já está publicado e correto**.
- Os dois registros **NS do subdomínio `notify.focusinteligente.com.br` não existem** — é só isso que falta.
- Seu DNS está hospedado na **Hostinger** (`ns1.dns-parking.com` / `ns2.dns-parking.com`), que permite criar registros NS.

Ou seja: não é preciso trocar de subdomínio nem recomeçar. Falta só um passo no painel da Hostinger.

## O que você precisa fazer (5 minutos)

1. Entre na Hostinger → **Domínios** → `focusinteligente.com.br` → **Zona DNS / Editor de DNS**.
2. Adicione **dois** registros novos:

| Tipo | Nome | Aponta para | TTL |
|---|---|---|---|
| NS | `notify` | `ns5.lovable.cloud` | 300 (ou padrão) |
| NS | `notify` | `ns6.lovable.cloud` | 300 (ou padrão) |

Observações importantes:
- O campo Nome é só `notify` (a Hostinger completa o resto do domínio sozinha). Se o painel exigir o nome inteiro, use `notify.focusinteligente.com.br`.
- São duas linhas separadas, com o mesmo nome `notify`.
- Não apague o TXT que já está lá.
- Se existir qualquer outro registro chamado `notify` (A, CNAME, MX), apague — ele conflita com a delegação.

## O que eu faço depois

1. Confiro na internet se os dois NS já aparecem publicados.
2. Confirmo a verificação do domínio de envio no projeto.
3. Volto os e-mails de conta para a identidade do Cobrança Certa (hoje estão no remetente padrão da plataforma).
4. Crio um cliente de teste com o seu e-mail, disparo uma cobrança real para `oluciano.dosantos@gmail.com` e confiro no histórico se saiu como enviada.
5. Apago os dados de teste no final.

## Se preferir outro subdomínio

Se por algum motivo você quiser usar outro nome (por exemplo `envios.focusinteligente.com.br`), me avise: eu removo o atual, crio o novo e te passo os registros correspondentes. Mas isso não é necessário — o problema atual é apenas o NS ausente.

## Detalhes técnicos

- Verificação feita por DNS-over-HTTPS: TXT `_lovable-email.focusinteligente.com.br` retorna o token esperado; `NS notify.focusinteligente.com.br` retorna NXDOMAIN/SOA da zona pai, confirmando ausência de delegação.
- Após a delegação, a Lovable gerencia SPF/DKIM/MX dentro da zona `notify.*`.
- Nenhuma alteração de código é necessária: `SENDER_DOMAIN` em `src/lib/email-templates/send-email.ts` já é `notify.focusinteligente.com.br`.
- Reativação dos e-mails de conta com a marca do app via `toggle_project_emails` (`enabled: true`) após a verificação.
