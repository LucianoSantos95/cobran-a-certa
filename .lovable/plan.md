# Liberar o envio de e-mails: seu painel não permite registros NS

## O problema, em uma frase

O envio de e-mails exige que o subdomínio seja **delegado** por dois registros do tipo **NS** — e a lista de tipos do seu painel (A, MX, AAAA, CNAME, SRV, TXT, CAA) não inclui NS. Sem NS, a verificação nunca conclui, por mais que você espere.

Não adianta substituir por CNAME ou A: só o NS delega a zona.

## Duas saídas. Escolha uma.

### Saída 1 — Mover o DNS do `focusinteligente.com.br` para a Cloudflare (grátis, recomendada)

O domínio continua registrado onde está; muda só quem responde pelo DNS.

1. Criar conta grátis na Cloudflare e clicar em **Add a site** → digitar `focusinteligente.com.br`.
2. A Cloudflare importa sozinha os registros atuais. **Confira a lista** com o painel atual aberto ao lado, especialmente os registros de site e de e-mail (A, CNAME, MX, TXT) — se faltar algum, adicione manualmente antes de seguir.
3. A Cloudflare mostra dois nameservers (algo como `xxx.ns.cloudflare.com`).
4. No seu registrador atual, trocar os nameservers do domínio por esses dois.
5. Aguardar a Cloudflare marcar o domínio como ativo (costuma levar de minutos a algumas horas).
6. Me avisar. Eu cadastro `cobrancadireta.focusinteligente.com.br` como remetente e te passo os registros exatos — aí você adiciona na Cloudflare, que aceita NS sem problema.

Risco a considerar: enquanto os nameservers propagam, se algum registro não tiver sido copiado, o site ou o e-mail do domínio pode ficar fora do ar. Por isso o passo 2 é o mais importante.

### Saída 2 — Trazer o domínio para dentro da Lovable

Transferir o registro do domínio para a Lovable (Configurações do workspace → Domínios). Com o domínio gerenciado aqui, a delegação é criada automaticamente e **você não precisa mexer em nenhum registro DNS**.

Contrapartida: é uma transferência de registrador, leva alguns dias e exige o código de autorização junto ao registrador atual.

## Depois que a delegação existir (eu faço)

1. Confiro na internet se os registros já estão publicados.
2. Confirmo a verificação do remetente no projeto.
3. Aponto o app para `cobrancadireta.focusinteligente.com.br` e volto os e-mails de conta para a identidade do Cobrança Certa (hoje estão no remetente padrão da plataforma).
4. Crio um cliente de teste, disparo uma cobrança real para `oluciano.dosantos@gmail.com` e confiro no histórico se saiu como enviada.
5. Apago os dados de teste.

## Detalhes técnicos

- Verificado por DNS-over-HTTPS: `focusinteligente.com.br` responde por `ns1/ns2.dns-parking.com` (Hostinger); o TXT `_lovable-email` já está publicado e correto; `NS notify.focusinteligente.com.br` está ausente. O editor de zona desse provedor não expõe o tipo NS, então a delegação é impossível ali.
- A plataforma gerencia SPF/DKIM/MX dentro da zona delegada; nada disso é criado à mão.
- Ao final, ajustar `SENDER_DOMAIN` e `FROM_DOMAIN` em `src/lib/email-templates/send-email.ts` e as constantes equivalentes em `src/routes/lovable/email/auth/webhook.ts`, além de remover o remetente `notify.*` antigo.
- Reativar os e-mails de conta com a marca do app via `toggle_project_emails` (`enabled: true`) após a verificação.
