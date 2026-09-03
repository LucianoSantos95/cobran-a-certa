import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const EMAIL_AUTORIZADO = "oluciano.dosantos@gmail.com";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar | Controle de Cobrança" },
      {
        name: "description",
        content:
          "Acesso restrito ao Controle de Cobrança, o painel de lembretes automáticos de pagamento.",
      },
      { property: "og:title", content: "Entrar | Controle de Cobrança" },
      {
        property: "og:description",
        content: "Acesso restrito ao painel de cobranças e lembretes automáticos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    const normalizado = email.trim().toLowerCase();
    if (normalizado !== EMAIL_AUTORIZADO) {
      toast.error("Acesso restrito", {
        description: "Nesta fase de validação apenas a conta autorizada pode entrar.",
      });
      return;
    }
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizado,
      password: senha,
    });
    if (error) {
      if (error.message.toLowerCase().includes("invalid login")) {
        const { error: erroCadastro } = await supabase.auth.signUp({
          email: normalizado,
          password: senha,
        });
        if (erroCadastro) {
          setCarregando(false);
          toast.error("Não foi possível entrar", { description: erroCadastro.message });
          return;
        }
        const { error: erroLogin } = await supabase.auth.signInWithPassword({
          email: normalizado,
          password: senha,
        });
        if (erroLogin) {
          setCarregando(false);
          toast.error("Conta criada", {
            description: "Confirme o e-mail recebido e entre novamente.",
          });
          return;
        }
      } else {
        setCarregando(false);
        toast.error("Não foi possível entrar", { description: error.message });
        return;
      }
    }
    setCarregando(false);
    navigate({ to: "/" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Controle de Cobrança
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acesso restrito durante a fase de validação.
        </p>

        <form onSubmit={entrar} className="mt-8 space-y-4 rounded-xl border bg-card p-6">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              required
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
              maxLength={72}
            />
          </div>
          <Button type="submit" className="w-full" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Sem cadastro público: a conta autorizada é criada automaticamente no primeiro acesso.
          </p>
        </form>
      </div>
    </main>
  );
}
