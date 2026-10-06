import { afterEach, describe, expect, it, vi } from "vitest";
import {
  dataCurtaSP,
  dataHoraSP,
  diaSP,
  diasDeAtraso,
  hojeSP,
  somaDias,
  somaMeses,
} from "./datas";

afterEach(() => vi.useRealTimers());

describe("fuso de São Paulo", () => {
  it("converte um instante UTC para o dia local", () => {
    // 02:00 UTC ainda é 23:00 do dia anterior em São Paulo (UTC-3)
    expect(diaSP("2026-01-01T02:00:00Z")).toBe("2025-12-31");
    expect(diaSP("2026-01-01T12:00:00Z")).toBe("2026-01-01");
  });

  it("formata data curta e data com hora no fuso local", () => {
    expect(dataCurtaSP("2026-03-10T15:00:00Z")).toBe("10/03");
    expect(dataHoraSP("2026-03-10T15:00:00Z")).toMatch(/^10\/03\/2026,? 12:00$/);
  });

  it("hojeSP não vira o dia às 21h, quando o UTC já virou", () => {
    vi.useFakeTimers();
    // 01:30 UTC de 11/06 == 22:30 de 10/06 em São Paulo
    vi.setSystemTime(new Date("2026-06-11T01:30:00Z"));
    expect(hojeSP()).toBe("2026-06-10");
  });
});

describe("somaDias", () => {
  it("soma e subtrai atravessando mês e ano bissexto", () => {
    expect(somaDias("2026-03-31", 1)).toBe("2026-04-01");
    expect(somaDias("2026-03-01", -1)).toBe("2026-02-28");
    expect(somaDias("2028-02-28", 1)).toBe("2028-02-29");
    expect(somaDias("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("aceita um timestamp ISO e usa só a parte da data", () => {
    expect(somaDias("2026-03-31T18:00:00Z", 1)).toBe("2026-04-01");
  });
});

describe("somaMeses", () => {
  it("mantém o dia do mês quando possível", () => {
    expect(somaMeses("2026-12-15", 1)).toBe("2027-01-15");
    expect(somaMeses("2026-05-10", 3)).toBe("2026-08-10");
  });

  it("limita ao último dia do mês de destino", () => {
    expect(somaMeses("2026-01-31", 1)).toBe("2026-02-28");
    expect(somaMeses("2028-01-31", 1)).toBe("2028-02-29");
    expect(somaMeses("2026-03-31", -1)).toBe("2026-02-28");
  });

  it("atravessa mais de um ano", () => {
    expect(somaMeses("2026-01-31", 13)).toBe("2027-02-28");
    expect(somaMeses("2026-01-15", -13)).toBe("2024-12-15");
  });
});

describe("diasDeAtraso", () => {
  const hoje = (iso: string) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(iso));
  };

  it("conta dias corridos desde o vencimento", () => {
    hoje("2026-06-10T15:00:00Z");
    expect(diasDeAtraso("2026-06-03")).toBe(7);
    expect(diasDeAtraso("2026-06-09")).toBe(1);
  });

  it("no dia do vencimento é zero, e nunca fica negativo", () => {
    hoje("2026-06-10T15:00:00Z");
    expect(diasDeAtraso("2026-06-10")).toBe(0);
    expect(diasDeAtraso("2026-06-15")).toBe(0);
  });

  it("usa o dia de São Paulo, não o do UTC, perto da meia-noite", () => {
    // Em UTC já é 11/06, mas em São Paulo ainda é 10/06: vence hoje, não atrasou.
    hoje("2026-06-11T01:30:00Z");
    expect(diasDeAtraso("2026-06-10")).toBe(0);
  });
});
