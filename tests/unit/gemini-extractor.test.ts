import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { extractNoticesWithGemini, extractQuotidienWithGemini, isGeminiConfigured, reviseNotices } from "@/lib/ingestion/gemini-extractor";

function geminiResponse(text: string, finishReason = "STOP") {
  return {
    ok: true,
    status: 200,
    json: async () => ({ candidates: [{ content: { parts: [{ text }] }, finishReason }] }),
  };
}

function geminiError(status: number, message = "erreur") {
  return { ok: false, status, text: async () => JSON.stringify({ error: { code: status, message } }) };
}

describe("gemini-extractor — isGeminiConfigured", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  afterEach(() => {
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  });

  it("reflète la présence de la variable d'environnement", () => {
    delete process.env.GEMINI_API_KEY;
    expect(isGeminiConfigured()).toBe(false);
    process.env.GEMINI_API_KEY = "test-key";
    expect(isGeminiConfigured()).toBe(true);
  });
});

describe("gemini-extractor — extractNoticesWithGemini", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lève une erreur sans clé API", async () => {
    const previous = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      await expect(extractNoticesWithGemini(Buffer.from("pdf"), { apiKey: undefined })).rejects.toThrow(/GEMINI_API_KEY/);
    } finally {
      if (previous !== undefined) process.env.GEMINI_API_KEY = previous;
    }
  });

  it("parse une réponse conforme et normalise les dates/enums", async () => {
    const payload = JSON.stringify({
      notices: [
        {
          isFreshCall: true,
          publicationType: "DEMANDE_PRIX",
          procedureType: "demande_prix",
          title: "Acquisition de matériel informatique au profit de la mairie",
          reference: "2026-001/TEST",
          authorityName: "COMMUNE DE TEST",
          authorityType: "commune",
          sectorGroup: "fournitures_services",
          submissionDeadline: "2026-10-15",
          amountEstimatedExclTax: "17796610",
          requirements: [{ type: "chiffre_affaires", rawText: "CA min 50M", thresholdValue: 50000000 }],
          lots: [{ numero: "1", objet: "Lot unique" }],
        },
      ],
    });
    vi.mocked(fetch).mockResolvedValueOnce(geminiResponse(payload) as unknown as Response);

    const notices = await extractNoticesWithGemini(Buffer.from("pdf"), { apiKey: "test-key" });
    expect(notices).toHaveLength(1);
    const [n] = notices;
    expect(n.isFreshCall).toBe(true);
    expect(n.publicationType).toBe("DEMANDE_PRIX");
    expect(n.procedureType).toBe("DEMANDE_PRIX");
    expect(n.authorityType).toBe("COMMUNE");
    expect(n.sectorGroup).toBe("FOURNITURES_SERVICES");
    expect(n.submissionDeadline?.toISOString().slice(0, 10)).toBe("2026-10-15");
    expect(n.amountEstimatedExclTax).toBe(17796610);
    expect(n.requirements[0].type).toBe("CHIFFRE_AFFAIRES");
    expect(n.lots[0].numero).toBe("1");
  });

  it("tronque les champs trop longs plutôt que de rejeter tout le lot", async () => {
    const longTitle = "A".repeat(400);
    const payload = JSON.stringify({
      notices: [
        {
          isFreshCall: true,
          publicationType: "DEMANDE_PRIX",
          authorityType: "AUTRE",
          title: longTitle,
        },
      ],
    });
    vi.mocked(fetch).mockResolvedValueOnce(geminiResponse(payload) as unknown as Response);

    const notices = await extractNoticesWithGemini(Buffer.from("pdf"), { apiKey: "test-key" });
    expect(notices).toHaveLength(1);
    expect(notices[0].title.length).toBeLessThanOrEqual(190);
  });

  it("retombe sur une valeur par défaut pour un enum inconnu au lieu d'échouer", async () => {
    const payload = JSON.stringify({
      notices: [
        {
          isFreshCall: false,
          publicationType: "TYPE_INEXISTANT",
          authorityType: "TYPE_INEXISTANT",
          title: "Contenu de suivi",
        },
      ],
    });
    vi.mocked(fetch).mockResolvedValueOnce(geminiResponse(payload) as unknown as Response);

    const notices = await extractNoticesWithGemini(Buffer.from("pdf"), { apiKey: "test-key" });
    expect(notices[0].publicationType).toBe("AVIS_APPEL_OFFRES");
    expect(notices[0].authorityType).toBe("AUTRE");
  });

  it("filtre les avis sans titre exploitable", async () => {
    const payload = JSON.stringify({
      notices: [
        { isFreshCall: true, publicationType: "DEMANDE_PRIX", authorityType: "AUTRE", title: "Acquisition de fournitures scolaires" },
        { isFreshCall: true, publicationType: "DEMANDE_PRIX", authorityType: "AUTRE", title: "" },
      ],
    });
    vi.mocked(fetch).mockResolvedValueOnce(geminiResponse(payload) as unknown as Response);

    const notices = await extractNoticesWithGemini(Buffer.from("pdf"), { apiKey: "test-key" });
    expect(notices).toHaveLength(1);
  });

  it("réessaie sur une erreur 503 transitoire puis réussit", async () => {
    const payload = JSON.stringify({ notices: [{ isFreshCall: true, publicationType: "DEMANDE_PRIX", authorityType: "AUTRE", title: "Acquisition après réessai" }] });
    vi.mocked(fetch)
      .mockResolvedValueOnce(geminiError(503) as unknown as Response)
      .mockResolvedValueOnce(geminiResponse(payload) as unknown as Response);

    const notices = await extractNoticesWithGemini(Buffer.from("pdf"), { apiKey: "test-key" });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(notices).toHaveLength(1);
    expect(notices[0].title).toBe("Acquisition après réessai");
  });

  it("n'insiste pas sur une erreur définitive (401)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(geminiError(401, "clé invalide") as unknown as Response);
    await expect(extractNoticesWithGemini(Buffer.from("pdf"), { apiKey: "bad-key" })).rejects.toThrow(/401/);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("échoue proprement quand la réponse n'est pas un JSON exploitable", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(geminiResponse("ceci n'est pas du JSON") as unknown as Response);
    await expect(extractNoticesWithGemini(Buffer.from("pdf"), { apiKey: "test-key" })).rejects.toThrow();
  });
});

