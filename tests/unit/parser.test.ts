import { describe, it, expect } from "vitest";
import { segmentAndClassify, reviseCandidates } from "@/lib/ingestion/parser";

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

// Structure vérifiée sur un quotidien DGCMEF réel (n°4486, 11/09/2026) : le
// titre et l'autorité contractante précèdent l'en-tête du type d'avis (pas
// de label "Objet :"), et les montants sont écrits en toutes lettres suivis
// de la valeur numérique entre parenthèses, parfois après un retour à la
// ligne. Le corps répète aussi l'expression de l'en-tête en minuscules
// ("cet avis de demande de prix…"), ce qui doit rester sans effet sur la
// segmentation.
describe("segmentAndClassify — structure réelle des quotidiens DGCMEF", () => {
  const realSample = `
Fournitures et Services courants
MINISTERE DE L'AGRICULTURE, DE L'EAU, DES RESSOURCES ANIMALES ET HALIEUTIQUES

Acquisition de petits matériels agricoles et de transformation au profit du Projet
de construction de Barrages dans la Province du Ganzourgou au Burkina Faso
AVIS D'APPEL D'OFFRES OUVERT NATIONAL
N°2026-16F/MAERAH/SG/DMP

1. Description du marché
Le Ministère sollicite des offres sous plis fermés. Le montant prévisionnel du marché est de
dix-sept millions sept cent quatre-vingt-seize mille six cent dix
(17 796 610) francs CFA en HTVA et vingt-et-un millions (21 000 000) francs CFA en TTC.
Date limite de dépôt des offres : 21/09/2026.

Travaux
COMMUNE DE TIBGA

Travaux de construction d'infrastructures scolaires dans la commune de Tibga
AVIS DE DEMANDE DE PRIX
N°2026-002/REST/PGRM/CTBG/SG/PRCP
Financement : ADCT-Budget Communal, gestion 2026

1- Cet avis de demande de prix fait suite à l'adoption du plan de passation des marchés publics.
2- La commune de Tibga sollicite des offres pour financer ces travaux.
3- La présente demande de prix est réservée : aux micros et petites entreprises ;
4- Date limite de dépôt des offres : 25/09/2026.
`;

  it("extrait le titre et l'autorité depuis le préambule qui précède l'en-tête (pas de label « Objet : »)", () => {
    const [first, second] = segmentAndClassify(realSample);
    expect(first.authorityGuess).toBe("MINISTERE DE L'AGRICULTURE, DE L'EAU, DES RESSOURCES ANIMALES ET HALIEUTIQUES");
    expect(first.title).toContain("Acquisition de petits matériels agricoles");
    expect(second.authorityGuess).toBe("COMMUNE DE TIBGA");
    expect(second.title).toBe("Travaux de construction d'infrastructures scolaires dans la commune de Tibga");
  });

  it("n'ouvre pas un nouveau bloc sur une occurrence en minuscules du type d'avis dans le corps du texte", () => {
    const candidates = segmentAndClassify(realSample);
    expect(candidates).toHaveLength(2);
  });

  it("extrait un montant écrit en toutes lettres avec la valeur entre parenthèses (avec retour à la ligne avant la parenthèse)", () => {
    const [first] = segmentAndClassify(realSample);
    expect(first.amountExclTax).toBe(17_796_610);
  });

  it("reconnaît une réservation aux micros et petites entreprises écrite en toutes lettres", () => {
    const [, second] = segmentAndClassify(realSample);
    const types = second.requirements.map((r) => r.type);
    expect(types).toContain("CONDITIONS_RESERVATION");
  });
});

