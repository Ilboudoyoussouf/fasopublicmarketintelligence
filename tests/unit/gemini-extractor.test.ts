import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { extractNoticesWithGemini, isGeminiConfigured } from "@/lib/ingestion/gemini-extractor";

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
