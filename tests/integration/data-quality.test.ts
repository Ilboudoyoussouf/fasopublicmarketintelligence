import { describe, it, expect } from "vitest";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

describe("qualité des données — invariants (section 44, 72)", () => {
  it("chaque marché rattaché à un document source référence un document existant", async () => {
    const markets = await db.market.findMany({ where: { sourceDocumentId: { not: null } }, select: { id: true, sourceDocumentId: true } });
    expect(markets.length).toBeGreaterThan(0);
    for (const m of markets) {
      const doc = await db.document.findUnique({ where: { id: m.sourceDocumentId! } });
      expect(doc, `Document manquant pour le marché ${m.id}`).not.toBeNull();
    }
  });

  it("aucune entreprise en doublon exact (même pays, même raison sociale canonique)", async () => {
    const companies = await db.company.findMany({ select: { countryId: true, canonicalName: true } });
    const seen = new Set<string>();
    for (const c of companies) {
      const key = `${c.countryId}::${c.canonicalName.toLowerCase()}`;
      expect(seen.has(key), `Doublon détecté : ${c.canonicalName}`).toBe(false);
      seen.add(key);
    }
  });

  it("aucun montant négatif sur les marchés", async () => {
    const markets = await db.market.findMany({
      where: { OR: [{ amountEstimatedExclTax: { lt: 0 } }, { amountAwarded: { lt: 0 } }] },
    });
    expect(markets).toHaveLength(0);
  });

  it("les alertes référencent toutes un tenant existant", async () => {
    const alerts = await db.alert.findMany({ select: { tenantId: true } });
    const tenantIds = new Set((await db.tenant.findMany({ select: { id: true } })).map((t) => t.id));
    for (const a of alerts) expect(tenantIds.has(a.tenantId)).toBe(true);
  });

  it("un marché rectifié conserve un historique de versions", async () => {
    const rectified = await db.market.findMany({ where: { status: "RECTIFIE" }, include: { versions: true, corrections: true } });
    for (const m of rectified) {
      expect(m.versions.length, `Marché rectifié ${m.id} sans historique de versions`).toBeGreaterThan(0);
      expect(m.corrections.length, `Marché rectifié ${m.id} sans enregistrement de correction`).toBeGreaterThan(0);
    }
  });

  it("chaque résolution d'entité (alias) reste rattachée à une entreprise existante", async () => {
    const aliases = await db.companyAlias.findMany();
    for (const alias of aliases) {
      const company = await db.company.findUnique({ where: { id: alias.companyId } });
      expect(company).not.toBeNull();
    }
  });
});
