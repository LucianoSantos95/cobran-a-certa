import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUsuarioAutorizado } from "./require-allowed-user";
import { dataCurtaSP, diasDeAtraso, hojeSP, somaDias, somaMeses } from "./datas";

export type Frequencia = "unica" | "semanal" | "quinzenal" | "mensal";

/** Próximo vencimento de uma cobrança recorrente, a partir do vencimento atual. */
export function proximoVencimento(vencimento: string, frequencia: Frequencia): string {
  if (frequencia === "semanal") return somaDias(vencimento, 7);
  if (frequencia === "quinzenal") return somaDias(vencimento, 14);
  return somaMeses(vencimento, 1);
}
import {
  EMAIL_NAO_CONFIGURADO,
  emailConfigurado,
  enviarEmailCobranca,
  type TipoEnvio,
} from "./email-cobranca.server";

/** Erro de infra logado no servidor; o cliente recebe só a mensagem amigável. */
function falha(mensagem: string, causa: unknown): never {
  console.error("[cobranca]", mensagem, causa);
  throw new Error(mensagem);
}

export interface EnvioDTO {
  id: string;
  cobranca_id: string;
  tipo: TipoEnvio;
  data_envio: string;
  status_envio: "enviado" | "falhou";
  cliente_nome: string;
}

export interface CobrancaDTO {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  cliente_email: string;
  cliente_whatsapp: string;
  descricao: string;
  frequencia: Frequencia;
  valor: number;
  vencimento: string;
  status: "pendente" | "pago";
  pago_em: string | null;
  dias_atraso: number;
  ultima_acao: string | null;
}

export interface ClienteDTO {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
}

export interface ProximoEnvioDTO {
  cliente_nome: string;
  descricao: string;
  tipo: TipoEnvio;
  quando: string;
}

export interface MetricasDTO {
  totalAReceber: number;
  totalEmAtraso: number;
  taxaRecuperacao: number | null;
  recebidoNoMes: number;
}

function rotuloTipo(tipo: TipoEnvio) {
  return tipo === "lembrete" ? "Lembrete" : "Cobrança";
}

