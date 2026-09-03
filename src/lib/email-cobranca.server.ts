/**
 * Envio de e-mails de cobrança através do e-mail gerenciado da plataforma.
 */
import { sendTemplateEmail } from "@/lib/email-templates/send-email";

export const EMAIL_NAO_CONFIGURADO = "EMAIL_NAO_CONFIGURADO";

export type TipoEnvio = "lembrete" | "cobranca_atrasada";

export interface DadosEmailCobranca {
  para: string;
  nomeCliente: string;
  valor: number;
  vencimento: string;
  tipo: TipoEnvio;
  cobrancaId: string;
}

export function emailConfigurado(): boolean {
  return Boolean(process.env["LOVABLE_API_KEY"]);
}

function formatarValor(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

function diasDeAtraso(vencimento: string): number {
  const venc = new Date(`${vencimento.slice(0, 10)}T00:00:00Z`).getTime();
  const hoje = Date.now();
  return Math.max(0, Math.floor((hoje - venc) / 86_400_000));
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

  const result = await sendTemplateEmail(templateName, dados.para, {
    templateData: {
      nomeCliente: dados.nomeCliente,
      valorFormatado: formatarValor(dados.valor),
      vencimentoFormatado: formatarData(dados.vencimento),
      ...(dados.tipo === "cobranca_atrasada"
        ? { diasAtraso: diasDeAtraso(dados.vencimento) }
        : {}),
    },
    idempotencyKey: `${templateName}-${dados.cobrancaId}`,
  });

  if (!result.sent) {
    console.warn("Destinatário suprimido:", templateName, dados.cobrancaId);
  }
}
