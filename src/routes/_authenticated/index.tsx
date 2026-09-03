import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  carregarPainel,
  criarCliente,
  criarCobranca,
  marcarComoPaga,
  reabrirCobranca,
  rodarCobrancas,
} from "@/lib/cobranca.functions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
      { title: "Controle de Cobrança | Lembretes automáticos" },
      {
        name: "description",
        content:
          "Painel de cobranças por projeto: total a receber, atrasos, taxa de recuperação e lembretes automáticos por e-mail.",
      },
      { property: "og:title", content: "Controle de Cobrança" },
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

const moeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dataBR = (iso: string) => {
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
};

const dataHoraBR = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

function Card({ titulo, valor, detalhe }: { titulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{titulo}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{valor}</p>
      {detalhe ? <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p> : null}
    </div>
  );
}

function Painel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const buscar = useServerFn(carregarPainel);
  const fnCliente = useServerFn(criarCliente);
  const fnCobranca = useServerFn(criarCobranca);
  const fnPaga = useServerFn(marcarComoPaga);
  const fnReabrir = useServerFn(reabrirCobranca);
  const fnRodar = useServerFn(rodarCobrancas);

  const { data, isLoading } = useQuery({
    queryKey: ["painel"],
    queryFn: () => buscar(),
  });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["painel"] });

  const [clienteAberto, setClienteAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [emailCliente, setEmailCliente] = useState("");

  const [cobrancaAberta, setCobrancaAberta] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState("");

  const mCliente = useMutation({
    mutationFn: () => fnCliente({ data: { nome, email: emailCliente } }),
    onSuccess: () => {
      setNome("");
      setEmailCliente("");
      setClienteAberto(false);
      toast.success("Cliente cadastrado");
      invalidar();
    },
    onError: (e: Error) => toast.error("Erro ao cadastrar", { description: e.message }),
  });

  const mCobranca = useMutation({
    mutationFn: () =>
      fnCobranca({
        data: {
          cliente_id: clienteId,
          valor: Number(valor.replace(",", ".")),
          vencimento,
        },
      }),
    onSuccess: () => {
      setClienteId("");
      setValor("");
      setVencimento("");
      setCobrancaAberta(false);
      toast.success("Cobrança cadastrada");
      invalidar();
    },
    onError: (e: Error) => toast.error("Erro ao cadastrar", { description: e.message }),
  });

  const mPaga = useMutation({
    mutationFn: (id: string) => fnPaga({ data: { id } }),
    onSuccess: () => {
      toast.success("Cobrança marcada como paga");
      invalidar();
    },
  });

  const mReabrir = useMutation({
    mutationFn: (id: string) => fnReabrir({ data: { id } }),
    onSuccess: invalidar,
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

  const hoje = new Date().toISOString().slice(0, 10);

  async function sair() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Controle de Cobrança
          </h1>
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
                <DialogDescription>Nome e e-mail para envio das cobranças.</DialogDescription>
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

          <Dialog open={cobrancaAberta} onOpenChange={setCobrancaAberta}>
            <DialogTrigger asChild>
              <Button>Nova cobrança</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova cobrança</DialogTitle>
                <DialogDescription>Cliente, valor e data de vencimento.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select value={clienteId} onValueChange={setClienteId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {(data?.clientes ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input
                    id="valor"
                    inputMode="decimal"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="1500,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vencimento">Vencimento</Label>
                  <Input
                    id="vencimento"
                    type="date"
                    value={vencimento}
                    onChange={(e) => setVencimento(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => mCobranca.mutate()}
                  disabled={
                    !clienteId || !valor || !vencimento || mCobranca.isPending
                  }
                >
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" onClick={sair}>
            Sair
          </Button>
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          titulo="Total a Receber"
          valor={isLoading ? "—" : moeda(data?.metricas.totalAReceber ?? 0)}
        />
        <Card
          titulo="Total em Atraso"
          valor={isLoading ? "—" : moeda(data?.metricas.totalEmAtraso ?? 0)}
        />
        <Card
          titulo="Taxa de Recuperação"
          valor={
            isLoading || data?.metricas.taxaRecuperacao == null
              ? "—"
              : `${data.metricas.taxaRecuperacao.toFixed(0)}%`
          }
          detalhe="Atrasadas pagas após um lembrete"
        />
        <Card
          titulo="Recebido no Mês"
          valor={isLoading ? "—" : moeda(data?.metricas.recebidoNoMes ?? 0)}
        />
      </section>

      <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed bg-muted/40 p-4">
        <p className="text-sm text-muted-foreground">
          Disparo manual durante a validação: o envio automático diário entra depois desta fase.
        </p>
        <Button variant="secondary" onClick={() => mRodar.mutate()} disabled={mRodar.isPending}>
          {mRodar.isPending ? "Rodando..." : "Rodar cobranças agora"}
        </Button>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium text-foreground">Cobranças</h2>
        <div className="mt-3 overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última ação</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.cobrancas ?? []).map((c) => {
                const atrasada = c.status !== "pago" && c.vencimento < hoje;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.cliente_nome}</TableCell>
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
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.ultima_acao ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {c.status === "pago" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => mReabrir.mutate(c.id)}
                        >
                          Reabrir
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => mPaga.mutate(c.id)}>
                          Marcar paga
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!isLoading && (data?.cobrancas.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Nenhuma cobrança cadastrada ainda.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium text-foreground">Log de envios</h2>
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
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Nenhum envio registrado ainda.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </section>

      {(data?.clientes.length ?? 0) > 0 ? (
        <section className="mt-10 mb-4">
          <h2 className="text-lg font-medium text-foreground">Clientes</h2>
          <ul className="mt-3 divide-y rounded-xl border bg-card">
            {(data?.clientes ?? []).map((c) => (
              <li key={c.id} className="flex justify-between px-4 py-3 text-sm">
                <span className="font-medium text-foreground">{c.nome}</span>
                <span className="text-muted-foreground">{c.email}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
