import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { criarCliente, editarCliente, type ClienteDTO } from "@/lib/cobranca.functions";
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
import { Switch } from "@/components/ui/switch";

interface Props {
  cliente?: ClienteDTO;
  trigger: React.ReactNode;
}

export function ClienteDialog({ cliente, trigger }: Props) {
  const qc = useQueryClient();
  const criar = useServerFn(criarCliente);
  const editar = useServerFn(editarCliente);
  const editando = !!cliente;

  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [envioAutomatico, setEnvioAutomatico] = useState(true);

  useEffect(() => {
    if (!aberto) return;
    setNome(cliente?.nome ?? "");
    setEmail(cliente?.email ?? "");
    setWhatsapp(cliente?.whatsapp ?? "");
    setEnvioAutomatico(cliente?.envioAutomatico ?? true);
  }, [aberto, cliente]);

  const m = useMutation({
    mutationFn: () => {
      const payload = {
        nome: nome.trim(),
        email: email.trim(),
        whatsapp: whatsapp.trim(),
        envioAutomatico,
      };
      return editando
        ? editar({ data: { ...payload, id: cliente!.id } })
        : criar({ data: payload });
    },
    onSuccess: () => {
      setAberto(false);
      toast.success(editando ? "Cliente atualizado" : "Cliente cadastrado");
      qc.invalidateQueries({ queryKey: ["painel"] });
    },
    onError: (e: Error) => toast.error("Não foi possível salvar", { description: e.message }),
  });

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>
            Nome e e-mail para as cobranças. WhatsApp é opcional (usado no envio assistido).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cl-nome">Nome</Label>
            <Input
              id="cl-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cl-email">E-mail</Label>
            <Input
              id="cl-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cl-whats">WhatsApp (opcional)</Label>
            <Input
              id="cl-whats"
              inputMode="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              maxLength={20}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/40 p-3">
            <div className="space-y-0.5">
              <Label htmlFor="cl-auto" className="text-sm">
                Enviar cobranças automáticas por e-mail
              </Label>
              <p className="text-xs text-muted-foreground">
                Desligado, este cliente fica de fora do "Rodar cobranças" — você cuida na mão.
              </p>
            </div>
            <Switch id="cl-auto" checked={envioAutomatico} onCheckedChange={setEnvioAutomatico} />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => m.mutate()}
            disabled={!nome.trim() || !email.trim() || m.isPending}
          >
            {m.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