// Cas confirmés en comparant 4 quotidiens DGCMEF réels distincts (n°4483 à
// n°4486) : un tableau de résultats/synthèse cite le type de procédure
// d'origine dans son propre en-tête ("SYNTHESE AVIS D'APPEL D'OFFRES...",
// "SYNTHESE DES RESULTATS DE LA DEMANDE DE PRIX...") — sans traitement
// dédié, ce texte redevient à tort un nouvel avis frais.
describe("segmentAndClassify — tableaux de résultats/synthèse (jamais un nouvel avis)", () => {
  it("classe un en-tête « SYNTHESE ... » générique comme un résultat, pas un nouvel appel", () => {
    const sample = `
COMMUNE DE PAMA

Travaux de réhabilitation du marché central de Pama
AVIS DE DEMANDE DE PRIX
N°2026-099/RSHL/PKPO/CPAM/SG/PRCP

1. Le montant prévisionnel est de dix millions (10 000 000) francs CFA.
Date limite de dépôt des offres : 12/10/2026.

PROJET D'APPUI AU DEVELOPPEMENT LOCAL
                              SYNTHESE AVIS D'APPEL D'OFFRES OUVERT LOCAL N°2026-04/CO/M/CAB/PAGO

Acquisition d'équipements en appui aux mairies dans le cadre de la mise en œuvre des ODD
Publication : Quotidien des marchés Publics N° 4375 - Jeudi 09 avril 2026
Date de délibération : 04/09/2026
Attributaire : ETS SODRE ET FILS pour un montant de quatre-vingt millions (80 000 000) francs CFA TTC.
`;
    const candidates = segmentAndClassify(sample);
    const synthese = candidates.find((c) => c.rawBlock.startsWith("SYNTHESE"));
    expect(synthese).toBeDefined();
    expect(synthese?.publicationTypeGuess).toBe("RESULTAT_PROVISOIRE");
  });

  it("détecte un « APPEL D'OFFRES » sans le préfixe AVIS comme un avis à part entière", () => {
    const sample = `
CAISSE AUTONOME DE RETRAITE DES FONCTIONNAIRES

Acquisition et installation de quatre groupes électrogènes au profit de la CARFO
APPEL D'OFFRES OUVERT DIRECT(AOOD) 2026-003/CARFO/DG/DMP
Date limite de dépôt des offres : 30/09/2026.
`;
    const [candidate] = segmentAndClassify(sample);
    expect(candidate.title).toContain("Acquisition et installation");
    expect(candidate.authorityGuess).toBe("CAISSE AUTONOME DE RETRAITE DES FONCTIONNAIRES");
  });

  it("tolère la coquille « ANNULLATION » (double L) présente dans les quotidiens réels", () => {
    const sample = `
COMMUNE DE LIPTOUGOU

AVIS D'ANNULLATION DE LA MANIFESTATION D'INTERET
N°2026-01/REST/PGNG/CLPTG/PRM
`;
    const [candidate] = segmentAndClassify(sample);
    expect(candidate.publicationTypeGuess).toBe("ANNULATION");
  });

  it("ne classe pas une mention incidente d'« ENTREPRISE » comme une reprise de procédure", () => {
    const sample = `
COMMUNE DE BOROMO

Travaux de construction de hangars complémentaires au marché de Boromo
AVIS DE DEMANDE DE PRIX
N°2026-03/RBM/PBL/CBRM/PRCP

Attributaire : ENTREPRISE DE CONSTRUCTION ZOUNGRANA ET FRERES pour un montant de dix millions (10 000 000) francs CFA.
Date limite de dépôt des offres : 15/10/2026.
`;
    const [candidate] = segmentAndClassify(sample);
    expect(candidate.publicationTypeGuess).toBe("DEMANDE_PRIX");
  });
});

