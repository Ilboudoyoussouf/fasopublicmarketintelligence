import { prisma } from "@/lib/prisma";
import { marketListInclude } from "@/lib/queries/markets";

export type OpportunityView = "recommandees" | "nouvelles" | "urgentes" | "reservees" | "suivies" | "expirees";

export async function getOpportunities(tenantId: string, vue: OpportunityView) {
  const now = new Date();
  const in7d = new Date(now.getTime() + 7 * 86_400_000);
  const ago7d = new Date(now.getTime() - 7 * 86_400_000);

  if (vue === "recommandees") {
    const recs = await prisma.recommendation.findMany({
      where: { tenantId },
      orderBy: { rank: "asc" },
      include: { market: { include: marketListInclude } },
    });
    return recs.map((r) => r.market);
  }

  if (vue === "suivies") {
    const targets = await prisma.watchlistTarget.findMany({
      where: { watchlist: { tenantId }, marketId: { not: null } },
      include: { market: { include: marketListInclude } },
    });
    return targets.map((t) => t.market).filter((m): m is NonNullable<typeof m> => !!m);
  }

  if (vue === "expirees") {
    return prisma.market.findMany({
      where: { submissionDeadline: { lt: now } },
      include: marketListInclude,
      orderBy: { submissionDeadline: "desc" },
      take: 30,
    });
  }

  if (vue === "urgentes") {
    return prisma.market.findMany({
      where: { submissionDeadline: { gte: now, lte: in7d } },
      include: marketListInclude,
      orderBy: { submissionDeadline: "asc" },
      take: 30,
    });
  }

  if (vue === "reservees") {
    return prisma.market.findMany({
      where: { reservations: { some: {} } },
      include: marketListInclude,
      orderBy: { publishedAt: "desc" },
      take: 30,
    });
  }

  // nouvelles
  return prisma.market.findMany({
    where: { publishedAt: { gte: ago7d } },
    include: marketListInclude,
    orderBy: { publishedAt: "desc" },
    take: 30,
  });
}

export const VIEW_LABEL: Record<OpportunityView, string> = {
  recommandees: "Recommandées",
  nouvelles: "Nouvelles",
  urgentes: "Urgentes (< 7 jours)",
  reservees: "Réservées",
  suivies: "Suivies",
  expirees: "Expirées",
};
