import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Middleware de server function: exige um token Supabase válido.
 *
 * O acesso é aberto a qualquer conta autenticada; o isolamento dos dados
 * entre usuários é garantido pelo user_id + políticas de RLS no banco.
 */
export const requireUsuarioAutorizado = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next }) => next());
