import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EMAIL_AUTORIZADO } from "@/lib/acesso";
import { carregarPerfil, salvarPerfil } from "@/lib/perfil.functions";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações | Cobrança Certa" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if ((data.user?.email ?? "").toLowerCase() !== EMAIL_AUTORIZADO) {
      throw redirect({ to: "/" });
    }
  },
  component: Configuracoes,
});

function Configuracoes() {
  const queryClient = useQueryClient();
  const buscar = useServerFn(carregarPerfil);
  const fnSalvar = useServerFn(salvarPerfil);

  const { data, isLoading } = useQuery({
    queryKey: ["perfil"],
    queryFn: () => buscar(),
  });

  const [instrucoes, setInstrucoes] = useState("");
  const [tocado, setTocado] = useState(false);

  useEffect(() => {
    if (data && !tocado) setInstrucoes(data.instrucoesPagamento);
  }, [data, tocado]);

  const mSalvar = useMutation({
    mutationFn: () => fnSalvar({ data: { instrucoesPagamento: instrucoes.trim() } }),
    onSuccess: () => {
      setTocado(false);
      toast.success("Configurações salvas");
      queryClient.invalidateQueries({ queryKey: ["perfil"] });
    },
    onError: (e: Error) => toast.error("Não foi possível salvar", { description: e.message }),
  });

  const sujo = tocado && instrucoes.trim() !== (data?.instrucoesPagamento ?? "");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajustes que se aplicam a todas as suas cobranças.
        </p>
      </header>

      <BlurFade className="mt-8 block">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <Label htmlFor="instrucoes" className="text-base font-medium">
            Instruções de pagamento
          </Label>
          <p className="mt-1 text-sm text-muted-foreground">
            Entram no rodapé de todo e-mail de lembrete e de cobrança. Coloque sua chave Pix, dados
            bancários ou o passo a passo que o cliente deve seguir para pagar.
          </p>
          <Textarea
            id="instrucoes"
            value={instrucoes}
            onChange={(e) => {
              setInstrucoes(e.target.value);
              setTocado(true);
            }}
            disabled={isLoading}
            rows={5}
            maxLength={2000}
            placeholder={
              "Ex.: Pix (chave e-mail): voce@exemplo.com\nBanco 000 · Ag 0001 · CC 12345-6"
            }
            className="mt-3 resize-y"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{instrucoes.length}/2000</span>
            <Button onClick={() => mSalvar.mutate()} disabled={!sujo || mSalvar.isPending}>
              {mSalvar.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </BlurFade>

      {instrucoes.trim() ? (
        <BlurFade delay={0.08} className="mt-4 block">
          <div className="rounded-xl border bg-muted/40 p-5">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Prévia no e-mail
            </p>
            <div className="mt-2 rounded-lg border bg-background p-4 text-sm">
              <p className="text-muted-foreground">…corpo da mensagem…</p>
              <hr className="my-3 border-border" />
              <p className="font-medium text-foreground">Como pagar</p>
              <p className="mt-1 whitespace-pre-line text-muted-foreground">{instrucoes.trim()}</p>
            </div>
          </div>
        </BlurFade>
      ) : null}
    </main>
  );
}