// Un mauvais découpage de bloc (à l'intérieur d'un tableau de résultats, par
// exemple) produit parfois un « titre » qui n'en est pas un : un repère de
// liste numérotée, une référence seule, un label vide, ou une reprise en
// minuscules mi-phrase. Confirmé sur les 4 quotidiens réels : jamais observé
// sur un vrai titre de marché.
describe("segmentAndClassify — rejette les titres qui ne sont pas de vrais titres", () => {
  const casesRejected: [string, string][] = [
    ["repère de liste numérotée", "17.   Les acquisitions se décomposent en deux (02) lots répartis comme suit"],
    ["référence seule", "N°2026-036/MAERAH/SG/PRECEL/SPM du 07 Septembre 2026"],
    ["label « Objet du marché : » vide", "Objet du marché :"],
    ["reprise mi-phrase en minuscules", "lorsque le marché n'est pas réservé) (SANS OBJET)"],
    ["fragment de montant tronqué", "340) francs CFA HT avec un délai d'exécution de quatre-vingt-dix (90) jours."],
  ];

  for (const [label, badTitle] of casesRejected) {
    it(`rejette un titre "${label}"`, () => {
      const sample = `
COMMUNE DE TEST

${badTitle}
AVIS DE DEMANDE DE PRIX
N°2026-00X/TEST
`;
      const [candidate] = segmentAndClassify(sample);
      expect(candidate.title).toBeNull();
    });
  }

  it("garde un vrai titre commençant par une majuscule", () => {
    const sample = `
COMMUNE DE TEST

Acquisition de matériel informatique au profit de la mairie de Test
AVIS DE DEMANDE DE PRIX
N°2026-00X/TEST
`;
    const [candidate] = segmentAndClassify(sample);
    expect(candidate.title).toBe("Acquisition de matériel informatique au profit de la mairie de Test");
  });
});

// reviseCandidates() revalide un aperçu de candidats après aller-retour
// client (section « upload sans IA »), avant toute écriture en base — mêmes
// garanties que reviseNotices() côté Gemini : un candidat malformé n'annule
// jamais tout le lot (safeParse par élément, pas un .map(parse) qui lèverait).
describe("reviseCandidates — revalidation après aller-retour client", () => {
  const validCandidate = {
    rawBlock: "AVIS DE DEMANDE DE PRIX N°2026-001",
    publicationTypeGuess: "DEMANDE_PRIX",
    procedureTypeGuess: "DEMANDE_PRIX",
    reference: "2026-001",
    title: "Acquisition de fournitures de bureau",
    authorityGuess: "Commune de Test",
    amountExclTax: 12_000_000,
    submissionDeadline: new Date("2026-10-15"),
    withdrawalDeadline: null,
    openingAt: null,
    bidValidityDays: 90,
    executionDelayDays: 60,
    regionGuess: "Centre",
    requirements: [],
    requiredDocuments: [],
    lots: [],
    confidence: 0.8,
  };

  it("garde un candidat valide intact (dates réelles, pas des chaînes)", () => {
    const revised = reviseCandidates([validCandidate]);
    expect(revised).toHaveLength(1);
    expect(revised[0].title).toBe("Acquisition de fournitures de bureau");
    expect(revised[0].submissionDeadline).toBeInstanceOf(Date);
    expect(revised[0].submissionDeadline?.toISOString().slice(0, 10)).toBe("2026-10-15");
  });

  it("accepte aussi une date sérialisée en chaîne (aller-retour JSON)", () => {
    const revised = reviseCandidates([{ ...validCandidate, submissionDeadline: "2026-10-15T00:00:00.000Z" }]);
    expect(revised[0].submissionDeadline).toBeInstanceOf(Date);
  });

  it("écarte un seul candidat malformé sans perdre les autres", () => {
    const malformed = { ...validCandidate, rawBlock: undefined };
    const revised = reviseCandidates([validCandidate, malformed, validCandidate]);
    expect(revised).toHaveLength(2);
  });

  it("retombe sur des valeurs de repli pour un type de publication inconnu", () => {
    const revised = reviseCandidates([{ ...validCandidate, publicationTypeGuess: "TYPE_INEXISTANT" }]);
    expect(revised[0].publicationTypeGuess).toBe("AVIS_APPEL_OFFRES");
  });

  it("renvoie un tableau vide pour une entrée qui n'est pas un objet", () => {
    expect(reviseCandidates([null, 42, "texte", undefined])).toEqual([]);
  });
});
