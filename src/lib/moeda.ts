/** Formatação e parsing de valores em Real (pt-BR). */

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Formata um número como moeda: 1500 -> "R$ 1.500,00". */
export function formatarBRL(valor: number): string {
  return BRL.format(valor);
}

/**
 * Converte o que o usuário digitou num número.
 * Aceita "1.500,00", "1500,00", "R$ 1.500,00", "1500" e "1500.00".
 * Retorna NaN quando não dá pra interpretar.
 */
export function parseBRL(entrada: string): number {
  if (typeof entrada !== "string") return NaN;
  // \s cobre espaço comum, tab e o espaço não-quebrável usado pelo Intl.
  let s = entrada.replace(/[R$\s]/g, "");
  if (!s) return NaN;

  const temVirgula = s.includes(",");
  const temPonto = s.includes(".");

  if (temVirgula && temPonto) {
    // "1.500,00" -> ponto é separador de milhar, vírgula é decimal
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (temVirgula) {
    // "1500,00" -> vírgula é decimal
    s = s.replace(",", ".");
  } else if (temPonto) {
    // "1.500" (milhar) vs "1500.00" (decimal): se há mais de um ponto ou o
    // último grupo tem 3 dígitos, tratamos os pontos como separador de milhar.
    const partes = s.split(".");
    const ultimo = partes[partes.length - 1] ?? "";
    if (partes.length > 2 || ultimo.length === 3) {
      s = partes.join("");
    }
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}
