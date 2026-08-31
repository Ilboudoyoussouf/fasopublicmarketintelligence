import { describe, it, expect } from "vitest";
import { segmentAndClassify } from "@/lib/ingestion/parser";

describe("segmentAndClassify — extraction structurée (section 2.2)", () => {
  const sample = `
AVIS D'APPEL D'OFFRES OUVERT n°2026-500/MS
Objet : Acquisition d'équipements de laboratoire pour les CHR de la région du Centre.
Le Ministère de la Santé lance un appel d'offres ouvert.
Montant estimatif : 87 000 000 FCFA.
Date limite de dépôt des offres : 15/10/2026.

DEMANDE DE PRIX n°2026-501/MID
Objet : Fourniture de matériel de bureau.
Le Ministère des Infrastructures et du Désenclavement sollicite des offres.
Montant : 4 500 000 FCFA.
Date limite : 05/09/2026.
`;

  it("segmente le texte en un bloc par avis détecté", () => {
    const candidates = segmentAndClassify(sample);
    expect(candidates).toHaveLength(2);
  });

  it("extrait référence, objet, montant, échéance et organisme avec une confiance élevée", () => {
    const [first] = segmentAndClassify(sample);
    expect(first.reference).toBe("2026-500/MS");
    expect(first.title).toContain("laboratoire");
    expect(first.amountExclTax).toBe(87_000_000);
    expect(first.submissionDeadline?.toISOString().slice(0, 10)).toBe("2026-10-15");
    expect(first.authorityGuess).toBe("Ministère de la Santé");
    expect(first.regionGuess).toBe("Centre");
    expect(first.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it("classe correctement le type de procédure", () => {
    const [first, second] = segmentAndClassify(sample);
    expect(first.procedureTypeGuess).toBe("APPEL_OFFRES_OUVERT");
    expect(second.procedureTypeGuess).toBe("DEMANDE_PRIX");
  });

  it("retourne une liste vide si aucun avis n'est détecté", () => {
    expect(segmentAndClassify("Texte sans structure d'avis reconnaissable.")).toHaveLength(0);
  });

  it("attribue une confiance plus faible quand des champs sont absents", () => {
    const incomplete = "AVIS D'APPEL D'OFFRES OUVERT\nObjet : Travaux divers non précisés davantage.";
    const [candidate] = segmentAndClassify(incomplete);
    expect(candidate.confidence).toBeLessThan(0.6);
    expect(candidate.amountExclTax).toBeNull();
  });
});
