/**
 * Envio de e-mails de cobrança pelo Resend (domínio próprio verificado).
 */
import { enviarTemplateResend, resendConfigurado } from "@/lib/resend.server";
import { EMAIL_RESPOSTA } from "./acesso";
import { diasDeAtraso } from "./datas";

export const EMAIL_NAO_CONFIGURADO = "EMAIL_NAO_CONFIGURADO";

export type TipoEnvio = "lembrete" | "cobranca_atrasada";

export interface DadosEmailCobranca {
  para: string;
  nomeCliente: string;
  valor: number;
  vencimento: string;
  /** Referência da cobrança (ex.: "Projeto site", "NF 042"). */
  descricao?: string;
  tipo: TipoEnvio;
  cobrancaId: string;
  /** Instruções de pagamento do prestador; entram no rodapé quando presentes. */
  instrucoesPagamento?: string;
}

export function emailConfigurado(): boolean {
  return resendConfigurado();
}

function formatarValor(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

/**
 * Envia o e-mail correspondente ao estágio da cobrança.
 * Lança erro quando o envio falha; retorna silenciosamente quando o
 * destinatário está suprimido (bounce/reclamação/descadastro anterior).
 */
export async function enviarEmailCobranca(dados: DadosEmailCobranca): Promise<void> {
  if (!emailConfigurado()) {
    throw new Error(EMAIL_NAO_CONFIGURADO);
  }

  const templateName = dados.tipo === "lembrete" ? "lembrete-cobranca" : "cobranca-atrasada";

  const instrucoes = dados.instrucoesPagamento?.trim();
  const descricao = dados.descricao?.trim();

  const result = await sendTemplateEmail(templateName, dados.para, {
    templateData: {
      nomeCliente: dados.nomeCliente,
      valorFormatado: formatarValor(dados.valor),
      vencimentoFormatado: formatarData(dados.vencimento),
      ...(descricao ? { descricao } : {}),
      ...(instrucoes ? { instrucoesPagamento: instrucoes } : {}),
      ...(dados.tipo === "cobranca_atrasada" ? { diasAtraso: diasDeAtraso(dados.vencimento) } : {}),
    },
    idempotencyKey: `${templateName}-${dados.cobrancaId}`,
    replyTo: EMAIL_RESPOSTA,
  });

  if (!result.sent) {
    console.warn("Destinatário suprimido:", templateName, dados.cobrancaId);
  }
}
