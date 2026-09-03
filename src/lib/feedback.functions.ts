import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const feedbackSchema = z.object({
  mensagem: z.string().trim().min(3, "Escreva um pouco mais").max(2000),
});

/**
 * Feedback da plataforma. Qualquer usuário autenticado pode enviar
 * (não usa requireUsuarioAutorizado); só o admin lê, via carregarAdmin.
 */
export const enviarFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => feedbackSchema.parse(data))
  .handler(async ({ data, context }) => {
    const email = String((context.claims as { email?: unknown })?.email ?? "");
    const { error } = await context.supabase.from("feedback").insert({
      user_id: context.userId,
      email,
      mensagem: data.mensagem,
    });
    if (error) {
      console.error("[feedback]", error);
      throw new Error("Não foi possível enviar o feedback.");
    }
    return { ok: true };
  });
