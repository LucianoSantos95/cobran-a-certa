import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { linkWhats, mensagemWhats, telefoneWhats } from "./whatsapp";

const normaliza = (s: string) => s.replace(/ /g, " ");

describe("telefoneWhats", () => {
  it("normaliza para o formato do wa.me, com DDI 55", () => {
    expect(telefoneWhats("(11) 99999-9999")).toBe("5511999999999");
    expect(telefoneWhats("11 3333-4444")).toBe("551133334444");
  });

  it("aceita número que já vem com o DDI", () => {
    expect(telefoneWhats("+55 11 99999-9999")).toBe("5511999999999");
    expect(telefoneWhats("5511999999999")).toBe("5511999999999");
  });

  it("devolve null quando não dá pra montar um número válido", () => {
    expect(telefoneWhats("")).toBeNull();
    expect(telefoneWhats("123")).toBeNull();
    expect(telefoneWhats(undefined as unknown as string)).toBeNull();
  });
});

describe("mensagemWhats — o tom segue o estágio do atraso", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T15:00:00Z")); // 10/06/2026 em São Paulo
  });
  afterEach(() => vi.useRealTimers());

  const base = { nomeCliente: "Ana", valor: 1500 };

  it("no vencimento: lembrete leve", () => {
    const m = normaliza(mensagemWhats({ ...base, vencimento: "2026-06-10" }));
    expect(m).toContain("Olá, Ana!");
    expect(m).toContain("vence hoje (10/06/2026)");
    expect(m).toContain("R$ 1.500,00");
  });

  it("até o 6º dia de atraso: pergunta se consegue regularizar", () => {
    const m = mensagemWhats({ ...base, vencimento: "2026-06-07" });
    expect(m).toContain("em aberto há 3 dias");
    expect(m).toContain("Consegue regularizar?");
  });

  it("no 1º dia de atraso usa o singular", () => {
    const m = mensagemWhats({ ...base, vencimento: "2026-06-09" });
    expect(m).toContain("há 1 dia.");
  });

  it("a partir do 7º dia: tom firme", () => {
    const m = mensagemWhats({ ...base, vencimento: "2026-06-03" });
    expect(m).toContain("segue em aberto há 7 dias");
    expect(m).toContain("Pedimos a gentileza de regularizar");
  });

  it("inclui descrição, instruções de pagamento e o fecho padrão", () => {
    const m = mensagemWhats({
      ...base,
      vencimento: "2026-06-10",
      descricao: "Landing page",
      instrucoesPagamento: "Pix: 000.000.000-00",
    });
    expect(m).toContain("referente a Landing page");
    expect(m).toContain("Como pagar:\nPix: 000.000.000-00");
    expect(m.endsWith("Se já tiver pago, é só desconsiderar. Obrigado!")).toBe(true);
  });

  it("sem nome do cliente, a saudação é genérica", () => {
    const m = mensagemWhats({ nomeCliente: "", valor: 100, vencimento: "2026-06-10" });
    expect(m.startsWith("Olá!")).toBe(true);
  });
});

describe("linkWhats", () => {
  it("monta o link do wa.me com a mensagem codificada", () => {
    expect(linkWhats("5511999999999", "Olá & tudo bem?")).toBe(
      "https://wa.me/5511999999999?text=Ol%C3%A1%20%26%20tudo%20bem%3F",
    );
  });
});
