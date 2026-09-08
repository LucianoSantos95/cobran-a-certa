import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { EMAIL_AUTORIZADO } from "./acesso";

export type TicketStatus = "aberto" | "concluido";

export interface TicketDTO {
  id: string;
  nome: string;
  email: string;
  mensagem: string;
  status: TicketStatus;
  respostaAdmin: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

function falha(mensagem: string, causa: unknown): never {
  console.error("[tickets]", mensagem, causa);
  throw new Error(mensagem);
}

const abrirSchema = z.object({
  nome: z.string().trim().min(1, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  mensagem: z.string().trim().min(1, "Escreva sua mensagem").max(4000),
});

export const abrirTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => abrirSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("tickets").insert({
      user_id: context.userId,
      nome: data.nome,
      email: data.email.toLowerCase(),
      mensagem: data.mensagem,
    });
    if (error) falha("Não foi possível abrir o chamado.", error);
    return { ok: true };
  });

function mapTicket(t: {
  id: string;
  nome: string;
  email: string;
  mensagem: string;
  status: string;
  resposta_admin: string | null;
  criado_em: string;
  atualizado_em: string;
}): TicketDTO {
  return {
    id: t.id,
    nome: t.nome,
    email: t.email,
    mensagem: t.mensagem,
    status: t.status === "concluido" ? "concluido" : "aberto",
    respostaAdmin: t.resposta_admin,
    criadoEm: t.criado_em,
    atualizadoEm: t.atualizado_em,
  };
}

export const meusTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TicketDTO[]> => {
    const { data, error } = await context.supabase
      .from("tickets")
      .select("id, nome, email, mensagem, status, resposta_admin, criado_em, atualizado_em")
      .eq("user_id", context.userId)
      .order("criado_em", { ascending: false });
    if (error) falha("Não foi possível carregar seus chamados.", error);
    return (data ?? []).map(mapTicket);
  });

const concluirSchema = z.object({
  id: z.string().uuid(),
  resposta: z.string().trim().max(4000).optional().default(""),
});

export const concluirTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => concluirSchema.parse(data))
  .handler(async ({ data, context }) => {
    const email = String((context.claims as { email?: unknown })?.email ?? "")
      .trim()
      .toLowerCase();
    if (email !== EMAIL_AUTORIZADO) throw new Error("Acesso restrito.");

    const { error } = await context.supabase
      .from("tickets")
      .update({
        status: "concluido",
        resposta_admin: data.resposta || null,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) falha("Não foi possível concluir o chamado.", error);
    return { ok: true };
  });
