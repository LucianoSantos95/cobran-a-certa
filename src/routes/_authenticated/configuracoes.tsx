import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EMAIL_AUTORIZADO } from "@/lib/acesso";
import { carregarPerfil, salvarPerfil } from "@/lib/perfil.functions";
import { useMeuPerfil } from "@/lib/use-meu-perfil";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Minha conta | Cobrança Certa" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if ((data.user?.email ?? "").toLowerCase() !== EMAIL_AUTORIZADO) {
      throw redirect({ to: "/" });
    }
  },
  component: Configuracoes,
});

function PerfilCard() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: perfil } = useMeuPerfil(user.id);

  const [nome, setNome] = useState("");
  const [nomeTocado, setNomeTocado] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [senha1, setSenha1] = useState("");
  const [senha2, setSenha2] = useState("");
  const [trocandoSenha, setTrocandoSenha] = useState(false);

  useEffect(() => {
    if (perfil && !nomeTocado) setNome(perfil.nome ?? "");
  }, [perfil, nomeTocado]);

  const invalidarPerfil = () => {
    queryClient.invalidateQueries({ queryKey: ["meu-perfil"] });
  };

  const mNome = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ nome: nome.trim() })
        .eq("id", user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setNomeTocado(false);
      toast.success("Nome atualizado");
      invalidarPerfil();
    },
    onError: (e: Error) => toast.error("Não foi possível salvar", { description: e.message }),
  });

  async function trocarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Escolha um arquivo de imagem");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 3 MB)");
      return;
    }
    setEnviandoFoto(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const up = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (up.error) throw new Error(up.error.message);
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${pub.publicUrl}?v=${Date.now()}`;
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user.id);
      if (error) throw new Error(error.message);
      toast.success("Foto atualizada");
      invalidarPerfil();
    } catch (err) {
      toast.error("Não foi possível enviar a foto", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function alterarSenha() {
    if (senha1.length < 6) {
      toast.error("A senha precisa de ao menos 6 caracteres");
      return;
    }
    if (senha1 !== senha2) {
      toast.error("As senhas não coincidem");
      return;
    }
    setTrocandoSenha(true);
    const { error } = await supabase.auth.updateUser({ password: senha1 });
    setTrocandoSenha(false);
    if (error) {
      toast.error("Não foi possível alterar a senha", { description: error.message });
      return;
    }
    setSenha1("");
    setSenha2("");
    toast.success("Senha alterada");
  }

  const nomeSujo = nomeTocado && nome.trim() !== (perfil?.nome ?? "");
  const iniciais = (nome.trim()[0] || (user.email ?? "?")[0] || "?").toUpperCase();

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="text-base font-medium text-foreground">Seu perfil</h2>
      <p className="mt-1 text-sm text-muted-foreground">Nome, foto e senha da sua conta.</p>

      <div className="mt-4 flex items-center gap-4">
        <Avatar className="size-16">
          {perfil?.avatar_url ? <AvatarImage src={perfil.avatar_url} alt={nome} /> : null}
          <AvatarFallback className="text-lg">{iniciais}</AvatarFallback>
        </Avatar>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={enviandoFoto}
          >
            {enviandoFoto ? "Enviando..." : "Trocar foto"}
          </Button>
          <p className="mt-1 text-xs text-muted-foreground">PNG ou JPG, até 3 MB.</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={trocarFoto}
          />
        </div>
      </div>

      <div className="mt-5 max-w-sm space-y-2">
        <Label htmlFor="nome-perfil">Nome</Label>
        <Input
          id="nome-perfil"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            setNomeTocado(true);
          }}
          maxLength={120}
          placeholder="Como você quer ser chamado"
        />
        <div className="pt-1">
          <Button size="sm" onClick={() => mNome.mutate()} disabled={!nomeSujo || mNome.isPending}>
            {mNome.isPending ? "Salvando..." : "Salvar nome"}
          </Button>
        </div>
      </div>

      <div className="mt-6 border-t pt-5">
        <p className="text-sm font-medium text-foreground">Alterar senha</p>
        <div className="mt-3 grid max-w-sm gap-3">
          <div className="space-y-2">
            <Label htmlFor="senha1">Nova senha</Label>
            <Input
              id="senha1"
              type="password"
              autoComplete="new-password"
              value={senha1}
              onChange={(e) => setSenha1(e.target.value)}
              minLength={6}
              maxLength={72}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha2">Confirmar nova senha</Label>
            <Input
              id="senha2"
              type="password"
              autoComplete="new-password"
              value={senha2}
              onChange={(e) => setSenha2(e.target.value)}
              minLength={6}
              maxLength={72}
            />
          </div>
          <div>
            <Button
              size="sm"
              variant="outline"
              onClick={alterarSenha}
              disabled={trocandoSenha || !senha1 || !senha2}
            >
              {trocandoSenha ? "Alterando..." : "Alterar senha"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Minha conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seu perfil e os ajustes que se aplicam a todas as cobranças.
        </p>
      </header>

      <BlurFade className="mt-8 block">
        <PerfilCard />
      </BlurFade>

      <BlurFade delay={0.08} className="mt-4 block">
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
        <BlurFade delay={0.12} className="mt-4 block">
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
