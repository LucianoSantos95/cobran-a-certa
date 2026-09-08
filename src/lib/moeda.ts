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

/**
 * Máscara "centavos primeiro" para campo de valor: só os dígitos entram e os
 * dois últimos são sempre os centavos. Digitar 8-2-0-0-0-0 -> "8.200,00".
 * Retorna "" quando não há dígito significativo.
 */
export function mascararBRL(entrada: string): string {
  const digitos = entrada.replace(/\D/g, "").replace(/^0+/, "");
  if (!digitos) return "";
  const cents = digitos.padStart(3, "0");
  const inteiro = cents.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${inteiro},${cents.slice(-2)}`;
}

/** Número -> string da máscara: 8200 -> "8.200,00" (vazio se <= 0). */
export function numeroParaMascaraBRL(valor: number): string {
  if (!Number.isFinite(valor) || valor <= 0) return "";
  return mascararBRL(String(Math.round(valor * 100)));
}
