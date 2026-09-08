# Enviar as cobranças pelo Resend, no seu domínio

## Por que isso resolve

O envio atual exige um registro do tipo **NS**, que o seu painel de DNS não oferece. O Resend não usa NS: ele pede apenas registros **MX** e **TXT** — e esses o seu painel tem. Ou seja, dá para validar o domínio hoje mesmo, sem trocar de provedor de DNS e sem transferir o domínio.

Sua conta do Resend já aparece disponível aqui e será conectada ao projeto.

## O que será feito

1. Conectar a sua conta do Resend a este projeto (aparece um cartão de confirmação no chat).
2. Registrar no Resend o remetente `cobrancadireta.focusinteligente.com.br`.
3. Te entregar a lista exata de registros (um MX e alguns TXT) para você colar no painel do seu domínio — todos de tipos que o seu painel aceita.
4. Assim que você adicionar, eu confiro a verificação.
5. Trocar o envio das cobranças para o Resend, mantendo os mesmos e-mails em português já prontos (lembrete e cobrança em atraso), com o remetente "Cobrança Certa" e resposta indo para o seu e-mail.
6. Criar um cliente e uma cobrança de teste, disparar de verdade para `oluciano.dosantos@gmail.com`, conferir a entrega e depois apagar os dados de teste.

## O que fica de fora nesta rodada

- Os e-mails de conta (confirmação de cadastro e redefinição de senha) continuam saindo pelo remetente padrão da plataforma. Depois que a cobrança estiver validada, eu movo esses também para a sua marca, se quiser.
- Nada muda nas telas, nos dados ou nas regras de cobrança.

## Detalhes técnicos

- `standard_connectors--connect` com `connector_id: resend`; a conexão usa o gateway da Lovable (`uses_connector_gateway: true`), então as chamadas vão para `https://connector-gateway.lovable.dev/resend/...` com `Authorization: Bearer LOVABLE_API_KEY` e `X-Connection-Api-Key: RESEND_API_KEY`, sempre em código de servidor.
- Criação e verificação do domínio via `POST /domains` e `GET /domains/{id}` no gateway; os registros retornados são repassados ao usuário.
- Novo módulo servidor `src/lib/resend.server.ts` com o envio (`POST /emails`), renderizando os templates React Email existentes com `@react-email/render`.
- `src/lib/email-cobranca.server.ts` passa a chamar esse módulo em vez de `sendTemplateEmail`, preservando assinatura, `reply_to` (`EMAIL_RESPOSTA`) e a idempotência por `cobrancaId` (chave em header `Idempotency-Key`).
- Templates, registry e webhook de autenticação permanecem intactos; o domínio Lovable `notify.focusinteligente.com.br` fica sem uso e pode ser removido depois (o subdomínio do Resend é outro, sem conflito de DNS).
