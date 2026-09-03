import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { EMAIL_AUTORIZADO } from "@/lib/acesso";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar | Cobrança Certa" },
      {
        name: "description",
        content: "Acesso restrito ao painel Cobrança Certa, os lembretes automáticos de pagamento.",
      },
      { property: "og:title", content: "Entrar | Cobrança Certa" },
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
    setCarregando(false);
    if (error) {
      const invalido = error.message.toLowerCase().includes("invalid login");
      toast.error("Não foi possível entrar", {
        description: invalido ? "E-mail ou senha incorretos." : error.message,
      });
      return;
    }
    navigate({ to: "/" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Cobrança Certa</h1>
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
            Sem cadastro público. Apenas a conta autorizada tem acesso nesta fase.
          </p>
        </form>
      </div>
    </main>
  );
}
