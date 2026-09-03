import { createServerFn } from "@tanstack/react-start";
import { requireUsuarioAutorizado } from "./require-allowed-user";
import { hojeSP } from "./datas";

/**
 * Painel de operação (admin). Visível só para a conta autorizada — a mesma
 * trava de acesso do resto do app.
 *
 * Enquanto o app é de usuário único, as consultas sem filtro de user_id já
 * retornam a base inteira (a RLS escopa para a conta autorizada / admin).
 * Quando virar multi-tenant, isto precisa virar uma função SECURITY DEFINER.
 */

const DIA_MS = 86_400_000;

function falha(mensagem: string, causa: unknown): never {
  console.error("[admin]", mensagem, causa);
  throw new Error(mensagem);
}

export interface UsuarioDTO {
  id: string;
  nome: string;
  email: string;
  criadoEm: string | null;
  clientes: number;
  cobrancas: number;
  ativo7d: boolean;
}

export interface FeedbackDTO {
  id: string;
  email: string;
  mensagem: string;
  criadoEm: string;
}

export interface AdminDTO {
  usuarios: UsuarioDTO[];
  ativacao: {
    pctComCobranca: number | null;
    horasAtePrimeiraCobranca: number | null;
  };
  uso: {
    totalCobrancas: number;
    totalClientes: number;
    usuariosAtivosSemana: number;
    mediaCobrancasPorAtivo: number | null;
    valorTotalBase: number;
    ticketMedio: number | null;
  };
  envio: {
    total: number;
    enviados: number;
    falhas: number;
    taxaFalha: number | null;
    lembretes: number;
    cobrancasAtrasadas: number;
  };
  recuperacao: {
    pct: number | null;
    base: number;
    recuperadas: number;
  };
  retencao: {
    pct: number | null;
    cohort: number;
  };
  feedback: FeedbackDTO[];
}