describe("gemini-extractor — extractQuotidienWithGemini (numéro/date du bulletin)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lit le numéro et la date du quotidien en plus des avis — dépôt manuel sans saisie humaine", async () => {
    const payload = JSON.stringify({
      quotidienNumero: "4485",
      quotidienDate: "2025-06-15",
      notices: [{ isFreshCall: true, publicationType: "DEMANDE_PRIX", authorityType: "AUTRE", title: "Acquisition de fournitures de bureau" }],
    });
    vi.mocked(fetch).mockResolvedValueOnce(geminiResponse(payload) as unknown as Response);

    const result = await extractQuotidienWithGemini(Buffer.from("pdf"), { apiKey: "test-key" });
    expect(result.publicationNumero).toBe("4485");
    expect(result.publicationDate?.toISOString().slice(0, 10)).toBe("2025-06-15");
    expect(result.notices).toHaveLength(1);
  });

  it("renvoie null pour le numéro/la date si Gemini ne les a pas trouvés, sans faire échouer l'extraction", async () => {
    const payload = JSON.stringify({
      notices: [{ isFreshCall: true, publicationType: "DEMANDE_PRIX", authorityType: "AUTRE", title: "Acquisition sans en-tête lisible" }],
    });
    vi.mocked(fetch).mockResolvedValueOnce(geminiResponse(payload) as unknown as Response);

    const result = await extractQuotidienWithGemini(Buffer.from("pdf"), { apiKey: "test-key" });
    expect(result.publicationNumero).toBeNull();
    expect(result.publicationDate).toBeNull();
    expect(result.notices).toHaveLength(1);
  });
});

