import { prisma } from "@/lib/prisma";
import { generateGroundedAnswer, isAiConfigured } from "@/lib/ai/provider";
import { runGlobalSearch } from "@/lib/search/nl-query";
import { formatFcfa, formatDate } from "@/lib/utils";
import { REJECTION_REASON_LABEL, REQUIRED_DOC_LABEL } from "@/lib/labels";

export type AssistantSource = { entityType: string; entityId: string; excerpt: string };
export type AssistantAnswer = {
  answer: string;
  dataUsed: string[];
  reasoning: string;
  confidence: "élevée" | "moyenne" | "faible";
  sources: AssistantSource[];
  warnings: string[];
};

const NO_DATA = "Information non trouvée dans les sources disponibles.";

async function retrieveMatchingOpportunities(tenantId: string) {
  return prisma.recommendation.findMany({
    where: { tenantId },
    orderBy: { rank: "asc" },
    take: 5,
    include: { market: { include: { contractingAuthority: true } } },
  });
}

async function retrieveMissingDocuments(tenantId: string) {
  const [tenantDocs, topRec] = await Promise.all([
    prisma.tenantDocument.findMany({ where: { tenantId } }),
    prisma.recommendation.findFirst({ where: { tenantId }, orderBy: { rank: "asc" } }),
  ]);
  if (!topRec) return { market: null, missing: [] as string[] };
  const required = await prisma.marketRequiredDocument.findMany({ where: { marketId: topRec.marketId } });
  const validTypes = new Set(tenantDocs.filter((d) => d.status === "VALID").map((d) => d.docType));
  const missing = required.filter((r) => r.mandatory && !validTypes.has(r.docType)).map((r) => REQUIRED_DOC_LABEL[r.docType]);
  const market = await prisma.market.findUnique({ where: { id: topRec.marketId } });
  return { market, missing };
}

async function retrieveCompetitors(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, include: { sectors: { include: { sector: true } } } });
  const sectorIds = tenant?.sectors.map((s) => s.sectorId) ?? [];
  if (sectorIds.length === 0) return [];
  const marketIds = (await prisma.market.findMany({ where: { sectorId: { in: sectorIds } }, select: { id: true } })).map((m) => m.id);
  const groups = await prisma.companyParticipation.groupBy({ by: ["companyId"], where: { marketId: { in: marketIds } }, _count: { _all: true }, orderBy: { _count: { companyId: "desc" } }, take: 5 });
  const companies = await prisma.company.findMany({ where: { id: { in: groups.map((g) => g.companyId) } } });
  const byId = new Map(companies.map((c) => [c.id, c.canonicalName]));
  return groups.map((g) => ({ name: byId.get(g.companyId) ?? "—", count: g._count._all }));
}

async function retrieveRejectionCauses() {
  const bids = await prisma.bid.findMany({ where: { conformity: false, rejectionReason: { not: null } } });
  const counts = new Map<string, number>();
  for (const b of bids) {
    if (!b.rejectionReason) continue;
    const label = REJECTION_REASON_LABEL[b.rejectionReason];
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export async function askAssistant(tenantId: string, question: string): Promise<AssistantAnswer> {
  const q = question.toLowerCase();
  const sources: AssistantSource[] = [];
  const dataUsed: string[] = [];
  let contextText = "";
  let deterministicAnswer: string | null = null;

  if (/correspond|opportunit[ée]/.test(q) && /march[ée]|semaine/.test(q)) {
    const recs = await retrieveMatchingOpportunities(tenantId);
    dataUsed.push(`${recs.length} recommandation(s) actives`);
    contextText = recs.map((r) => `- ${r.market.title} (${r.market.contractingAuthority.name}, échéance ${formatDate(r.market.submissionDeadline)})`).join("\n");
    for (const r of recs) sources.push({ entityType: "market", entityId: r.marketId, excerpt: r.market.title });
    deterministicAnswer = recs.length
      ? `${recs.length} opportunité(s) correspondent actuellement à votre profil :\n` + recs.map((r) => `• ${r.market.title} — échéance ${formatDate(r.market.submissionDeadline)}`).join("\n")
      : NO_DATA;
  } else if (/document.*manqu|manqu.*document|pi[eè]ces?.*manqu/.test(q)) {
    const { market, missing } = await retrieveMissingDocuments(tenantId);
    if (market) {
      dataUsed.push(`Documents requis pour « ${market.title} »`);
      sources.push({ entityType: "market", entityId: market.id, excerpt: market.title });
      contextText = `Marché : ${market.title}. Documents manquants : ${missing.join(", ") || "aucun"}.`;
      deterministicAnswer = missing.length
        ? `Pour votre opportunité prioritaire « ${market.title} », il vous manque : ${missing.join(", ")}.`
        : `Pour votre opportunité prioritaire « ${market.title} », aucune pièce obligatoire ne manque dans votre bibliothèque de documents.`;
    } else {
      deterministicAnswer = NO_DATA;
    }
  } else if (/concurrent/.test(q)) {
    const competitors = await retrieveCompetitors(tenantId);
    dataUsed.push(`${competitors.length} concurrent(s) identifié(s) dans vos secteurs`);
    contextText = competitors.map((c) => `- ${c.name} : ${c.count} participation(s)`).join("\n");
    deterministicAnswer = competitors.length
      ? `Vos principaux concurrents dans vos secteurs suivis :\n` + competitors.map((c) => `• ${c.name} — ${c.count} participation(s)`).join("\n")
      : NO_DATA;
  } else if (/rejet|échec|echec|refus/.test(q)) {
    const causes = await retrieveRejectionCauses();
    dataUsed.push(`${causes.length} motif(s) de rejet observés dans l'historique disponible`);
    contextText = causes.map(([label, count]) => `- ${label} : ${count}`).join("\n");
    deterministicAnswer = causes.length
      ? `Motifs de rejet les plus fréquents observés dans les résultats disponibles :\n` + causes.map(([label, count]) => `• ${label} (${count})`).join("\n")
      : NO_DATA;
  } else {
    const { markets, companies, authorities } = await runGlobalSearch(question);
    dataUsed.push(`${markets.length} marché(s), ${companies.length} entreprise(s), ${authorities.length} organisme(s) trouvés`);
    contextText = markets.map((m) => `- Marché : ${m.title} — ${m.contractingAuthority.name} — ${formatFcfa(m.amountEstimatedExclTax?.toString())}`).join("\n");
    for (const m of markets.slice(0, 5)) sources.push({ entityType: "market", entityId: m.id, excerpt: m.title });
    deterministicAnswer = markets.length
      ? `Résultats les plus pertinents trouvés dans les données disponibles :\n` + markets.slice(0, 5).map((m) => `• ${m.title}`).join("\n")
      : NO_DATA;
  }

  const warnings = ["Les scores et recommandations sont indicatifs et ne constituent ni une décision administrative ni une garantie de succès."];
  let confidence: AssistantAnswer["confidence"] = contextText ? "moyenne" : "faible";

  let answer = deterministicAnswer ?? NO_DATA;
  if (isAiConfigured() && contextText) {
    const generated = await generateGroundedAnswer(question, contextText);
    if (generated) {
      answer = generated;
      confidence = "élevée";
    }
  } else if (!isAiConfigured()) {
    warnings.push("Synthèse générative désactivée (aucune clé ANTHROPIC_API_KEY configurée) — réponse construite directement à partir des données récupérées.");
  }

  return {
    answer,
    dataUsed,
    reasoning: `Requête analysée localement et confrontée aux données structurées (marchés, résultats, profil entreprise) avant toute synthèse.`,
    confidence,
    sources,
    warnings,
  };
}
