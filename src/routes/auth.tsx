import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Banknote, CreditCard, QrCode, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";

const FLUTUANTES = [
  { Icon: QrCode, top: "12%", left: "14%", size: 72, dur: 9, delay: 0 },
  { Icon: CreditCard, top: "58%", left: "8%", size: 88, dur: 11, delay: 1.2 },
  { Icon: Banknote, top: "30%", left: "68%", size: 96, dur: 10, delay: 0.6 },
  { Icon: Wallet, top: "74%", left: "62%", size: 64, dur: 12, delay: 1.8 },
  { Icon: QrCode, top: "84%", left: "30%", size: 52, dur: 13, delay: 0.3 },
];

function FloatingPagamentos() {
  const reduce = useReducedMotion();
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {FLUTUANTES.map(({ Icon, top, left, size, dur, delay }, i) => (
        <motion.div
          key={i}
          className="pointer-events-auto absolute text-primary-foreground"
          style={{ top, left }}
          initial={{ opacity: 0.1 }}
          animate={
            reduce
              ? { y: 0, rotate: 0, opacity: 0.1 }
              : { y: [0, -18, 0], rotate: [-4, 4, -4], opacity: 0.1 }
          }
          transition={
            reduce ? { duration: 0 } : { duration: dur, delay, repeat: Infinity, ease: "easeInOut" }
          }
          whileHover={{
            scale: 1.45,
            rotate: 14,
            opacity: 0.5,
            transition: { type: "spring", stiffness: 320, damping: 14 },
          }}
        >
          <Icon style={{ width: size, height: size }} strokeWidth={1.25} />
        </motion.div>
      ))}
    </div>
  );
}

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar | Cobrança Certa" },
      {
        name: "description",
        content: "Acesso restrito ao painel Cobrança Certa, os lembretes automáticos de pagamento.",
      },
      { property: "og:title", content: "Entrar no Cobrança Certa — Lembretes de cobrança" },
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

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.85 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.67-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.67 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [google, setGoogle] = useState(false);

  useEffect(() => {
    const decidir = (session: { user: { email?: string } } | null) => {
      if (!session) return;
      navigate({ to: "/" });
    };
    supabase.auth.getSession().then(({ data }) => decidir(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => decidir(session));
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    const normalizado = email.trim().toLowerCase();
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

  async function entrarComGoogle() {
    setGoogle(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
      extraParams: { prompt: "select_account" },
    });
    if (result.error) {
      setGoogle(false);
      toast.error("Não foi possível entrar com o Google", {
        description: result.error.message ?? "Tente novamente em instantes.",
      });
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              CC
            </span>
            <span className="font-semibold tracking-tight">Cobrança Certa</span>
          </div>

          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Entrar no Cobrança Certa
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Acesso restrito · versão beta.</p>

          <form onSubmit={entrar} className="mt-6 space-y-4">
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
            <Button type="submit" className="w-full" disabled={carregando || google}>
              {carregando ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs tracking-wide text-muted-foreground uppercase">
              ou continue com
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={entrarComGoogle}
            disabled={carregando || google}
          >
            <GoogleIcon className="size-4" />
            {google ? "Abrindo o Google..." : "Google"}
          </Button>

          <p className="mt-6 text-xs text-muted-foreground">
            Ao entrar com o Google sua conta é criada automaticamente. Você vê apenas os seus
            próprios clientes e cobranças.
          </p>
        </div>
      </div>

      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "radial-gradient(currentColor 1px, transparent 1px), radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            backgroundPosition: "0 0, 14px 14px",
          }}
        />
        <FloatingPagamentos />
        <div className="relative flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-primary-foreground text-xs font-bold text-primary">
            CC
          </span>
          <span className="font-semibold tracking-tight">Cobrança Certa</span>
        </div>
        <div className="relative">
          <p className="text-2xl leading-snug font-semibold tracking-tight">
            Lembretes de cobrança que recuperam o que é seu.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-primary-foreground/80">
            <li>• Lembrete no vencimento, cobrança firme depois — sem você redigir nada.</li>
            <li>• Acompanhe o que foi enviado e o que voltou como pagamento.</li>
            <li>• Feito para serviço pontual, não para assinatura recorrente.</li>
          </ul>
        </div>
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/40 bg-primary-foreground/15 px-3 py-1 text-xs font-semibold tracking-wide text-primary-foreground uppercase">
            <span className="size-1.5 rounded-full bg-primary-foreground" />
            Versão beta
          </span>
        </div>
      </aside>
    </main>
  );
}
