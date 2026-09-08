import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  Lock,
  MessageCircle,
  Pencil,
  Send,
  Sparkles,
  Trash2,
  UserPlus,
} from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { MetricCard } from "@/components/metric-card";
import { CobrancaDialog } from "@/components/cobranca-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  carregarPainel,
  criarCliente,
  excluirCliente,
  excluirCobranca,
  marcarComoPaga,
  reabrirCobranca,
  rodarCobrancas,
} from "@/lib/cobranca.functions";
import { formatarBRL } from "@/lib/moeda";
import { dataHoraSP, hojeSP } from "@/lib/datas";
import { linkWhats, mensagemWhats, telefoneWhats } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Cobrança Certa | Lembretes automáticos" },
      {
        name: "description",
        content:
          "Painel de cobranças por projeto: total a receber, atrasos, taxa de recuperação e lembretes automáticos por e-mail.",
      },
      { property: "og:title", content: "Cobrança Certa" },
      {
        property: "og:description",
        content: "Acompanhe cobranças, atrasos e lembretes automáticos em um só painel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Painel,
});

const moeda = formatarBRL;

const dataBR = (iso: string) => {
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
};

const dataHoraBR = dataHoraSP;

function Painel() {
  const queryClient = useQueryClient();
  const buscar = useServerFn(carregarPainel);
  const fnCliente = useServerFn(criarCliente);
  const fnPaga = useServerFn(marcarComoPaga);
  const fnReabrir = useServerFn(reabrirCobranca);
  const fnExcluir = useServerFn(excluirCliente);
  const fnExcluirCobranca = useServerFn(excluirCobranca);
  const fnRodar = useServerFn(rodarCobrancas);

  const { data, isLoading } = useQuery({
    queryKey: ["painel"],
    queryFn: () => buscar(),
  });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["painel"] });

  const [clienteAberto, setClienteAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [emailCliente, setEmailCliente] = useState("");
  const [whatsCliente, setWhatsCliente] = useState("");

  const mCliente = useMutation({
    mutationFn: () =>
      fnCliente({ data: { nome, email: emailCliente, whatsapp: whatsCliente.trim() } }),
    onSuccess: () => {
      setNome("");
      setEmailCliente("");
      setWhatsCliente("");
      setClienteAberto(false);
      toast.success("Cliente cadastrado");
      invalidar();
    },
    onError: (e: Error) => toast.error("Erro ao cadastrar", { description: e.message }),
  });

  const mExcluirCobranca = useMutation({
    mutationFn: (id: string) => fnExcluirCobranca({ data: { id } }),
    onSuccess: () => {
      toast.success("Cobrança excluída");
      invalidar();
    },
    onError: (e: Error) => toast.error("Não foi possível excluir", { description: e.message }),
  });

  const mPaga = useMutation({
    mutationFn: (id: string) => fnPaga({ data: { id } }),
    onSuccess: (r) => {
      toast.success("Cobrança marcada como paga", {
        description: r.proximoVencimento
          ? `Próxima cobrança gerada para ${dataBR(r.proximoVencimento)}.`
          : undefined,
      });
      invalidar();
    },
  });

  const mReabrir = useMutation({
    mutationFn: (id: string) => fnReabrir({ data: { id } }),
    onSuccess: invalidar,
  });

  const mExcluir = useMutation({
    mutationFn: (id: string) => fnExcluir({ data: { id } }),
    onSuccess: (r) => {
      toast.success("Cliente excluído", {
        description: r.cobrancasRemovidas
          ? `${r.cobrancasRemovidas} cobrança(s) removida(s) junto.`
          : undefined,
      });
      invalidar();
    },
    onError: (e: Error) => toast.error("Não foi possível excluir", { description: e.message }),
  });

  const mRodar = useMutation({
    mutationFn: () => fnRodar({ data: undefined }),
    onSuccess: (r) => {
      if (r.emailPendente) {
        toast.warning("Domínio de e-mail ainda não configurado", {
          description: `${r.elegiveis} cobrança(s) prontas para envio assim que o e-mail estiver ativo.`,
        });
      } else if (r.elegiveis === 0) {
        toast.info("Nenhuma cobrança elegível hoje");
      } else {
        toast.success(`${r.enviados} envio(s) realizados`, {
          description: r.falhas ? `${r.falhas} falha(s)` : undefined,
        });
      }
      invalidar();
    },
    onError: (e: Error) => toast.error("Falha na rotina", { description: e.message }),
  });

  const hoje = hojeSP();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Painel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lembretes de pagamento para serviços pontuais.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={clienteAberto} onOpenChange={setClienteAberto}>
            <DialogTrigger asChild>
              <Button variant="outline">Novo cliente</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo cliente</DialogTitle>
                <DialogDescription>
                  Nome e e-mail para as cobranças. WhatsApp é opcional (usado no envio assistido).
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    maxLength={120}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-cliente">E-mail</Label>
                  <Input
                    id="email-cliente"
                    type="email"
                    value={emailCliente}
                    onChange={(e) => setEmailCliente(e.target.value)}
                    maxLength={255}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whats-cliente">WhatsApp (opcional)</Label>
                  <Input
                    id="whats-cliente"
                    inputMode="tel"
                    value={whatsCliente}
                    onChange={(e) => setWhatsCliente(e.target.value)}
                    maxLength={20}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => mCliente.mutate()}
                  disabled={!nome.trim() || !emailCliente.trim() || mCliente.isPending}
                >
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <CobrancaDialog
            clientes={data?.clientes ?? []}
            trigger={<Button>Nova cobrança</Button>}
          />
        </div>
      </header>

      {!isLoading && (data?.clientes.length ?? 0) === 0 ? (
        <BlurFade delay={0.04}>
          <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">Bem-vindo! Vamos começar.</p>
                <p className="text-sm text-muted-foreground">
                  Cadastre seu primeiro cliente e depois a primeira cobrança dele.
                </p>
              </div>
            </div>
            <Button onClick={() => setClienteAberto(true)}>Cadastrar meu primeiro cliente</Button>
          </section>
        </BlurFade>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            titulo: "Total a Receber",
            valor: isLoading ? null : (data?.metricas.totalAReceber ?? 0),
            format: moeda,
          },
          {
            titulo: "Total em Atraso",
            valor: isLoading ? null : (data?.metricas.totalEmAtraso ?? 0),
            format: moeda,
          },
          {
            titulo: "Taxa de Recuperação",
            valor:
              isLoading || data?.metricas.taxaRecuperacao == null
                ? null
                : data.metricas.taxaRecuperacao,
            format: (n: number) => `${n.toFixed(0)}%`,
            detalhe: "Atrasadas pagas após um lembrete",
            destaque: true,
          },
          {
            titulo: "Recebido no Mês",
            valor: isLoading ? null : (data?.metricas.recebidoNoMes ?? 0),
            format: moeda,
          },
        ].map((m, i) => (
          <BlurFade key={m.titulo} delay={i * 0.06}>
            <MetricCard {...m} />
          </BlurFade>
        ))}
      </section>

      <BlurFade delay={0.28}>
        <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">
            Disparo manual durante a validação: o envio automático diário entra depois desta fase.
          </p>
          <TooltipProvider delayDuration={100}>
            <div className="flex flex-wrap gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    onClick={() => mRodar.mutate()}
                    disabled={mRodar.isPending}
                  >
                    {mRodar.isPending ? "Rodando..." : "Rodar cobranças agora"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Envia por e-mail os lembretes e cobranças que estiverem no ponto.
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="inline-flex">
                    <Button variant="outline" disabled className="gap-2">
                      <Lock className="size-4" />
                      Enviar para o WhatsApp
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Em breve</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </section>
      </BlurFade>

      {(data?.proximosEnvios?.length ?? 0) > 0 ? (
        <BlurFade inView className="mt-10 block">
          <h2 className="text-lg font-medium text-foreground">Próximos envios</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            O que a próxima rodada vai disparar — confira antes de rodar.
          </p>
          <ul className="mt-3 divide-y rounded-xl border bg-card">
            {(data?.proximosEnvios ?? []).map((p, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="min-w-0">
                  <span className="font-medium text-foreground">{p.cliente_nome}</span>
                  {p.descricao ? (
                    <span className="ml-2 text-muted-foreground">{p.descricao}</span>
                  ) : null}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge variant={p.tipo === "lembrete" ? "outline" : "destructive"}>
                    {p.tipo === "lembrete" ? "Lembrete" : "Cobrança firme"}
                  </Badge>
                  <span className="text-muted-foreground">{p.quando}</span>
                </span>
              </li>
            ))}
          </ul>
        </BlurFade>
      ) : null}

      <BlurFade inView className="mt-10 block">
        <h2 className="text-lg font-medium text-foreground">Cobranças</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última ação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.cobrancas ?? []).map((c) => {
                const atrasada = c.status !== "pago" && c.vencimento < hoje;
                const tel = telefoneWhats(c.cliente_whatsapp);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <span className="flex flex-wrap items-center gap-1.5">
                        {c.cliente_nome}
                        {c.frequencia !== "unica" ? (
                          <Badge variant="outline" className="font-normal capitalize">
                            {c.frequencia}
                          </Badge>
                        ) : null}
                      </span>
                      {c.descricao ? (
                        <div className="text-xs font-normal text-muted-foreground">
                          {c.descricao}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>{moeda(c.valor)}</TableCell>
                    <TableCell>{dataBR(c.vencimento)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.status === "pago" ? "secondary" : atrasada ? "destructive" : "outline"
                        }
                      >
                        {c.status === "pago" ? "Pago" : atrasada ? "Em atraso" : "Pendente"}
                      </Badge>
                      {atrasada && c.dias_atraso > 0 ? (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {c.dias_atraso} dia{c.dias_atraso > 1 ? "s" : ""}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.ultima_acao ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {c.status !== "pago" && tel ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-muted-foreground hover:text-foreground"
                            aria-label="Enviar no WhatsApp"
                            onClick={() =>
                              window.open(
                                linkWhats(
                                  tel,
                                  mensagemWhats({
                                    nomeCliente: c.cliente_nome,
                                    valor: c.valor,
                                    vencimento: c.vencimento,
                                    descricao: c.descricao,
                                    instrucoesPagamento: data?.instrucoesPagamento ?? "",
                                  }),
                                ),
                                "_blank",
                                "noopener",
                              )
                            }
                          >
                            <MessageCircle className="size-4" />
                          </Button>
                        ) : null}
                        <CobrancaDialog
                          clientes={data?.clientes ?? []}
                          cobranca={c}
                          trigger={
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              aria-label="Editar cobrança"
                            >
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                        {c.status === "pago" ? (
                          <Button size="sm" variant="ghost" onClick={() => mReabrir.mutate(c.id)}>
                            Reabrir
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => mPaga.mutate(c.id)}>
                            Marcar paga
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8 text-muted-foreground hover:text-destructive"
                              aria-label="Excluir cobrança"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir esta cobrança?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Remove a cobrança de {c.cliente_nome} ({moeda(c.valor)}) e os envios
                                ligados a ela. Não dá para desfazer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => mExcluirCobranca.mutate(c.id)}
                                className="bg-destructive text-white hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!isLoading && (data?.cobrancas.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
                      <FileText className="size-8 text-muted-foreground/50" />
                      {(data?.clientes.length ?? 0) === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Cadastre um cliente primeiro — depois é só criar a cobrança dele.
                        </p>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">
                            Nenhuma cobrança cadastrada ainda.
                          </p>
                          <CobrancaDialog
                            clientes={data?.clientes ?? []}
                            trigger={<Button size="sm">Cadastrar primeira cobrança</Button>}
                          />
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </BlurFade>

      <BlurFade inView className="mt-10 block">
        <h2 className="text-lg font-medium text-foreground">Rastreio dos envios</h2>
        <div className="mt-3 overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status do envio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.envios ?? []).map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{dataHoraBR(e.data_envio)}</TableCell>
                  <TableCell>{e.cliente_nome}</TableCell>
                  <TableCell>{e.tipo === "lembrete" ? "Lembrete" : "Cobrança"}</TableCell>
                  <TableCell>
                    <Badge variant={e.status_envio === "enviado" ? "secondary" : "destructive"}>
                      {e.status_envio === "enviado" ? "Enviado" : "Falhou"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && (data?.envios.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center">
                    <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
                      <Send className="size-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        {(data?.cobrancas.length ?? 0) === 0
                          ? "Assim que você cadastrar uma cobrança e ela for enviada, o histórico aparece aqui."
                          : 'Nenhum envio ainda. Clique em "Rodar cobranças agora" quando tiver um vencimento pra testar.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </BlurFade>

      <BlurFade inView className="mt-10 mb-4 block">
        <h2 className="text-lg font-medium text-foreground">Clientes</h2>
        {(data?.clientes.length ?? 0) === 0 ? (
          !isLoading ? (
            <div className="mt-3 flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/40 p-8 text-center">
              <UserPlus className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Nenhum cliente cadastrado ainda. Cadastre quem você cobra pra começar.
              </p>
              <Button size="sm" onClick={() => setClienteAberto(true)}>
                Novo cliente
              </Button>
            </div>
          ) : null
        ) : (
          <ul className="mt-3 divide-y rounded-xl border bg-card">
            {(data?.clientes ?? []).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="min-w-0">
                  <span className="font-medium text-foreground">{c.nome}</span>
                  <span className="ml-2 text-muted-foreground">{c.email}</span>
                  {c.whatsapp ? (
                    <span className="ml-2 text-muted-foreground">· WhatsApp {c.whatsapp}</span>
                  ) : null}
                </span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Excluir ${c.nome}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir {c.nome}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso remove o cliente e também todas as cobranças e envios ligados a ele.
                        Não dá para desfazer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => mExcluir.mutate(c.id)}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </li>
            ))}
          </ul>
        )}
      </BlurFade>
    </main>
  );
}
