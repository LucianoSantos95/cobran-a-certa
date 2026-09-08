import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { concluirTicket } from "@/lib/tickets.functions";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ConcluirTicketDialog({
  ticketId,
  trigger,
}: {
  ticketId: string;
  trigger: React.ReactNode;
}) {
  const qc = useQueryClient();
  const concluir = useServerFn(concluirTicket);
  const [aberto, setAberto] = useState(false);
  const [resposta, setResposta] = useState("");

  const m = useMutation({
    mutationFn: () => concluir({ data: { id: ticketId, resposta: resposta.trim() } }),
    onSuccess: () => {
      setAberto(false);
      setResposta("");
      toast.success("Chamado concluído", { description: "O usuário vê o novo status no Suporte." });
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error("Não foi possível concluir", { description: e.message }),
  });

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Concluir chamado</DialogTitle>
          <DialogDescription>
            O status vira "Concluído" e a resposta abaixo aparece para o usuário.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="ticket-resposta">Resposta ao usuário (opcional)</Label>
          <Textarea
            id="ticket-resposta"
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
            rows={4}
            maxLength={4000}
            placeholder="Ex.: Ajustamos aqui, pode testar de novo."
            className="resize-y"
          />
        </div>
        <DialogFooter>
          <Button onClick={() => m.mutate()} disabled={m.isPending}>
            {m.isPending ? "Concluindo..." : "Marcar como concluído"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
