import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { registerBlockOrDetectDuplicate, computeBlockHash } from "@/lib/ingestion/dedupe";

const db = new PrismaClient();

// Reproduit le cas de l'analyse structurelle (section 1.3) : l'encart
// SONATUR est republié à l'identique dans les n°4484 et 4485 — un
// parseur naïf créerait deux fois le même résultat.
describe("registerBlockOrDetectDuplicate — déduplication par hash de bloc", () => {
  let sourceId: string;
  let pub1Id: string;
  let pub2Id: string;
  let doc1Id: string;
  let doc2Id: string;

  const SONATUR_BLOCK = "RÉSULTATS PROVISOIRES — SONATUR : demande de prix logiciels ArchiCAD/QGIS/MS PROJECT.";

  beforeAll(async () => {
    const country = await db.country.findUniqueOrThrow({ where: { code: "BF" } });
    const source = await db.source.upsert({
      where: { id: "test-source-dedup" }, update: {},
      create: { id: "test-source-dedup", countryId: country.id, name: "TEST-DEDUP", baseUrl: "https://example.test" },
    });
    sourceId = source.id;

    const pub1 = await db.publication.create({ data: { sourceId, kind: "QUOTIDIEN_MARCHES", numero: "TEST-4484", publishedAt: new Date("2026-09-09") } });
    const pub2 = await db.publication.create({ data: { sourceId, kind: "QUOTIDIEN_MARCHES", numero: "TEST-4485", publishedAt: new Date("2026-09-10") } });
    pub1Id = pub1.id;
    pub2Id = pub2.id;

    const doc1 = await db.document.create({ data: { publicationId: pub1Id, filename: "test-4484.pdf", url: "https://example.test/test-4484.pdf" } });
    const doc2 = await db.document.create({ data: { publicationId: pub2Id, filename: "test-4485.pdf", url: "https://example.test/test-4485.pdf" } });
    doc1Id = doc1.id;
    doc2Id = doc2.id;
  });

  afterAll(async () => {
    await db.blockHash.deleteMany({ where: { documentId: { in: [doc1Id, doc2Id] } } });
    await db.document.deleteMany({ where: { id: { in: [doc1Id, doc2Id] } } });
    await db.publication.deleteMany({ where: { id: { in: [pub1Id, pub2Id] } } });
    await db.source.delete({ where: { id: sourceId } });
  });

  it("produit un hash identique pour deux textes équivalents malgré des variations d'espacement/casse", () => {
    const a = computeBlockHash("RÉSULTATS   provisoires — SONATUR");
    const b = computeBlockHash("résultats provisoires —   Sonatur");
    expect(a).toBe(b);
  });

  it("n'est pas marqué republié la première fois qu'un bloc est vu", async () => {
    const result = await registerBlockOrDetectDuplicate(SONATUR_BLOCK, doc1Id);
    expect(result.isRepublished).toBe(false);
  });

  it("détecte la reprise quand le même bloc apparaît dans un autre document (n°4485 reprend le n°4484)", async () => {
    const result = await registerBlockOrDetectDuplicate(SONATUR_BLOCK, doc2Id);
    expect(result.isRepublished).toBe(true);
    expect(result.firstSeenDocumentId).toBe(doc1Id);
  });

  it("ne signale pas de faux positif pour un bloc réellement différent", async () => {
    const result = await registerBlockOrDetectDuplicate("AVIS D'APPEL D'OFFRES — objet totalement différent, jamais vu.", doc2Id);
    expect(result.isRepublished).toBe(false);
  });
});
