import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MessageSquarePlus, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { enviarFeedback } from "@/lib/feedback.functions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const PROMPT_KEY = "cc-feedback-prompt-v1";

function Estrelas({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          className="p-0.5"
        >
          <Star
            className={cn(
              "size-7 transition-colors",
              (hover || value) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function FeedbackButton({ userId, email }: { userId: string; email: string }) {
  const enviar = useServerFn(enviarFeedback);
  const [aberto, setAberto] = useState(false);

  const { data: perfil } = useQuery({
    queryKey: ["meu-perfil", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("nome")
        .eq("id", userId)
        .maybeSingle();
      return data ?? { nome: "" };
    },
  });

  const [nome, setNome] = useState("");
  const [emailInput, setEmailInput] = useState(email);
  const [estrelas, setEstrelas] = useState(0);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    if (perfil?.nome && !nome) setNome(perfil.nome);
  }, [perfil, nome]);

  // Abre o feedback automaticamente uma vez por navegador, alguns segundos
  // depois de entrar no app.
  useEffect(() => {
    let feito = false;
    try {
      feito = localStorage.getItem(PROMPT_KEY) === "1";
    } catch {
      feito = false;
    }
    if (feito) return;
    const t = setTimeout(() => setAberto(true), 6000);
    return () => clearTimeout(t);
  }, []);

  function marcarPrompted() {
    try {
      localStorage.setItem(PROMPT_KEY, "1");
    } catch {
      /* modo privado / storage bloqueado */
    }
  }

  const m = useMutation({
    mutationFn: () =>
      enviar({
        data: {
          nome: nome.trim(),
          email: emailInput.trim(),
          estrelas,
          mensagem: mensagem.trim(),
        },
      }),
    onSuccess: () => {
      setMensagem("");
      setEstrelas(0);
      setAberto(false);
      marcarPrompted();
      toast.success("Feedback enviado", { description: "Obrigado! Isso ajuda muito." });
    },
    onError: (e: Error) => toast.error("Não foi possível enviar", { description: e.message }),
  });

  const podeEnviar =
    nome.trim().length >= 1 && /\S+@\S+\.\S+/.test(emailInput.trim()) && estrelas >= 1;

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        setAberto(v);
        if (!v) marcarPrompted();
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="secondary"
          className="fixed right-4 bottom-4 z-50 gap-2 shadow-lg"
        >
          <MessageSquarePlus className="size-4" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dar um feedback</DialogTitle>
          <DialogDescription>
            Sua nota e, se quiser, um comentário. Vai direto para o time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fb-nome">Nome</Label>
              <Input
                id="fb-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={120}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fb-email">E-mail</Label>
              <Input
                id="fb-email"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                maxLength={255}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Sua nota</Label>
            <Estrelas value={estrelas} onChange={setEstrelas} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fb-msg">Comentário (opcional)</Label>
            <Textarea
              id="fb-msg"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="O que funcionou, o que atrapalhou, o que falta..."
              className="resize-y"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => m.mutate()} disabled={!podeEnviar || m.isPending}>
            {m.isPending ? "Enviando..." : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
