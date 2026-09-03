import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { EMAIL_AUTORIZADO } from "@/lib/acesso";
import { carregarAdmin } from "@/lib/admin.functions";
import { BlurFade } from "@/components/magicui/blur-fade";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { MetricCard } from "@/components/metric-card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Operação | Cobrança Certa" }],
  }),
  beforeLoad: async () => {
    // Redundante com o guard de /_authenticated, mas deixa a intenção explícita:
    // a operação é só da conta dona.
    const { data } = await supabase.auth.getUser();
    if ((data.user?.email ?? "").toLowerCase() !== EMAIL_AUTORIZADO) {
      throw redirect({ to: "/" });
    }
  },
  component: Admin,
});

function tempoLegivel(horas: number | null): string {
  if (horas == null) return "—";
  if (horas < 1) return `${Math.round(horas * 60)} min`;
  if (horas < 48) return `${horas.toFixed(1)} h`;
  return `${(horas / 24).toFixed(1)} dias`;
}

function Funil({
  etapas,
}: {
  etapas: {
    etapa: string;
    valor: number | null;
    disponivel: boolean;
    quedaPct: number | null;
  }[];
}) {
  const max = Math.max(1, ...etapas.map((e) => e.valor ?? 0));
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="text-sm font-medium text-muted-foreground">Funil de aquisição</h2>
      <div className="mt-4 space-y-3">
        {etapas.map((e, i) => {
          const largura = e.valor == null ? 0 : Math.max(4, (e.valor / max) * 100);
          return (
            <div key={e.etapa}>
              {i > 0 && e.quedaPct != null ? (
                <p className="mb-1 pl-1 text-xs text-muted-foreground">
                  ▼ {e.quedaPct.toFixed(0)}% de queda
                </p>
              ) : null}
              <div className="flex items-center gap-3">
                <div className="h-9 flex-1 overflow-hidden rounded-md bg-muted">
                  <div
                    className={cn(
                      "flex h-full items-center rounded-md px-3 text-sm font-medium transition-[width] duration-700 ease-out",
                      e.disponivel
                        ? "bg-primary/15 text-foreground"
                        : "bg-transparent text-muted-foreground",
                    )}
                    style={{ width: `${largura}%` }}
                  >
                    <span className="truncate">{e.etapa}</span>
                  </div>
                </div>
                <div className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums">
                  {e.valor == null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <NumberTicker value={e.valor} />
                  )}
                </div>
              </div>
              {!e.disponivel ? (
                <p className="mt-1 pl-1 text-xs text-muted-foreground/70">
                  fonte externa (Notion / Hub Central)
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BarraDupla({
  titulo,
  a,
  b,
}: {
  titulo: string;
  a: { rotulo: string; valor: number; cor: string };
  b: { rotulo: string; valor: number; cor: string };
}) {
  const total = a.valor + b.valor;
  const pa = total ? (a.valor / total) * 100 : 0;
  return (
    <div>
      <p className="text-sm text-muted-foreground">{titulo}</p>
      <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-muted">
        <div style={{ width: `${pa}%`, backgroundColor: a.cor }} />
        <div style={{ width: `${100 - pa}%`, backgroundColor: b.cor }} />
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
        <span>
          {a.rotulo}: <span className="font-medium text-foreground">{a.valor}</span>
        </span>
        <span>
          {b.rotulo}: <span className="font-medium text-foreground">{b.valor}</span>
        </span>
      </div>
    </div>
  );
}

function Admin() {
  const buscar = useServerFn(carregarAdmin);
  const { data, isLoading } = useQuery({ queryKey: ["admin"], queryFn: () => buscar() });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Operação</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão agregada da base — só você vê esta tela.
        </p>
      </header>

      <BlurFade className="mt-8 block">
        <Funil etapas={data?.funil ?? []} />
      </BlurFade>

      <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            titulo: "Taxa de recuperação agregada",
            valor: isLoading ? null : (data?.recuperacao.pct ?? null),
            format: (n: number) => `${n.toFixed(0)}%`,
            detalhe: data
              ? `${data.recuperacao.recuperadas} de ${data.recuperacao.base} atrasadas com lembrete`
              : undefined,
            destaque: true,
          },
          {
            titulo: "Ativação (contas com cobrança)",
            valor: isLoading ? null : (data?.ativacao.pctComCobranca ?? null),
            format: (n: number) => `${n.toFixed(0)}%`,
            detalhe: data
              ? `1ª cobrança em ${tempoLegivel(data.ativacao.horasAtePrimeiraCobranca)}`
              : undefined,
          },
          {
            titulo: "Cobranças na plataforma",
            valor: isLoading ? null : (data?.uso.totalCobrancas ?? 0),
            detalhe: data ? `${data.uso.totalClientes} clientes cadastrados` : undefined,
          },
          {
            titulo: "Usuários ativos na semana",
            valor: isLoading ? null : (data?.uso.usuariosAtivosSemana ?? 0),
            detalhe: data
              ? `${(data.uso.mediaCobrancasPorAtivo ?? 0).toFixed(1)} cobranças/ativo`
              : undefined,
          },
          {
            titulo: "Taxa de falha de envio",
            valor: isLoading ? null : (data?.envio.taxaFalha ?? null),
            format: (n: number) => `${n.toFixed(1)}%`,
            detalhe: data ? `${data.envio.total} envios no total` : undefined,
          },
          {
            titulo: "Retenção (semana 1 → 3)",
            valor: isLoading ? null : (data?.retencao.pct ?? null),
            format: (n: number) => `${n.toFixed(0)}%`,
            detalhe: data
              ? data.retencao.cohort
                ? `cohort de ${data.retencao.cohort}`
                : "dados insuficientes"
              : undefined,
          },
        ].map((m, i) => (
          <BlurFade key={m.titulo} delay={i * 0.05}>
            <MetricCard
              titulo={m.titulo}
              valor={m.valor}
              format={m.format}
              detalhe={m.detalhe}
              destaque={m.destaque}
            />
          </BlurFade>
        ))}
      </section>

      <BlurFade inView className="mt-4 block">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-medium text-muted-foreground">Saúde de envio</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <BarraDupla
              titulo="Entregas"
              a={{
                rotulo: "Enviados",
                valor: data?.envio.enviados ?? 0,
                cor: "var(--color-chart-1)",
              }}
              b={{
                rotulo: "Falhas",
                valor: data?.envio.falhas ?? 0,
                cor: "var(--color-destructive)",
              }}
            />
            <BarraDupla
              titulo="Por tipo de mensagem"
              a={{
                rotulo: "Lembrete",
                valor: data?.envio.lembretes ?? 0,
                cor: "var(--color-chart-1)",
              }}
              b={{
                rotulo: "Cobrança atrasada",
                valor: data?.envio.cobrancasAtrasadas ?? 0,
                cor: "var(--color-chart-5)",
              }}
            />
          </div>
        </div>
      </BlurFade>

      <p className="mt-6 text-xs text-muted-foreground/70">
        Enquanto o app é de uso interno, "todos os usuários" = sua conta. As duas primeiras etapas
        do funil dependem de dados do Notion / Hub Central e entram quando essa integração existir.
      </p>
    </main>
  );
}
