import { describe, it, expect, beforeAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { askAssistant } from "@/lib/ai/assistant";

const db = new PrismaClient();

describe("assistant IA — anti-hallucination (section 90)", () => {
  let tenantId: string;

  beforeAll(async () => {
    const tenant = await db.tenant.findFirst({ where: { name: "TECH SAHEL SOLUTIONS SARL" } });
    if (!tenant) throw new Error("Tenant de démonstration introuvable — exécuter `npx prisma db seed` avant les tests.");
    tenantId = tenant.id;
  });

  it("répond avec des sources citées pour une question à laquelle des données existent", async () => {
    const result = await askAssistant(tenantId, "Quels marchés me correspondent cette semaine ?");
    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.answer).not.toContain("Information non trouvée");
    expect(result.dataUsed.length).toBeGreaterThan(0);
  });

  it("annonce explicitement l'absence de donnée plutôt que d'inventer une réponse", async () => {
    const result = await askAssistant(tenantId, "Quel est le score de crédit international de l'entreprise Zzzyyxx Introuvable ?");
    expect(result.answer).toContain("Information non trouvée");
  });

  it("avertit toujours que les scores/recommandations sont indicatifs", async () => {
    const result = await askAssistant(tenantId, "Quels sont mes principaux concurrents ?");
    expect(result.warnings.join(" ")).toMatch(/indicatifs|décision administrative/i);
  });
});