describe("gemini-extractor — résilience aux avis mal formés (aucune perte du lot pour la faute d'un seul)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("conserve les avis valides même si d'autres éléments du tableau sont totalement inexploitables", async () => {
    // Avant la correction, z.array(noticeSchema) rejetait TOUT le tableau dès
    // qu'un seul élément n'était pas un objet — perdant les avis valides au
    // passage (le bug remonté : « parfois pas d'aperçu de tous les marchés »).
    const payload = JSON.stringify({
      notices: [
        { isFreshCall: true, publicationType: "DEMANDE_PRIX", authorityType: "AUTRE", title: "Premier marché valide" },
        null,
        "élément totalement invalide",
        { isFreshCall: true, publicationType: "DEMANDE_PRIX", authorityType: "AUTRE", title: "Second marché valide" },
      ],
    });
    vi.mocked(fetch).mockResolvedValueOnce(geminiResponse(payload) as unknown as Response);

    const result = await extractQuotidienWithGemini(Buffer.from("pdf"), { apiKey: "test-key" });
    expect(result.notices).toHaveLength(2);
    expect(result.notices.map((n) => n.title)).toEqual(["Premier marché valide", "Second marché valide"]);
    expect(result.invalidCount).toBe(2);
  });

  it("absorbe un type inattendu sur un champ numérique/booléen/date sans rejeter l'avis entier", async () => {
    const payload = JSON.stringify({
      notices: [
        {
          isFreshCall: "oui", // type inattendu (chaîne au lieu de booléen)
          publicationType: "DEMANDE_PRIX",
          authorityType: "AUTRE",
          title: "Marché avec champs partiellement mal formés",
          amountEstimatedExclTax: true, // type inattendu (booléen au lieu de nombre)
          submissionDeadline: 20260101, // type inattendu (nombre au lieu de chaîne AAAA-MM-JJ)
          confidence: {}, // type inattendu (objet)
        },
      ],
    });
    vi.mocked(fetch).mockResolvedValueOnce(geminiResponse(payload) as unknown as Response);

    const result = await extractQuotidienWithGemini(Buffer.from("pdf"), { apiKey: "test-key" });
    expect(result.invalidCount).toBe(0);
    expect(result.notices).toHaveLength(1);
    expect(result.notices[0].amountEstimatedExclTax).toBeNull();
    expect(result.notices[0].submissionDeadline).toBeNull();
    expect(result.notices[0].confidence).toBe(0.7);
  });

  it("récupère les avis complets d'une réponse tronquée (limite de tokens de sortie atteinte)", async () => {
    // Réponse coupée en plein milieu du deuxième avis — simule
    // finishReason=MAX_TOKENS sur un document volumineux.
    const truncatedText = '{"notices": [' +
      '{"isFreshCall": true, "publicationType": "DEMANDE_PRIX", "authorityType": "AUTRE", "title": "Avis complet avant la coupure"},' +
      '{"isFreshCall": true, "publicationType": "DEMANDE_PRIX", "title": "Avis incomplet coupé en pl';
    vi.mocked(fetch).mockResolvedValueOnce(geminiResponse(truncatedText, "MAX_TOKENS") as unknown as Response);

    const result = await extractQuotidienWithGemini(Buffer.from("pdf"), { apiKey: "test-key" });
    expect(result.truncated).toBe(true);
    expect(result.notices).toHaveLength(1);
    expect(result.notices[0].title).toBe("Avis complet avant la coupure");
  });

  it("signale une troncature même quand le JSON reste syntaxiquement valide (finishReason=MAX_TOKENS)", async () => {
    const payload = JSON.stringify({ notices: [{ isFreshCall: true, publicationType: "DEMANDE_PRIX", authorityType: "AUTRE", title: "Avis isolé" }] });
    vi.mocked(fetch).mockResolvedValueOnce(geminiResponse(payload, "MAX_TOKENS") as unknown as Response);

    const result = await extractQuotidienWithGemini(Buffer.from("pdf"), { apiKey: "test-key" });
    expect(result.truncated).toBe(true);
    expect(result.notices).toHaveLength(1);
  });
});

describe("gemini-extractor — reviseNotices (aller-retour client avant écriture en base)", () => {
  it("conserve les avis valides même si l'un d'eux a été altéré côté client", () => {
    const notices = reviseNotices([
      { isFreshCall: true, publicationType: "DEMANDE_PRIX", authorityType: "AUTRE", title: "Avis valide" },
      null,
      "pas un objet",
    ]);
    expect(notices).toHaveLength(1);
    expect(notices[0].title).toBe("Avis valide");
  });
});
