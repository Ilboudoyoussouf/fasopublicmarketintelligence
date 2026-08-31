import { describe, it, expect } from "vitest";
import { normalize, jaccardSimilarity } from "@/lib/ingestion/dedupe";

describe("normalize", () => {
  it("retire les accents, la ponctuation et met en minuscules", () => {
    expect(normalize("Réhabilitation de forages — Lot n°1 !")).toBe("rehabilitation de forages lot n 1");
  });
});

describe("jaccardSimilarity — déduplication (section 46)", () => {
  it("retourne 1 pour deux textes identiques", () => {
    expect(jaccardSimilarity("Construction de routes rurales", "Construction de routes rurales")).toBe(1);
  });

  it("retourne 0 pour deux textes sans mots communs", () => {
    expect(jaccardSimilarity("Fourniture de matériel informatique", "Étude environnementale du barrage")).toBe(0);
  });

  it("détecte une forte similarité malgré des variations mineures (rectificatif republié)", () => {
    const original = "Construction et bitumage de voiries rurales — lot unique";
    const corrected = "Construction et bitumage de voiries rurales (rectificatif) — lot unique";
    expect(jaccardSimilarity(original, corrected)).toBeGreaterThan(0.6);
  });
});
