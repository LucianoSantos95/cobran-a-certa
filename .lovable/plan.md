# Ativar o login com Google

Hoje a tela de entrada já mostra o botão "Entrar com Google", mas ele usa um caminho antigo e o provedor Google ainda não está habilitado no backend — por isso a tentativa falha.

## O que será feito

1. Habilitar o provedor Google no backend (credenciais gerenciadas pela Lovable, sem você precisar criar nada no Google).
2. Trocar o botão da tela de entrada para o fluxo oficial de login com Google, que funciona tanto na pré-visualização quanto no site publicado.
3. Liberar o acesso: qualquer pessoa com conta Google poderá entrar e usar o app, vendo apenas os próprios clientes e cobranças. A restrição a uma única conta é removida.
4. Manter também a entrada por e-mail e senha como está.
5. Voltar para o painel automaticamente assim que o login for confirmado.

## Detalhes técnicos

- Chamar `configure_social_auth` com o provedor `google` (gera `src/integrations/lovable` e instala `@lovable.dev/cloud-auth-js`).
- Em `src/routes/auth.tsx`, substituir `supabase.auth.signInWithOAuth` por `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin, extraParams: { prompt: "select_account" } })`, tratando `result.error` e `result.redirected`.
- O redirecionamento aponta para a origem pública; remover a checagem de `EMAIL_AUTORIZADO` no listener de sessão e no formulário de e-mail/senha, bem como o `signOut` forçado para contas não autorizadas.
- E-mail/senha permanece habilitado (não desativar o provedor `email`).
