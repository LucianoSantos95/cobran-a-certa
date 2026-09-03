import { createServerFn } from "@tanstack/react-start";
import { requireUsuarioAutorizado } from "./require-allowed-user";
import { hojeSP } from "./datas";

/**
 * Painel de operação (admin). Visível só para a conta autorizada — a mesma
 * trava de acesso do resto do app.
 *
 * Enquanto o app é de usuário único, as consultas sem filtro de user_id já
 * retornam a base inteira (a RLS escopa para a conta autorizada). Quando
 * virar multi-tenant, isto precisa virar uma função SECURITY DEFINER no
 * banco para somar todos os usuários.
 */

const DIA_MS = 86_400_000;

function falha(mensagem: string, causa: unknown): never {
  console.error("[admin]", mensagem, causa);
  throw new Error(mensagem);
}

export interface EtapaFunil {
  etapa: string;
  valor: number | null;
  /** false quando a fonte do dado está fora deste app (Notion / Hub Central). */
  disponivel: boolean;
  quedaPct: number | null;
}

export interface AdminDTO {
  funil: EtapaFunil[];
  ativacao: {
    pctComCobranca: number | null;
    horasAtePrimeiraCobranca: number | null;
  };
  uso: {
    totalCobrancas: number;
    totalClientes: number;
    usuariosAtivosSemana: number;
    mediaCobrancasPorAtivo: number | null;
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
}

export const carregarAdmin = createServerFn({ method: "GET" })
  .middleware([requireUsuarioAutorizado])
  .handler(async ({ context }): Promise<AdminDTO> => {
    const { supabase } = context;

    const [clientesRes, cobrancasRes, enviosRes] = await Promise.all([
      supabase.from("clientes").select("id, user_id, criado_em"),
      supabase
        .from("cobrancas")
        .select("id, user_id, valor, vencimento, status, pago_em, criado_em"),
      supabase.from("envios").select("id, user_id, cobranca_id, tipo, data_envio, status_envio"),
    ]);

    if (clientesRes.error) falha("Não foi possível carregar a operação.", clientesRes.error);
    if (cobrancasRes.error) falha("Não foi possível carregar a operação.", cobrancasRes.error);
    if (enviosRes.error) falha("Não foi possível carregar a operação.", enviosRes.error);

    const clientes = clientesRes.data ?? [];
    const cobrancas = cobrancasRes.data ?? [];
    const envios = enviosRes.data ?? [];

    const agora = Date.now();
    const hoje = hojeSP();

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

    const usuarios = [...atividade.keys()];
    const primeiraAtividade = new Map<string, number>();
    for (const [u, ts] of atividade) primeiraAtividade.set(u, Math.min(...ts));

    const usuariosComCliente = new Set(clientes.map((c) => c.user_id).filter(Boolean) as string[]);
    const cobrancasPorUser = new Map<string, number[]>();
    for (const c of cobrancas) {
      if (!c.user_id) continue;
      const arr = cobrancasPorUser.get(c.user_id) ?? [];
      arr.push(Date.parse(c.criado_em));
      cobrancasPorUser.set(c.user_id, arr);
    }
    const usuariosComCobranca = new Set(cobrancasPorUser.keys());

    // ---- Funil ----
    const contaCriada = usuarios.length;
    const drop = (atual: number | null, anterior: number | null) =>
      atual == null || anterior == null || anterior === 0
        ? null
        : ((anterior - atual) / anterior) * 100;

    const funil: EtapaFunil[] = [
      { etapa: "Visita ao template (Notion)", valor: null, disponivel: false, quedaPct: null },
      { etapa: "Lead capturado", valor: null, disponivel: false, quedaPct: null },
      { etapa: "Conta criada", valor: contaCriada, disponivel: true, quedaPct: null },
      {
        etapa: "Cliente cadastrado",
        valor: usuariosComCliente.size,
        disponivel: true,
        quedaPct: drop(usuariosComCliente.size, contaCriada),
      },
      {
        etapa: "Cobrança cadastrada",
        valor: usuariosComCobranca.size,
        disponivel: true,
        quedaPct: drop(usuariosComCobranca.size, usuariosComCliente.size),
      },
    ];

    // ---- Ativação ----
    const pctComCobranca = contaCriada ? (usuariosComCobranca.size / contaCriada) * 100 : null;
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
    const seteDiasMs = agora - 7 * DIA_MS;
    const ativosSemana = new Set<string>();
    for (const [u, ts] of atividade) {
      if (ts.some((t) => t >= seteDiasMs)) ativosSemana.add(u);
    }
    const cobrancasNaSemana = cobrancas.filter((c) => Date.parse(c.criado_em) >= seteDiasMs).length;

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
    for (const [u, ts] of atividade) {
      const inicio = primeiraAtividade.get(u)!;
      if (agora - inicio < 21 * DIA_MS) continue;
      cohort += 1;
      const semana3Ini = inicio + 14 * DIA_MS;
      const semana3Fim = inicio + 21 * DIA_MS;
      if (ts.some((t) => t >= semana3Ini && t < semana3Fim)) retidos += 1;
    }

    return {
      funil,
      ativacao: { pctComCobranca, horasAtePrimeiraCobranca },
      uso: {
        totalCobrancas: cobrancas.length,
        totalClientes: clientes.length,
        usuariosAtivosSemana: ativosSemana.size,
        mediaCobrancasPorAtivo: ativosSemana.size ? cobrancasNaSemana / ativosSemana.size : null,
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
    };
  });
