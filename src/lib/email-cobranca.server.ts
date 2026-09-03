/**
 * Envio de e-mails de cobrança.
 *
 * Nesta fase o projeto ainda não tem um domínio de envio configurado.
 * Assim que o domínio estiver ativo, este módulo passa a usar o helper
 * de e-mail gerenciado (`sendTemplateEmail`) e os modelos de mensagem.
 */

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
  return false;
}

export async function enviarEmailCobranca(_dados: DadosEmailCobranca): Promise<void> {
  throw new Error(EMAIL_NAO_CONFIGURADO);
}
