import { mascararBRL } from "@/lib/moeda";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface Props {
  /** Valor já mascarado, ex.: "8.200,00" ou "" quando vazio. */
  value: string;
  onChange: (mascarado: string) => void;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Campo de valor em Real com máscara "centavos primeiro": o usuário só digita
 * números e os dois últimos são sempre os centavos.
 */
export function MoedaInput({
  value,
  onChange,
  id,
  disabled,
  placeholder = "0,00",
  className,
}: Props) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
        R$
      </span>
      <Input
        id={id}
        inputMode="numeric"
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(mascararBRL(e.target.value))}
        className={cn("pl-9 tabular-nums", className)}
      />
    </div>
  );
}
