import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { EMAIL_AUTORIZADO } from "@/lib/acesso";
import { carregarAdmin } from "@/lib/admin.functions";
import { formatarBRL } from "@/lib/moeda";
import { dataHoraSP } from "@/lib/datas";
import { Star } from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { MetricCard } from "@/components/metric-card";
import { ConcluirTicketDialog } from "@/components/concluir-ticket-dialog";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Admin | Cobrança Certa" }],
  }),
  beforeLoad: async () => {
    // A operação é só da conta admin — trava própria além do guard de
    // /_authenticated e da RLS.
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

  const cards = [
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
      titulo: "Valor total na base",
      valor: isLoading ? null : (data?.uso.valorTotalBase ?? 0),
      format: formatarBRL,
      detalhe: data
        ? `ticket médio ${data.uso.ticketMedio == null ? "—" : formatarBRL(data.uso.ticketMedio)}`
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
  ];

  const usuarios = data?.usuarios ?? [];
  const feedback = data?.feedback ?? [];
  const tickets = data?.tickets ?? [];
  const ticketsAbertos = tickets.filter((t) => t.status === "aberto");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Métricas internas de validação, agregadas em toda a base. Só você vê — o usuário acompanha
          as cobranças dele no Painel.
        </p>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((m, i) => (
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

      <BlurFade inView className="mt-4 block">
        <h2 className="text-lg font-medium text-foreground">Usuários da plataforma</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Quem se cadastrou, o que já usou e se esteve ativo nos últimos 7 dias.
        </p>
        <div className="mt-3 overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="text-right">Clientes</TableHead>
                <TableHead className="text-right">Cobranças</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{u.nome}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.criadoEm ? dataHoraSP(u.criadoEm) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{u.clientes}</TableCell>
                  <TableCell className="text-right tabular-nums">{u.cobrancas}</TableCell>
                  <TableCell>
                    <Badge variant={u.ativo7d ? "secondary" : "outline"}>
                      {u.ativo7d ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Nenhum usuário cadastrado ainda.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </BlurFade>

      <BlurFade inView className="mt-4 mb-4 block">
        <h2 className="text-lg font-medium text-foreground">Feedback dos usuários</h2>
        <div className="mt-3 space-y-3">
          {feedback.map((f) => (
            <div key={f.id} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-sm font-medium text-foreground">{f.nome}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{f.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  {f.estrelas ? (
                    <span className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={cn(
                            "size-4",
                            n <= f.estrelas!
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30",
                          )}
                        />
                      ))}
                    </span>
                  ) : null}
                  <span className="text-xs text-muted-foreground">{dataHoraSP(f.criadoEm)}</span>
                </div>
              </div>
              {f.mensagem ? (
                <p className="mt-2 text-sm whitespace-pre-line text-foreground">{f.mensagem}</p>
              ) : null}
            </div>
          ))}
          {!isLoading && feedback.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              Nenhum feedback recebido ainda.
            </div>
          ) : null}
        </div>
      </BlurFade>

      <BlurFade inView className="mt-8 mb-4 block">
        <h2 className="text-lg font-medium text-foreground">
          Chamados de suporte
          {ticketsAbertos.length > 0 ? (
            <Badge variant="outline" className="ml-2 font-normal">
              {ticketsAbertos.length} aberto{ticketsAbertos.length > 1 ? "s" : ""}
            </Badge>
          ) : null}
        </h2>
        <div className="mt-3 space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-sm font-medium text-foreground">{t.nome}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{t.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={t.status === "concluido" ? "secondary" : "outline"}>
                    {t.status === "concluido" ? "Concluído" : "Aberto"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{dataHoraSP(t.criadoEm)}</span>
                </div>
              </div>
              <p className="mt-2 text-sm whitespace-pre-line text-foreground">{t.mensagem}</p>
              {t.status === "concluido" && t.respostaAdmin ? (
                <div className="mt-3 rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Sua resposta</p>
                  <p className="mt-1 text-sm whitespace-pre-line text-foreground">
                    {t.respostaAdmin}
                  </p>
                </div>
              ) : null}
              {t.status === "aberto" ? (
                <div className="mt-3">
                  <ConcluirTicketDialog
                    ticketId={t.id}
                    trigger={
                      <Button size="sm" variant="outline">
                        Marcar como concluído
                      </Button>
                    }
                  />
                </div>
              ) : null}
            </div>
          ))}
          {!isLoading && tickets.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              Nenhum chamado aberto.
            </div>
          ) : null}
        </div>
      </BlurFade>
    </main>
  );
}
