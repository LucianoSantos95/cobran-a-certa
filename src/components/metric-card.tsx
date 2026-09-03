import { cn } from "@/lib/utils";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { BorderBeam } from "@/components/magicui/border-beam";

interface MetricCardProps {
  titulo: string;
  /** null = carregando ou sem dado; mostra "—". */
  valor: number | null;
  format?: ((n: number) => string) | undefined;
  detalhe?: string | undefined;
  /** Realça o card com uma borda animada (usar com parcimônia). */
  destaque?: boolean | undefined;
}

export function MetricCard({
  titulo,
  valor,
  format = (n) => Intl.NumberFormat("pt-BR").format(Math.round(n)),
  detalhe,
  destaque = false,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm",
        destaque && "border-primary/30",
      )}
    >
      {destaque ? <BorderBeam size={64} duration={9} /> : null}
      <p className="text-sm text-muted-foreground">{titulo}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
        {valor === null ? "—" : <NumberTicker value={valor} format={format} />}
      </p>
      {detalhe ? <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p> : null}
    </div>
  );
}
