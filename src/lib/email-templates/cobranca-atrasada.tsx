import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  nomeCliente?: string;
  valorFormatado?: string;
  vencimentoFormatado?: string;
  diasAtraso?: number;
  remetente?: string;
}

const Email = ({
  nomeCliente,
  valorFormatado = "—",
  vencimentoFormatado = "—",
  diasAtraso,
  remetente = "Controle de Cobrança",
}: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Pagamento em atraso: {valorFormatado}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Pagamento em atraso</Heading>
        <Text style={text}>
          {nomeCliente ? `Olá, ${nomeCliente}.` : "Olá."} Identificamos que a cobrança abaixo segue
          em aberto{typeof diasAtraso === "number" ? ` há ${diasAtraso} dias` : ""}.
        </Text>
        <Section style={box}>
          <Text style={label}>Valor</Text>
          <Text style={value}>{valorFormatado}</Text>
          <Text style={label}>Venceu em</Text>
          <Text style={value}>{vencimentoFormatado}</Text>
        </Section>
        <Text style={text}>
          Pedimos a gentileza de regularizar o pagamento o quanto antes. Caso já tenha pago,
          responda este e-mail para darmos baixa.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>{remetente}</Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: Email,
  subject: (data: Record<string, unknown>) =>
    `Pagamento em atraso: ${(data["valorFormatado"] as string) ?? "cobrança em aberto"}`,
  displayName: "Cobrança em atraso",
  previewData: {
    nomeCliente: "Maria Silva",
    valorFormatado: "R$ 1.200,00",
    vencimentoFormatado: "08/09/2026",
    diasAtraso: 7,
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, Helvetica, sans-serif" };
const container = { padding: "28px 24px", maxWidth: "560px" };
const h1 = { fontSize: "20px", color: "#1f2d2b", margin: "0 0 12px" };
const text = { fontSize: "15px", lineHeight: "24px", color: "#3c4a48" };
const box = {
  border: "1px solid #e4e8e5",
  borderRadius: "10px",
  padding: "16px 18px",
  margin: "18px 0",
};
const label = { fontSize: "12px", color: "#7a8784", margin: "0 0 2px", textTransform: "uppercase" as const };
const value = { fontSize: "17px", color: "#1f2d2b", margin: "0 0 12px", fontWeight: 600 };
const hr = { borderColor: "#e4e8e5", margin: "24px 0 12px" };
const footer = { fontSize: "12px", color: "#7a8784" };
