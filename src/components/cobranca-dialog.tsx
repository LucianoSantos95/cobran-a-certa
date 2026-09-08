import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  criarCobranca,
  editarCobranca,
  type CobrancaDTO,
  type Frequencia,
} from "@/lib/cobranca.functions";
import { numeroParaMascaraBRL, parseBRL } from "@/lib/moeda";
import { MoedaInput } from "@/components/moeda-input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  clientes: { id: string; nome: string }[];
  cobranca?: CobrancaDTO;
  trigger: React.ReactNode;
}

export function CobrancaDialog({ clientes, cobranca, trigger }: Props) {
  const qc = useQueryClient();
  const criar = useServerFn(criarCobranca);
  const editar = useServerFn(editarCobranca);
  const editando = !!cobranca;

  const [aberto, setAberto] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [frequencia, setFrequencia] = useState<Frequencia>("unica");

  useEffect(() => {
    if (!aberto) return;
    setClienteId(cobranca?.cliente_id ?? "");
    setDescricao(cobranca?.descricao ?? "");
    setValor(cobranca ? numeroParaMascaraBRL(cobranca.valor) : "");
    setVencimento(cobranca?.vencimento?.slice(0, 10) ?? "");
    setFrequencia(cobranca?.frequencia ?? "unica");
  }, [aberto, cobranca]);

  const m = useMutation({
    mutationFn: () => {
      const v = parseBRL(valor);
      if (!Number.isFinite(v) || v <= 0) {
        return Promise.reject(new Error("Informe um valor válido, ex: 1.500,00"));
      }
      const payload = {
        cliente_id: clienteId,
        valor: v,
        vencimento,
        descricao: descricao.trim(),
        frequencia,
      };
      return editando
        ? editar({ data: { ...payload, id: cobranca!.id } })
        : criar({ data: payload });
    },
    onSuccess: () => {
      setAberto(false);
      toast.success(editando ? "Cobrança atualizada" : "Cobrança cadastrada");
      qc.invalidateQueries({ queryKey: ["painel"] });
    },
    onError: (e: Error) => toast.error("Não foi possível salvar", { description: e.message }),
  });

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? "Editar cobrança" : "Nova cobrança"}</DialogTitle>
          <DialogDescription>Cliente, descrição, valor, vencimento e frequência.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cb-descricao">Descrição</Label>
            <Input
              id="cb-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={200}
              placeholder="Ex.: Projeto site institucional, NF 042"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cb-valor">Valor</Label>
            <MoedaInput id="cb-valor" value={valor} onChange={setValor} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cb-venc">Vencimento</Label>
            <Input
              id="cb-venc"
              type="date"
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Frequência</Label>
            <Select value={frequencia} onValueChange={(v) => setFrequencia(v as Frequencia)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unica">Única (pontual)</SelectItem>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="quinzenal">Quinzenal</SelectItem>
                <SelectItem value="mensal">Mensal</SelectItem>
              </SelectContent>
            </Select>
            {frequencia !== "unica" ? (
              <p className="text-xs text-muted-foreground">
                Ao marcar esta como paga, a próxima é gerada automaticamente.
              </p>
            ) : null}
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => m.mutate()}
            disabled={!clienteId || !valor || !vencimento || m.isPending}
          >
            {m.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