export const carregarPainel = createServerFn({ method: "GET" })
  .middleware([requireUsuarioAutorizado])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [clientesRes, cobrancasRes, enviosRes, perfilRes] = await Promise.all([
      supabase
        .from("clientes")
        .select("id, nome, email, whatsapp")
        .eq("user_id", userId)
        .order("nome"),
      supabase
        .from("cobrancas")
        .select("id, cliente_id, descricao, frequencia, valor, vencimento, status, pago_em")
        .eq("user_id", userId)
        .order("vencimento", { ascending: true }),
      supabase
        .from("envios")
        .select("id, cobranca_id, tipo, data_envio, status_envio")
        .eq("user_id", userId)
        .order("data_envio", { ascending: false }),
      supabase
        .from("perfil_cobranca")
        .select("instrucoes_pagamento")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    if (clientesRes.error) falha("Não foi possível carregar o painel.", clientesRes.error);
    if (cobrancasRes.error) falha("Não foi possível carregar o painel.", cobrancasRes.error);
    if (enviosRes.error) falha("Não foi possível carregar o painel.", enviosRes.error);

    const clientes: ClienteDTO[] = clientesRes.data ?? [];
    const mapaCliente = new Map(clientes.map((c) => [c.id, c]));
    const enviosBrutos = enviosRes.data ?? [];
    const instrucoesPagamento = perfilRes.data?.instrucoes_pagamento ?? "";

    const hojeStr = hojeSP();

    const cobrancas: CobrancaDTO[] = (cobrancasRes.data ?? []).map((c) => {
      const cliente = mapaCliente.get(c.cliente_id);
      const ultimo = enviosBrutos.find((e) => e.cobranca_id === c.id);
      const atrasada = c.status !== "pago" && c.vencimento < hojeStr;
      return {
        id: c.id,
        cliente_id: c.cliente_id,
        cliente_nome: cliente?.nome ?? "—",
        cliente_email: cliente?.email ?? "",
        cliente_whatsapp: cliente?.whatsapp ?? "",
        descricao: c.descricao ?? "",
        frequencia: (c.frequencia ?? "unica") as Frequencia,
        valor: Number(c.valor),
        vencimento: c.vencimento,
        status: c.status as "pendente" | "pago",
        pago_em: c.pago_em,
        dias_atraso: atrasada ? diasDeAtraso(c.vencimento) : 0,
        ultima_acao: ultimo
          ? `${rotuloTipo(ultimo.tipo as TipoEnvio)} ${
              ultimo.status_envio === "enviado" ? "enviado" : "falhou"
            } ${dataCurtaSP(ultimo.data_envio)}`
          : null,
      };
    });

    const mapaCobranca = new Map(cobrancas.map((c) => [c.id, c]));
    const envios: EnvioDTO[] = enviosBrutos.map((e) => ({
      id: e.id,
      cobranca_id: e.cobranca_id,
      tipo: e.tipo as TipoEnvio,
      data_envio: e.data_envio,
      status_envio: e.status_envio as "enviado" | "falhou",
      cliente_nome: mapaCobranca.get(e.cobranca_id)?.cliente_nome ?? "—",
    }));

    const hoje = hojeStr;
    const inicioMes = `${hoje.slice(0, 7)}-01`;
    const seteDiasAtras = somaDias(hoje, -7);

    // Próximos envios: o que a próxima rodada faria + o que vence em breve.
    const enviadoOk = new Set(
      enviosBrutos
        .filter((e) => e.status_envio === "enviado")
        .map((e) => `${e.cobranca_id}:${e.tipo}`),
    );
    const dm = (dia: string) => {
      const [, m, d] = dia.slice(0, 10).split("-");
      return `${d}/${m}`;
    };
    const proximosEnvios: ProximoEnvioDTO[] = [];
    for (const c of cobrancas) {
      if (c.status === "pago") continue;
      const lembrete = enviadoOk.has(`${c.id}:lembrete`);
      const firme = enviadoOk.has(`${c.id}:cobranca_atrasada`);
      if (!lembrete && c.vencimento > seteDiasAtras) {
        proximosEnvios.push({
          cliente_nome: c.cliente_nome,
          descricao: c.descricao,
          tipo: "lembrete",
          quando:
            c.vencimento <= hoje ? "assim que você rodar" : `no vencimento, ${dm(c.vencimento)}`,
        });
      } else if (!firme && c.vencimento <= hoje) {
        let quando: string;
        if (c.vencimento <= seteDiasAtras) {
          quando = "assim que você rodar";
        } else {
          const faltam = 7 - diasDeAtraso(c.vencimento);
          quando = `em ${faltam} dia${faltam > 1 ? "s" : ""}`;
        }
        proximosEnvios.push({
          cliente_nome: c.cliente_nome,
          descricao: c.descricao,
          tipo: "cobranca_atrasada",
          quando,
        });
      }
    }
    proximosEnvios.sort((a, b) => {
      const agora = (q: string) => (q === "assim que você rodar" ? 0 : 1);
      return agora(a.quando) - agora(b.quando);
    });

    const pendentes = cobrancas.filter((c) => c.status !== "pago");
    const totalAReceber = pendentes.reduce((s, c) => s + c.valor, 0);
    const totalEmAtraso = pendentes
      .filter((c) => c.vencimento < hoje)
      .reduce((s, c) => s + c.valor, 0);
    const recebidoNoMes = cobrancas
      .filter((c) => c.status === "pago" && c.pago_em && c.pago_em.slice(0, 10) >= inicioMes)
      .reduce((s, c) => s + c.valor, 0);

    // Taxa de recuperação: cobranças que atrasaram, receberam pelo menos um
    // envio bem-sucedido e foram pagas depois desse envio.
    const primeiroEnvio = new Map<string, string>();
    for (const e of enviosBrutos) {
      if (e.status_envio !== "enviado") continue;
      const atual = primeiroEnvio.get(e.cobranca_id);
      if (!atual || e.data_envio < atual) primeiroEnvio.set(e.cobranca_id, e.data_envio);
    }

    const base = cobrancas.filter((c) => {
      const envio = primeiroEnvio.get(c.id);
      if (!envio) return false;
      const referencia = c.pago_em ? c.pago_em.slice(0, 10) : hoje;
      return c.vencimento < referencia;
    });
    const recuperadas = base.filter((c) => {
      const envio = primeiroEnvio.get(c.id);
      return c.status === "pago" && c.pago_em && envio && c.pago_em >= envio;
    });

    const metricas: MetricasDTO = {
      totalAReceber,
      totalEmAtraso,
      recebidoNoMes,
      taxaRecuperacao: base.length ? (recuperadas.length / base.length) * 100 : null,
    };

    return {
      clientes,
      cobrancas,
      envios,
      metricas,
      proximosEnvios,
      instrucoesPagamento,
      emailPronto: emailConfigurado(),
    };
  });

const soDigitos = (s: string) => s.replace(/\D/g, "");

const clienteSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  whatsapp: z.string().trim().max(20).optional().default(""),
});

export const criarCliente = createServerFn({ method: "POST" })
  .middleware([requireUsuarioAutorizado])
  .inputValidator((data: unknown) => clienteSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("clientes").insert({
      user_id: context.userId,
      nome: data.nome,
      email: data.email.toLowerCase(),
      whatsapp: soDigitos(data.whatsapp),
    });
    if (error) falha("Não foi possível cadastrar o cliente.", error);
    return { ok: true };
  });

export const excluirCliente = createServerFn({ method: "POST" })
  .middleware([requireUsuarioAutorizado])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    // Conta o que será removido junto (FK em cascata: cobranças e envios).
    const { count } = await context.supabase
      .from("cobrancas")
      .select("id", { count: "exact", head: true })
      .eq("cliente_id", data.id)
      .eq("user_id", context.userId);

    const { error } = await context.supabase
      .from("clientes")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) falha("Não foi possível excluir o cliente.", error);
    return { ok: true, cobrancasRemovidas: count ?? 0 };
  });

const cobrancaSchema = z.object({
  cliente_id: z.string().uuid("Selecione um cliente"),
  valor: z.number().positive("Valor deve ser maior que zero").max(99999999),
  vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  descricao: z.string().trim().max(200).optional().default(""),
  frequencia: z.enum(["unica", "semanal", "quinzenal", "mensal"]).optional().default("unica"),
});

export const criarCobranca = createServerFn({ method: "POST" })
  .middleware([requireUsuarioAutorizado])
  .inputValidator((data: unknown) => cobrancaSchema.parse(data))
  .handler(async ({ data, context }) => {
    // Garante que o cliente é do próprio usuário antes de vincular a cobrança.
    const { data: cliente, error: erroCliente } = await context.supabase
      .from("clientes")
      .select("id")
      .eq("id", data.cliente_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (erroCliente) falha("Não foi possível cadastrar a cobrança.", erroCliente);
    if (!cliente) throw new Error("Cliente não encontrado.");

    const { error } = await context.supabase.from("cobrancas").insert({
      user_id: context.userId,
      cliente_id: data.cliente_id,
      valor: data.valor,
      vencimento: data.vencimento,
      descricao: data.descricao,
      frequencia: data.frequencia,
      status: "pendente",
    });
    if (error) falha("Não foi possível cadastrar a cobrança.", error);
    return { ok: true };
  });

export const editarCobranca = createServerFn({ method: "POST" })
  .middleware([requireUsuarioAutorizado])
  .inputValidator((data: unknown) => cobrancaSchema.extend({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: cliente, error: erroCliente } = await context.supabase
      .from("clientes")
      .select("id")
      .eq("id", data.cliente_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (erroCliente) falha("Não foi possível salvar a cobrança.", erroCliente);
    if (!cliente) throw new Error("Cliente não encontrado.");

    const { error } = await context.supabase
      .from("cobrancas")
      .update({
        cliente_id: data.cliente_id,
        valor: data.valor,
        vencimento: data.vencimento,
        descricao: data.descricao,
        frequencia: data.frequencia,
      })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) falha("Não foi possível salvar a cobrança.", error);
    return { ok: true };
  });

export const excluirCobranca = createServerFn({ method: "POST" })
  .middleware([requireUsuarioAutorizado])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("cobrancas")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) falha("Não foi possível excluir a cobrança.", error);
    return { ok: true };
  });

export const marcarComoPaga = createServerFn({ method: "POST" })
  .middleware([requireUsuarioAutorizado])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: paga, error } = await context.supabase
      .from("cobrancas")
      .update({ status: "pago", pago_em: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select("cliente_id, valor, vencimento, descricao, frequencia")
      .maybeSingle();
    if (error) falha("Não foi possível marcar como paga.", error);

    // Recorrente: gera a próxima parcela a partir do vencimento desta.
    let proximo: string | null = null;
    const freq = (paga?.frequencia ?? "unica") as Frequencia;
    if (paga && freq !== "unica") {
      proximo = proximoVencimento(paga.vencimento, freq);
      const { error: erroProx } = await context.supabase.from("cobrancas").insert({
        user_id: context.userId,
        cliente_id: paga.cliente_id,
        valor: paga.valor,
        vencimento: proximo,
        descricao: paga.descricao,
        frequencia: freq,
        status: "pendente",
      });
      if (erroProx) {
        console.error("[cobranca] próxima recorrência", erroProx);
        proximo = null;
      }
    }
    return { ok: true, proximoVencimento: proximo };
  });

