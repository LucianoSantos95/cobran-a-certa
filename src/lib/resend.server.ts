/**
 * Envio de e-mails pelo Resend, através do gateway de conectores da Lovable.
 * Server-only: lê LOVABLE_API_KEY e RESEND_API_KEY.
 */
import * as React from "react";
import { render } from "@react-email/render";
import { TEMPLATES } from "./email-templates/registry";
import { NOME_PRODUTO } from "./acesso";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

/** Domínio verificado no Resend usado como remetente. */
export const SENDER_DOMAIN = "focusinteligente.com.br";
export const FROM_ADDRESS = `${NOME_PRODUTO} <cobranca@${SENDER_DOMAIN}>`;

export function resendConfigurado(): boolean {
  return Boolean(process.env["LOVABLE_API_KEY"] && process.env["RESEND_API_KEY"]);
}

export interface EnviarOptions {
  templateData?: Record<string, unknown>;
  idempotencyKey?: string;
  replyTo?: string;
}

/** Renderiza um template registrado e envia pelo Resend. Lança erro em falha. */
export async function enviarTemplateResend(
  templateName: string,
  to: string,
  options: EnviarOptions = {},
): Promise<void> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableKey || !resendKey) {
    throw new Error("Credenciais de e-mail não configuradas");
  }

  const template = TEMPLATES[templateName];
  if (!template) {
    throw new Error(
      `Template '${templateName}' não encontrado. Disponíveis: ${Object.keys(TEMPLATES).join(", ")}`,
    );
  }

  const templateData = options.templateData ?? {};
  const element = React.createElement(template.component, templateData);
  const html = await render(element);
  const text = await render(element, { plainText: true });
  const subject =
    typeof template.subject === "function" ? template.subject(templateData) : template.subject;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": resendKey,
  };
  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }

  const response = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [to],
      subject,
      html,
      text,
      ...(options.replyTo ? { reply_to: options.replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Resend falhou [${response.status}]: ${body}`);
    throw new Error(`Falha no envio do e-mail [${response.status}]: ${body}`);
  }
}
