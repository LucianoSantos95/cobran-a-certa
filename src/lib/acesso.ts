/**
 * Constantes de acesso e identidade da conta.
 *
 * Fase de validação: o app inteiro é de uso interno e só a conta abaixo
 * pode entrar. A restrição é aplicada em três camadas independentes:
 *   1. tela de login (src/routes/auth.tsx)
 *   2. middleware das server functions (src/lib/require-allowed-user.ts)
 *   3. políticas de RLS no banco (supabase/migrations)
 */

/** Único e-mail autorizado a acessar o app nesta fase. */
export const EMAIL_AUTORIZADO = "oluciano.dosantos@gmail.com";

/** Para onde vão as respostas dos e-mails de cobrança (o prestador). */
export const EMAIL_RESPOSTA = "oluciano.dosantos@gmail.com";

/** Nome do produto exibido em telas e e-mails. */
export const NOME_PRODUTO = "Cobrança Certa";

/** Fuso usado para toda regra de data (vencimento, atraso, "hoje"). */
export const TIMEZONE = "America/Sao_Paulo";
