import { describe, expect, it } from "vitest";
import { formatarBRL, mascararBRL, numeroParaMascaraBRL, parseBRL } from "./moeda";

// O Intl usa espaço não-quebrável entre "R$" e o número.
const normaliza = (s: string) => s.replace(/ /g, " ");

describe("parseBRL", () => {
  it.each([
    ["1.500,00", 1500],
    ["1500,00", 1500],
    ["R$ 1.500,00", 1500],
    ["R$ 1.500,00", 1500],
    ["1500", 1500],
    ["1500.00", 1500],
    ["0,5", 0.5],
  ])("interpreta %j como %d", (entrada, esperado) => {
    expect(parseBRL(entrada)).toBe(esperado);
  });

  it("trata ponto como milhar quando o último grupo tem 3 dígitos", () => {
    expect(parseBRL("1.500")).toBe(1500);
    expect(parseBRL("12.345.678")).toBe(12345678);
  });

  it("trata ponto como decimal quando o último grupo não tem 3 dígitos", () => {
    expect(parseBRL("1.5")).toBe(1.5);
    expect(parseBRL("1500.5")).toBe(1500.5);
  });

  it("devolve NaN quando não dá pra interpretar", () => {
    expect(parseBRL("")).toBeNaN();
    expect(parseBRL("R$")).toBeNaN();
    expect(parseBRL("abc")).toBeNaN();
    expect(parseBRL(undefined as unknown as string)).toBeNaN();
  });
});

describe("formatarBRL", () => {
  it("formata em Real", () => {
    expect(normaliza(formatarBRL(1500))).toBe("R$ 1.500,00");
    expect(normaliza(formatarBRL(0.5))).toBe("R$ 0,50");
  });
});

describe("mascararBRL (centavos primeiro)", () => {
  it("os dois últimos dígitos são sempre os centavos", () => {
    expect(mascararBRL("820000")).toBe("8.200,00");
    expect(mascararBRL("5")).toBe("0,05");
    expect(mascararBRL("123456789")).toBe("1.234.567,89");
  });

  it("ignora o que não é dígito e zeros à esquerda", () => {
    expect(mascararBRL("abc12")).toBe("0,12");
    expect(mascararBRL("R$ 0001500")).toBe("15,00");
  });

  it("devolve vazio quando não há dígito significativo", () => {
    expect(mascararBRL("")).toBe("");
    expect(mascararBRL("0")).toBe("");
    expect(mascararBRL("abc")).toBe("");
  });
});

describe("numeroParaMascaraBRL", () => {
  it("converte número para a máscara", () => {
    expect(numeroParaMascaraBRL(8200)).toBe("8.200,00");
    expect(numeroParaMascaraBRL(12.5)).toBe("12,50");
    expect(numeroParaMascaraBRL(0.01)).toBe("0,01");
  });

  it("devolve vazio para zero, negativo e não finito", () => {
    expect(numeroParaMascaraBRL(0)).toBe("");
    expect(numeroParaMascaraBRL(-5)).toBe("");
    expect(numeroParaMascaraBRL(Number.NaN)).toBe("");
  });
});
