import { describe, it, expect } from "vitest";
import { formatFcfa, daysUntil } from "@/lib/utils";

describe("formatFcfa", () => {
  it("formate un montant avec séparateurs de milliers et le suffixe FCFA", () => {
    const formatted = formatFcfa(65_300_000);
    expect(formatted.endsWith("FCFA")).toBe(true);
    expect(formatted.replace(/[\s ]/g, "")).toBe("65300000FCFA");
  });

  it("retourne un tiret pour une valeur nulle ou non numérique", () => {
    expect(formatFcfa(null)).toBe("—");
    expect(formatFcfa(undefined)).toBe("—");
    expect(formatFcfa("abc")).toBe("—");
  });

  it("accepte une chaîne numérique (Decimal Prisma sérialisé)", () => {
    expect(formatFcfa("16800000").replace(/[\s ]/g, "")).toBe("16800000FCFA");
  });
});

describe("daysUntil", () => {
  it("calcule un nombre de jours positif pour une date future", () => {
    const inFiveDays = new Date(Date.now() + 5 * 86_400_000);
    expect(daysUntil(inFiveDays)).toBe(5);
  });

  it("calcule un nombre négatif pour une date passée", () => {
    const yesterday = new Date(Date.now() - 86_400_000);
    expect(daysUntil(yesterday)).toBeLessThan(0);
  });

  it("retourne null si aucune date n'est fournie", () => {
    expect(daysUntil(null)).toBeNull();
    expect(daysUntil(undefined)).toBeNull();
  });
});
