/**
 * Helpers de data no fuso de São Paulo.
 *
 * O produto é 100% Brasil e as regras de cobrança dependem do "dia" local
 * (vencimento é um DATE, não um instante). Usar `new Date().toISOString()`
 * quebra entre ~21h e a meia-noite, quando o UTC já virou o dia seguinte.
 */
import { TIMEZONE } from "./acesso";

const ISO_DIA = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const DIA_MES = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIMEZONE,
  day: "2-digit",
  month: "2-digit",
});

const DATA_HORA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Data de hoje em São Paulo, no formato YYYY-MM-DD. */
export function hojeSP(): string {
  return ISO_DIA.format(new Date());
}

/** Converte um instante ISO para o dia local (YYYY-MM-DD) em São Paulo. */
export function diaSP(iso: string): string {
  return ISO_DIA.format(new Date(iso));
}

/** "DD/MM" de um instante ISO, em São Paulo. */
export function dataCurtaSP(iso: string): string {
  return DIA_MES.format(new Date(iso));
}

/** "DD/MM/AAAA HH:mm" de um instante ISO, em São Paulo. */
export function dataHoraSP(iso: string): string {
  return DATA_HORA.format(new Date(iso));
}

/** Soma (ou subtrai, com n negativo) dias a uma data YYYY-MM-DD. */
export function somaDias(dia: string, n: number): string {
  const d = new Date(`${dia.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Dias de atraso de um vencimento (YYYY-MM-DD) em relação a hoje. Nunca negativo. */
export function diasDeAtraso(vencimento: string): number {
  const venc = Date.parse(`${vencimento.slice(0, 10)}T00:00:00Z`);
  const hoje = Date.parse(`${hojeSP()}T00:00:00Z`);
  return Math.max(0, Math.round((hoje - venc) / 86_400_000));
}
