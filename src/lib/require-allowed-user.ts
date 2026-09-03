import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { EMAIL_AUTORIZADO } from "./acesso";

/**
 * Middleware de server function: exige token válido (via requireSupabaseAuth)
 * E que o e-mail do token seja o único autorizado nesta fase.
 *
 * Sem isto, qualquer usuário autenticado no projeto Supabase conseguiria
 * chamar as server functions — a RLS ainda barraria a leitura/escrita, mas
 * a resposta seria um erro cru de banco em vez de um 403 limpo.
 */
export const requireUsuarioAutorizado = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const claims = context.claims as { email?: unknown } | undefined;
    const email = String(claims?.email ?? "")
      .trim()
      .toLowerCase();

    if (email && email !== EMAIL_AUTORIZADO) {
      console.error(`[acesso] tentativa de acesso não autorizada: ${email}`);
      throw new Error("Acesso restrito a esta conta.");
    }
    if (!email) {
      // Não deve acontecer com token Supabase; a RLS ainda é o backstop.
      console.warn("[acesso] token sem claim de e-mail; seguindo com a RLS.");
    }

    return next();
  });