export const reabrirCobranca = createServerFn({ method: "POST" })
  .middleware([requireUsuarioAutorizado])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("cobrancas")
      .update({ status: "pendente", pago_em: null })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) falha("Não foi possível reabrir a cobrança.", error);
    return { ok: true };
  });

/**
 * Rotina diária de cobrança (por enquanto disparada manualmente).
 * Regras fixas, no fuso de São Paulo:
 *  - lembrete: do vencimento até o 7º dia de atraso, se ainda não enviado;
 *  - cobrança atrasada: a partir do 7º dia de atraso, se ainda não enviada.
 * Cada rodada manda no máximo uma mensagem por cobrança pendente, e o
 * índice único em `envios` impede repetir um envio bem-sucedido.
 */
export const rodarCobrancas = createServerFn({ method: "POST" })
  .middleware([requireUsuarioAutorizado])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const hoje = hojeSP();
    const seteDiasAtras = somaDias(hoje, -7);

    const { data: cobrancas, error } = await supabase
      .from("cobrancas")
      .select("id, cliente_id, descricao, valor, vencimento, status")
      .eq("user_id", userId)
      .eq("status", "pendente");
    if (error) falha("Não foi possível rodar as cobranças.", error);

    const { data: enviosExistentes } = await supabase
      .from("envios")
      .select("cobranca_id, tipo")
      .eq("user_id", userId)
      .eq("status_envio", "enviado");
    const jaEnviado = new Set((enviosExistentes ?? []).map((e) => `${e.cobranca_id}:${e.tipo}`));

    const { data: clientes } = await supabase
      .from("clientes")
      .select("id, nome, email")
      .eq("user_id", userId);
    const mapaCliente = new Map((clientes ?? []).map((c) => [c.id, c]));

    const { data: perfil } = await supabase
      .from("perfil_cobranca")
      .select("instrucoes_pagamento")
      .eq("user_id", userId)
      .maybeSingle();
    const instrucoesPagamento = perfil?.instrucoes_pagamento ?? "";

    const pendentesDeEnvio: { cobrancaId: string; tipo: TipoEnvio }[] = [];
    for (const c of cobrancas ?? []) {
      const naJanelaDoLembrete = c.vencimento <= hoje && c.vencimento > seteDiasAtras;
      const atrasoFirme = c.vencimento <= seteDiasAtras;

      if (naJanelaDoLembrete && !jaEnviado.has(`${c.id}:lembrete`)) {
        pendentesDeEnvio.push({ cobrancaId: c.id, tipo: "lembrete" });
      } else if (atrasoFirme && !jaEnviado.has(`${c.id}:cobranca_atrasada`)) {
        pendentesDeEnvio.push({ cobrancaId: c.id, tipo: "cobranca_atrasada" });
      }
    }

    if (pendentesDeEnvio.length === 0) {
      return { enviados: 0, falhas: 0, elegiveis: 0, emailPendente: !emailConfigurado() };
    }

    if (!emailConfigurado()) {
      return {
        enviados: 0,
        falhas: 0,
        elegiveis: pendentesDeEnvio.length,
        emailPendente: true,
      };
    }

    let enviados = 0;
    let falhas = 0;
    for (const item of pendentesDeEnvio) {
      const cobranca = (cobrancas ?? []).find((c) => c.id === item.cobrancaId)!;
      const cliente = mapaCliente.get(cobranca.cliente_id);
      let statusEnvio: "enviado" | "falhou" = "enviado";
      let erro: string | null = null;
      try {
        if (!cliente) throw new Error("Cliente não encontrado");
        await enviarEmailCobranca({
          para: cliente.email,
          nomeCliente: cliente.nome,
          valor: Number(cobranca.valor),
          vencimento: cobranca.vencimento,
          descricao: cobranca.descricao ?? "",
          tipo: item.tipo,
          cobrancaId: cobranca.id,
          instrucoesPagamento,
        });
        enviados += 1;
      } catch (e) {
        statusEnvio = "falhou";
        erro = e instanceof Error ? e.message : String(e);
        if (erro === EMAIL_NAO_CONFIGURADO) erro = "Domínio de e-mail não configurado";
        falhas += 1;
      }
      await supabase.from("envios").insert({
        user_id: userId,
        cobranca_id: item.cobrancaId,
        tipo: item.tipo,
        status_envio: statusEnvio,
        erro,
      });
    }

    return { enviados, falhas, elegiveis: pendentesDeEnvio.length, emailPendente: false };
  });
