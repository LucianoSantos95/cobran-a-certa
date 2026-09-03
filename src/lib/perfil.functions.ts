import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUsuarioAutorizado } from "./require-allowed-user";

function falha(mensagem: string, causa: unknown): never {
  console.error("[perfil]", mensagem, causa);
  throw new Error(mensagem);
}

export const carregarPerfil = createServerFn({ method: "GET" })
  .middleware([requireUsuarioAutorizado])
  .handler(async ({ context }): Promise<{ instrucoesPagamento: string }> => {
    const { data, error } = await context.supabase
      .from("perfil_cobranca")
      .select("instrucoes_pagamento")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) falha("Não foi possível carregar as configurações.", error);
    return { instrucoesPagamento: data?.instrucoes_pagamento ?? "" };
  });

const perfilSchema = z.object({
  instrucoesPagamento: z.string().trim().max(2000, "Máximo de 2000 caracteres"),
});

export const salvarPerfil = createServerFn({ method: "POST" })
  .middleware([requireUsuarioAutorizado])
  .inputValidator((data: unknown) => perfilSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("perfil_cobranca").upsert(
      {
        user_id: context.userId,
        instrucoes_pagamento: data.instrucoesPagamento,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) falha("Não foi possível salvar as configurações.", error);
    return { ok: true };
  });
