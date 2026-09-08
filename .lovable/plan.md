# Validar o envio de e-mails antes de liberar o seu domínio

## Situação

Hoje os e-mails de cobrança só podem sair de um domínio seu, e o `notify.focusinteligente.com.br` ainda está aguardando os registros DNS. Não existe remetente "emprestado" da Lovable para esse tipo de e-mail.

Os e-mails de conta (confirmação de cadastro e redefinição de senha) são diferentes: eles podem sair pelo remetente padrão da Lovable enquanto o seu domínio não está liberado. Só que hoje o app está configurado para enviá-los também pelo seu domínio, então eles falham junto.

## O que será feito

1. Colocar os e-mails de conta temporariamente no remetente padrão da Lovable, para que voltem a sair sem depender do DNS.
2. Disparar uma redefinição de senha real para `oluciano.dosantos@gmail.com` e confirmar com você se chegou na caixa de entrada.
3. Registrar o resultado: se chegou, o caminho de envio está saudável e só falta o domínio.
4. Quando o seu domínio for verificado, reativar o envio pela sua marca (com os modelos em português já prontos) e refazer o teste, agora com uma cobrança real.

## O que muda para você durante o teste

- O e-mail de conta chega com remetente e visual padrão da Lovable, sem a identidade do Cobrança Certa.
- As cobranças continuam sem sair até o domínio ser liberado — isso não muda nesta etapa.
- Nada no painel, nos dados ou nas telas é alterado.

## Detalhes técnicos

- Desativar temporariamente o envio gerenciado do projeto (`email_domain--toggle_project_emails` com `enabled: false`), o que faz a autenticação voltar aos modelos padrão da Lovable; os arquivos de template e o webhook permanecem no projeto, intactos.
- Acionar `supabase.auth.resetPasswordForEmail` para o endereço de teste e conferir o resultado nos registros de autenticação.
- Após a verificação do domínio, reverter com `enabled: true` e disparar uma cobrança real pelo fluxo normal do app.
