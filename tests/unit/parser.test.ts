import { describe, it, expect } from "vitest";
import { segmentAndClassify } from "@/lib/ingestion/parser";

describe("segmentAndClassify — extraction structurée (section 2.2)", () => {
  const sample = `
AVIS D'APPEL D'OFFRES OUVERT n°2026-500/MS
Objet : Acquisition d'équipements de laboratoire pour les CHR de la région du Centre.
Le Ministère de la Santé lance un appel d'offres ouvert.
Montant estimatif : 87 000 000 FCFA.
Retrait du dossier à compter du 20/09/2026.
Date limite de dépôt des offres : 15/10/2026.
Ouverture des plis le 16/10/2026.
Validité de l'offre : 90 jours.
Délai d'exécution : 60 jours.

Critères de qualification : chiffre d'affaires moyen supérieur à 50 000 000 FCFA sur les trois dernières années.
Le soumissionnaire doit justifier d'au moins 2 marchés similaires exécutés au cours des 5 dernières années.
Un agrément technique de catégorie B1 en cours de validité est exigé.

Pièces à fournir :
- RCCM en cours de validité
- IFU
- Attestation de situation fiscale
- Agrément technique
- Curriculum vitae du personnel clé

Lot n°1 : Fourniture de microscopes — 32 000 000 FCFA
Lot n°2 : Fourniture de réactifs de laboratoire — 15 000 000 FCFA

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

  it("extrait le calendrier complet (retrait, ouverture, validité, délai d'exécution)", () => {
    const [first] = segmentAndClassify(sample);
    expect(first.withdrawalDeadline?.toISOString().slice(0, 10)).toBe("2026-09-20");
    expect(first.openingAt?.toISOString().slice(0, 10)).toBe("2026-10-16");
    expect(first.bidValidityDays).toBe(90);
    expect(first.executionDelayDays).toBe(60);
  });

  it("extrait les exigences (chiffre d'affaires, expérience, agrément)", () => {
    const [first] = segmentAndClassify(sample);
    const types = first.requirements.map((r) => r.type);
    expect(types).toContain("CHIFFRE_AFFAIRES");
    expect(types).toContain("EXPERIENCE_SPECIFIQUE");
    expect(types).toContain("AGREMENT");
    const ca = first.requirements.find((r) => r.type === "CHIFFRE_AFFAIRES");
    expect(ca?.thresholdValue).toBe(50_000_000);
  });

  it("extrait les documents requis depuis la section « pièces à fournir »", () => {
    const [first] = segmentAndClassify(sample);
    const docTypes = first.requiredDocuments.map((d) => d.docType);
    expect(docTypes).toContain("RCCM");
    expect(docTypes).toContain("IFU");
    expect(docTypes).toContain("ATTESTATION_FISCALE");
    expect(docTypes).toContain("AGREMENT");
    expect(docTypes).toContain("CV");
  });

  it("extrait les lots avec leur montant", () => {
    const [first] = segmentAndClassify(sample);
    expect(first.lots).toHaveLength(2);
    expect(first.lots[0]).toMatchObject({ numero: "1", montant: 32_000_000 });
    expect(first.lots[1]).toMatchObject({ numero: "2", montant: 15_000_000 });
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
    expect(candidate.requirements).toHaveLength(0);
    expect(candidate.requiredDocuments).toHaveLength(0);
  });
});