export const carregarAdmin = createServerFn({ method: "GET" })
  .middleware([requireUsuarioAutorizado])
  .handler(async ({ context }): Promise<AdminDTO> => {
    const { supabase } = context;

    const [clientesRes, cobrancasRes, enviosRes, profilesRes, feedbackRes] = await Promise.all([
      supabase.from("clientes").select("id, user_id, criado_em"),
      supabase
        .from("cobrancas")
        .select("id, user_id, valor, vencimento, status, pago_em, criado_em"),
      supabase.from("envios").select("id, user_id, cobranca_id, tipo, data_envio, status_envio"),
      supabase.from("profiles").select("id, nome, email, criado_em"),
      supabase
        .from("feedback")
        .select("id, email, mensagem, criado_em")
        .order("criado_em", { ascending: false }),
    ]);

    if (clientesRes.error) falha("Não foi possível carregar a operação.", clientesRes.error);
    if (cobrancasRes.error) falha("Não foi possível carregar a operação.", cobrancasRes.error);
    if (enviosRes.error) falha("Não foi possível carregar a operação.", enviosRes.error);
    if (profilesRes.error) falha("Não foi possível carregar a operação.", profilesRes.error);
    if (feedbackRes.error) falha("Não foi possível carregar a operação.", feedbackRes.error);

    const clientes = clientesRes.data ?? [];
    const cobrancas = cobrancasRes.data ?? [];
    const envios = enviosRes.data ?? [];
    const profiles = profilesRes.data ?? [];
    const feedbackRows = feedbackRes.data ?? [];

    const agora = Date.now();
    const hoje = hojeSP();
    const seteDiasMs = agora - 7 * DIA_MS;

    // ---- Atividade por usuário (timestamps de qualquer evento) ----
    const atividade = new Map<string, number[]>();
    const push = (userId: string | null, iso: string | null) => {
      if (!userId || !iso) return;
      const t = Date.parse(iso);
      if (Number.isNaN(t)) return;
      const arr = atividade.get(userId) ?? [];
      arr.push(t);
      atividade.set(userId, arr);
    };
    for (const c of clientes) push(c.user_id, c.criado_em);
    for (const c of cobrancas) push(c.user_id, c.criado_em);
    for (const e of envios) push(e.user_id, e.data_envio);

    const primeiraAtividade = new Map<string, number>();
    for (const [u, ts] of atividade) primeiraAtividade.set(u, Math.min(...ts));

    const clientesPorUser = new Map<string, number>();
    for (const c of clientes) {
      if (!c.user_id) continue;
      clientesPorUser.set(c.user_id, (clientesPorUser.get(c.user_id) ?? 0) + 1);
    }
    const cobrancasPorUser = new Map<string, number[]>();
    for (const c of cobrancas) {
      if (!c.user_id) continue;
      const arr = cobrancasPorUser.get(c.user_id) ?? [];
      arr.push(Date.parse(c.criado_em));
      cobrancasPorUser.set(c.user_id, arr);
    }
    const usuariosComCobranca = new Set(cobrancasPorUser.keys());

    // ---- Usuários da plataforma (leads que se cadastraram) ----
    const usuarios: UsuarioDTO[] = profiles
      .map((p) => {
        const ts = atividade.get(p.id) ?? [];
        return {
          id: p.id,
          nome: p.nome || "—",
          email: p.email || "—",
          criadoEm: p.criado_em ?? null,
          clientes: clientesPorUser.get(p.id) ?? 0,
          cobrancas: (cobrancasPorUser.get(p.id) ?? []).length,
          ativo7d: ts.some((t) => t >= seteDiasMs),
        };
      })
      .sort((a, b) => (b.criadoEm ?? "").localeCompare(a.criadoEm ?? ""));

    const totalContas = profiles.length || atividade.size;

    // ---- Ativação ----
    const pctComCobranca = totalContas ? (usuariosComCobranca.size / totalContas) * 100 : null;
    const deltas: number[] = [];
    for (const u of usuariosComCobranca) {
      const inicio = primeiraAtividade.get(u);
      const primeiraCob = Math.min(...(cobrancasPorUser.get(u) ?? []));
      if (inicio != null && Number.isFinite(primeiraCob) && primeiraCob >= inicio) {
        deltas.push(primeiraCob - inicio);
      }
    }
    const horasAtePrimeiraCobranca = deltas.length
      ? deltas.reduce((s, d) => s + d, 0) / deltas.length / 3_600_000
      : null;

    // ---- Uso agregado ----
    const ativosSemana = new Set<string>();
    for (const [u, ts] of atividade) {
      if (ts.some((t) => t >= seteDiasMs)) ativosSemana.add(u);
    }
    const cobrancasNaSemana = cobrancas.filter((c) => Date.parse(c.criado_em) >= seteDiasMs).length;
    const valorTotalBase = cobrancas.reduce((s, c) => s + Number(c.valor), 0);
    const ticketMedio = cobrancas.length ? valorTotalBase / cobrancas.length : null;

    // ---- Saúde de envio ----
    const enviados = envios.filter((e) => e.status_envio === "enviado").length;
    const falhas = envios.filter((e) => e.status_envio === "falhou").length;
    const lembretes = envios.filter((e) => e.tipo === "lembrete").length;
    const cobrancasAtrasadas = envios.filter((e) => e.tipo === "cobranca_atrasada").length;

    // ---- Taxa de recuperação agregada (mesma fórmula do painel) ----
    const primeiroEnvioOk = new Map<string, string>();
    for (const e of envios) {
      if (e.status_envio !== "enviado") continue;
      const atual = primeiroEnvioOk.get(e.cobranca_id);
      if (!atual || e.data_envio < atual) primeiroEnvioOk.set(e.cobranca_id, e.data_envio);
    }
    const baseRec = cobrancas.filter((c) => {
      const envio = primeiroEnvioOk.get(c.id);
      if (!envio) return false;
      const referencia = c.pago_em ? c.pago_em.slice(0, 10) : hoje;
      return c.vencimento < referencia;
    });
    const recuperadas = baseRec.filter((c) => {
      const envio = primeiroEnvioOk.get(c.id);
      return c.status === "pago" && c.pago_em && envio && c.pago_em >= envio;
    });

    // ---- Retenção (cohort: 1ª atividade há >= 21 dias) ----
    let cohort = 0;
    let retidos = 0;
    for (const [, ts] of atividade) {
      const inicio = Math.min(...ts);
      if (agora - inicio < 21 * DIA_MS) continue;
      cohort += 1;
      const semana3Ini = inicio + 14 * DIA_MS;
      const semana3Fim = inicio + 21 * DIA_MS;
      if (ts.some((t) => t >= semana3Ini && t < semana3Fim)) retidos += 1;
    }

    return {
      usuarios,
      ativacao: { pctComCobranca, horasAtePrimeiraCobranca },
      uso: {
        totalCobrancas: cobrancas.length,
        totalClientes: clientes.length,
        usuariosAtivosSemana: ativosSemana.size,
        mediaCobrancasPorAtivo: ativosSemana.size ? cobrancasNaSemana / ativosSemana.size : null,
        valorTotalBase,
        ticketMedio,
      },
      envio: {
        total: envios.length,
        enviados,
        falhas,
        taxaFalha: envios.length ? (falhas / envios.length) * 100 : null,
        lembretes,
        cobrancasAtrasadas,
      },
      recuperacao: {
        pct: baseRec.length ? (recuperadas.length / baseRec.length) * 100 : null,
        base: baseRec.length,
        recuperadas: recuperadas.length,
      },
      retencao: { pct: cohort ? (retidos / cohort) * 100 : null, cohort },
      feedback: feedbackRows.map((f) => ({
        id: f.id,
        email: f.email || "—",
        mensagem: f.mensagem,
        criadoEm: f.criado_em,
      })),
    };
  });
