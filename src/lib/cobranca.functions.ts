import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUsuarioAutorizado } from "./require-allowed-user";
import { dataCurtaSP, hojeSP, somaDias } from "./datas";
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
  valor: number;
  vencimento: string;
  status: "pendente" | "pago";
  pago_em: string | null;
  ultima_acao: string | null;
}

export interface ClienteDTO {
  id: string;
  nome: string;
  email: string;
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

    const [clientesRes, cobrancasRes, enviosRes] = await Promise.all([
      supabase.from("clientes").select("id, nome, email").eq("user_id", userId).order("nome"),
      supabase
        .from("cobrancas")
        .select("id, cliente_id, valor, vencimento, status, pago_em")
        .eq("user_id", userId)
        .order("vencimento", { ascending: true }),
      supabase
        .from("envios")
        .select("id, cobranca_id, tipo, data_envio, status_envio")
        .eq("user_id", userId)
        .order("data_envio", { ascending: false }),
    ]);

    if (clientesRes.error) falha("Não foi possível carregar o painel.", clientesRes.error);
    if (cobrancasRes.error) falha("Não foi possível carregar o painel.", cobrancasRes.error);
    if (enviosRes.error) falha("Não foi possível carregar o painel.", enviosRes.error);

    const clientes: ClienteDTO[] = clientesRes.data ?? [];
    const mapaCliente = new Map(clientes.map((c) => [c.id, c]));
    const enviosBrutos = enviosRes.data ?? [];

    const cobrancas: CobrancaDTO[] = (cobrancasRes.data ?? []).map((c) => {
      const cliente = mapaCliente.get(c.cliente_id);
      const ultimo = enviosBrutos.find((e) => e.cobranca_id === c.id);
      return {
        id: c.id,
        cliente_id: c.cliente_id,
        cliente_nome: cliente?.nome ?? "—",
        cliente_email: cliente?.email ?? "",
        valor: Number(c.valor),
        vencimento: c.vencimento,
        status: c.status as "pendente" | "pago",
        pago_em: c.pago_em,
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

    const hoje = hojeSP();
    const inicioMes = `${hoje.slice(0, 7)}-01`;

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

    return { clientes, cobrancas, envios, metricas, emailPronto: emailConfigurado() };
  });

const clienteSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
});

export const criarCliente = createServerFn({ method: "POST" })
  .middleware([requireUsuarioAutorizado])
  .inputValidator((data: unknown) => clienteSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("clientes").insert({
      user_id: context.userId,
      nome: data.nome,
      email: data.email.toLowerCase(),
    });
    if (error) falha("Não foi possível cadastrar o cliente.", error);
    return { ok: true };
  });

const cobrancaSchema = z.object({
  cliente_id: z.string().uuid("Selecione um cliente"),
  valor: z.number().positive("Valor deve ser maior que zero").max(99999999),
  vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
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
      status: "pendente",
    });
    if (error) falha("Não foi possível cadastrar a cobrança.", error);
    return { ok: true };
  });

export const marcarComoPaga = createServerFn({ method: "POST" })
  .middleware([requireUsuarioAutorizado])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("cobrancas")
      .update({ status: "pago", pago_em: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) falha("Não foi possível marcar como paga.", error);
    return { ok: true };
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
      .select("id, cliente_id, valor, vencimento, status")
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
          tipo: item.tipo,
          cobrancaId: cobranca.id,
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
