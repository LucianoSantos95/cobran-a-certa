import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const feedbackSchema = z.object({
  nome: z.string().trim().min(1, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  estrelas: z.number().int().min(1, "Dê uma nota").max(5),
  mensagem: z.string().trim().max(2000).optional().default(""),
});

/**
 * Feedback da plataforma. Qualquer usuário autenticado pode enviar
 * (não usa requireUsuarioAutorizado); só o admin lê, via carregarAdmin.
 */
export const enviarFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => feedbackSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("feedback").insert({
      user_id: context.userId,
      nome: data.nome,
      email: data.email.toLowerCase(),
      estrelas: data.estrelas,
      mensagem: data.mensagem,
    });
    if (error) {
      console.error("[feedback]", error);
      throw new Error("Não foi possível enviar o feedback.");
    }
    return { ok: true };
  });
