import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { abrirTicket, meusTickets } from "@/lib/tickets.functions";
import { useMeuPerfil } from "@/lib/use-meu-perfil";
import { dataHoraSP } from "@/lib/datas";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/suporte")({
  head: () => ({ meta: [{ title: "Suporte | Cobrança Certa" }] }),
  component: Suporte,
});

function Suporte() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const enviar = useServerFn(abrirTicket);
  const buscar = useServerFn(meusTickets);

  const { data: perfil } = useMeuPerfil(user.id);
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["meus-tickets"],
    queryFn: () => buscar(),
  });

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState(user.email ?? "");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    if (perfil?.nome && !nome) setNome(perfil.nome);
  }, [perfil, nome]);

  const m = useMutation({
    mutationFn: () =>
      enviar({ data: { nome: nome.trim(), email: email.trim(), mensagem: mensagem.trim() } }),
    onSuccess: () => {
      setMensagem("");
      toast.success("Chamado aberto", { description: "Vamos responder assim que possível." });
      queryClient.invalidateQueries({ queryKey: ["meus-tickets"] });
    },
    onError: (e: Error) => toast.error("Não foi possível abrir", { description: e.message }),
  });

  const podeEnviar =
    nome.trim().length >= 1 && /\S+@\S+\.\S+/.test(email.trim()) && mensagem.trim().length >= 1;

  const lista = tickets ?? [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Suporte</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Abra um chamado e acompanhe o status aqui mesmo.
        </p>
      </header>

      <BlurFade className="mt-8 block">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sup-nome">Nome</Label>
                <Input
                  id="sup-nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength={120}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sup-email">E-mail</Label>
                <Input
                  id="sup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-msg">Mensagem</Label>
              <Textarea
                id="sup-msg"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                rows={5}
                maxLength={4000}
                placeholder="Descreva o que está acontecendo..."
                className="resize-y"
                required
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => m.mutate()} disabled={!podeEnviar || m.isPending}>
                {m.isPending ? "Enviando..." : "Abrir chamado"}
              </Button>
            </div>
          </div>
        </div>
      </BlurFade>

      <BlurFade inView className="mt-8 block">
        <h2 className="text-lg font-medium text-foreground">Seus chamados</h2>
        <div className="mt-3 space-y-3">
          {lista.map((t) => (
            <div key={t.id} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant={t.status === "concluido" ? "secondary" : "outline"}>
                  {t.status === "concluido" ? "Concluído" : "Aberto"}
                </Badge>
                <span className="text-xs text-muted-foreground">{dataHoraSP(t.criadoEm)}</span>
              </div>
              <p className="mt-2 text-sm whitespace-pre-line text-foreground">{t.mensagem}</p>
              {t.status === "concluido" && t.respostaAdmin ? (
                <div className="mt-3 rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Resposta do suporte</p>
                  <p className="mt-1 text-sm whitespace-pre-line text-foreground">
                    {t.respostaAdmin}
                  </p>
                </div>
              ) : null}
            </div>
          ))}
          {!isLoading && lista.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              Você ainda não abriu nenhum chamado.
            </div>
          ) : null}
        </div>
      </BlurFade>
    </main>
  );
}
