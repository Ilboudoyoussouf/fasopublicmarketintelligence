import { describe, it, expect, beforeAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { computeScoresForTenant } from "@/lib/scoring/engine";

const db = new PrismaClient();

describe("moteur de scoring & matching (sections 18, 19, 73) — intégration base réelle", () => {
  let tenantId: string;

  beforeAll(async () => {
    const tenant = await db.tenant.findFirst({ where: { name: "TECH SAHEL SOLUTIONS SARL" } });
    if (!tenant) throw new Error("Tenant de démonstration introuvable — exécuter `npx prisma db seed` avant les tests.");
    tenantId = tenant.id;
  });

  it("calcule des scores pour les marchés ouverts, tous compris entre 0 et 100", async () => {
    const results = await computeScoresForTenant(tenantId);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.global).toBeGreaterThanOrEqual(0);
      expect(r.global).toBeLessThanOrEqual(100);
    }
  });

  it("persiste un score explicable (facteurs non vides) pour chaque marché noté", async () => {
    await computeScoresForTenant(tenantId);
    const scores = await db.score.findMany({ where: { tenantId } });
    expect(scores.length).toBeGreaterThan(0);
    for (const s of scores) {
      expect(Object.keys(s.factors as object).length).toBeGreaterThan(0);
      expect(s.pertinence).toBeGreaterThanOrEqual(0);
      expect(s.eligibilite).toBeGreaterThanOrEqual(0);
      expect(s.attractivite).toBeGreaterThanOrEqual(0);
    }
  });

  it("produit un verdict de matching valide pour chaque marché noté", async () => {
    await computeScoresForTenant(tenantId);
    const matches = await db.matchResult.findMany({ where: { tenantId } });
    const validVerdicts = ["COMPATIBLE", "PROBABLEMENT_COMPATIBLE", "A_VERIFIER", "INCOMPATIBLE"];
    expect(matches.length).toBeGreaterThan(0);
    for (const m of matches) expect(validVerdicts).toContain(m.verdict);
  });

  it("classe le marché informatique en tête des recommandations pour un profil informatique/réseaux", async () => {
    await computeScoresForTenant(tenantId, { topRecommendations: 5 });
    const top = await db.recommendation.findFirst({ where: { tenantId, rank: 1 }, include: { market: { include: { sector: true } } } });
    expect(top).not.toBeNull();
    // Le tenant de démo cible informatique/réseaux/développement — le marché
    // le mieux classé doit appartenir à la famille "Fournitures et services"
    // ou "Prestations intellectuelles", jamais à un secteur sans rapport.
    expect(["FOURNITURES_SERVICES", "PRESTATIONS_INTELLECTUELLES"]).toContain(top!.market.sector?.group);
  });
});
