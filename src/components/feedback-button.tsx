import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MessageSquarePlus } from "lucide-react";
import { enviarFeedback } from "@/lib/feedback.functions";
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
import { Textarea } from "@/components/ui/textarea";

export function FeedbackButton() {
  const enviar = useServerFn(enviarFeedback);
  const [aberto, setAberto] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const m = useMutation({
    mutationFn: () => enviar({ data: { mensagem: mensagem.trim() } }),
    onSuccess: () => {
      setMensagem("");
      setAberto(false);
      toast.success("Feedback enviado", { description: "Obrigado! Isso ajuda muito." });
    },
    onError: (e: Error) => toast.error("Não foi possível enviar", { description: e.message }),
  });

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
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
            O que funcionou, o que atrapalhou, o que está faltando. Vai direto para o time.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="Escreva aqui..."
          className="resize-y"
        />
        <DialogFooter>
          <Button onClick={() => m.mutate()} disabled={mensagem.trim().length < 3 || m.isPending}>
            {m.isPending ? "Enviando..." : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
