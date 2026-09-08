# Auditoria completa do Cobrança Certa

Objetivo: percorrer o app como um usuário real, do login até o envio de e-mail, e listar o que funciona e o que precisa de conserto.

## Como a auditoria será feita

1. **Entrada no app**
   - Criar uma conta de teste e entrar por e-mail e senha.
   - Conferir que quem não entrou é mandado para a tela de entrada e que, após entrar, cai no painel.
   - Testar o botão "Google": confirmar que o provedor está ativo e que o fluxo abre a tela de escolha de conta do Google (sem usar sua senha). Também vou olhar os registros de acesso para ver se logins com Google estão sendo aceitos.

2. **Testes dos botões e telas (com a conta de teste)**
   - Cadastrar um cliente fictício.
   - Cadastrar uma cobrança vencida hoje e outra vencida há mais de 7 dias.
   - Rodar o botão "Rodar cobranças agora" e conferir se os envios aparecem no registro.
   - Marcar como paga e reabrir uma cobrança.
   - Conferir os 4 números do topo (a receber, em atraso, taxa de recuperação, recebido no mês).
   - Abrir Configurações: salvar instruções de pagamento, nome e foto.
   - Testar o botão de feedback.
   - Conferir a tela de administração (deve continuar aberta só para você).

3. **Envio real de e-mail**
   - Disparar uma cobrança de teste para oluciano.dosantos@gmail.com e conferir no histórico de envio se saiu, ficou pendente ou falhou.
   - Verificar o estado do domínio de envio (notify.diagnostico.focusinteligente.com.br); se o domínio ainda não estiver verificado, o e-mail não sai e isso entra no relatório como pendência com o passo exato para resolver.

4. **Isolamento de dados**
   - Confirmar que a conta de teste só enxerga os próprios clientes e cobranças, e que a sua conta não vê os dados de teste.

5. **Limpeza**
   - Apagar cliente, cobranças, envios e a conta de teste ao final.

## O que você recebe no final

Um relatório em conversa, item por item: o que passou, o que falhou e o que é pendência externa (como DNS do domínio de e-mail). Correções de bugs encontrados só serão feitas depois que você aprovar — nesta rodada o foco é diagnosticar.

## Detalhes técnicos

- Navegação automatizada com Playwright em http://localhost:8080, capturando console e rede.
- Conta de teste criada via Auth Admin (e-mail confirmado), removida ao final.
- Verificação do provedor Google via configuração de auth + logs de autenticação; o clique no botão é validado até o redirecionamento ao Google.
- Envio de e-mail exercitado pelas server functions reais (`rodarCobrancas` / envio manual), com leitura de `envios.status_envio` e `erro`, além dos registros de e-mail da plataforma.
- Consultas de conferência em `clientes`, `cobrancas`, `envios`, `perfil_cobranca` e `profiles`; limpeza por SQL no final.
