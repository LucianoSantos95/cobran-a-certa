import { formatarBRL } from "./moeda";
import { diasDeAtraso } from "./datas";

/** Normaliza um telefone BR para o formato do wa.me (dígitos com DDI 55). */
export function telefoneWhats(bruto: string): string | null {
  const d = (bruto || "").replace(/\D/g, "");
  if (!d) return null;
  if (d.length === 10 || d.length === 11) return `55${d}`;
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) return d;
  return null;
}

function dataBR(iso: string): string {
  const [a, m, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${m}/${a}`;
}

interface DadosMsg {
  nomeCliente: string;
  valor: number;
  vencimento: string;
  descricao?: string;
  instrucoesPagamento?: string;
}

/**
 * Monta a mensagem de cobrança no tom certo para o estágio do atraso:
 * leve no vencimento, um pouco mais firme até o 7º dia, firme depois.
 */
export function mensagemWhats(d: DadosMsg): string {
  const atraso = diasDeAtraso(d.vencimento);
  const valor = formatarBRL(d.valor);
  const venc = dataBR(d.vencimento);
  const ref = d.descricao?.trim() ? ` referente a ${d.descricao.trim()}` : "";
  const ola = d.nomeCliente ? `Olá, ${d.nomeCliente}!` : "Olá!";

  let corpo: string;
  if (atraso <= 0) {
    corpo = `${ola} Passando para lembrar que a cobrança${ref} de ${valor} vence hoje (${venc}).`;
  } else if (atraso < 7) {
    corpo = `${ola} A cobrança${ref} de ${valor} venceu em ${venc} e está em aberto há ${atraso} dia${
      atraso > 1 ? "s" : ""
    }. Consegue regularizar?`;
  } else {
    corpo = `${ola} A cobrança${ref} de ${valor}, com vencimento em ${venc}, segue em aberto há ${atraso} dias. Pedimos a gentileza de regularizar o quanto antes.`;
  }

  const pag = d.instrucoesPagamento?.trim()
    ? `\n\nComo pagar:\n${d.instrucoesPagamento.trim()}`
    : "";
  return `${corpo}${pag}\n\nSe já tiver pago, é só desconsiderar. Obrigado!`;
}

export function linkWhats(telefone: string, mensagem: string): string {
  return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
}
