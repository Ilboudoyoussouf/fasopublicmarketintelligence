import { prisma } from "@/lib/prisma";
import { MarketStatus } from "@prisma/client";

const OPEN: MarketStatus[] = [MarketStatus.PUBLIE, MarketStatus.RECTIFIE, MarketStatus.REPRIS, MarketStatus.EN_EVALUATION];

export async function getDashboardData(tenantId: string) {
  const now = new Date();
  const in7d = new Date(now.getTime() + 7 * 86_400_000);
  const ago7d = new Date(now.getTime() - 7 * 86_400_000);
  const ago14d = new Date(now.getTime() - 14 * 86_400_000);
  const ago30d = new Date(now.getTime() - 30 * 86_400_000);

  const [
    newOpportunities,
    matchingCount,
    deadlineSoon,
    watchedCount,
    recentResults,
    planifiedCount,
    criticalAlerts,
    matchedScores,
    recommendations,
    activityMarkets,
    topAuthorities,
    topSectors,
    topCompanies,
    recentAlerts,
  ] = await Promise.all([
    prisma.market.count({ where: { status: { in: OPEN }, publishedAt: { gte: ago7d } } }),
    prisma.matchResult.count({ where: { tenantId, verdict: { in: ["COMPATIBLE", "PROBABLEMENT_COMPATIBLE"] } } }),
    prisma.score.count({ where: { tenantId, global: { gte: 50 }, market: { submissionDeadline: { gte: now, lte: in7d } } } }),
    prisma.watchlistTarget.count({ where: { watchlist: { tenantId }, marketId: { not: null } } }),
    prisma.result.count({ where: { resultAt: { gte: ago14d } } }),
    prisma.ppmItem.count({ where: { status: "PLANIFIE" } }),
    prisma.alert.count({ where: { tenantId, priority: "CRITIQUE", readAt: null } }),
    prisma.score.findMany({ where: { tenantId, global: { gte: 50 } }, include: { market: true } }),
    prisma.recommendation.findMany({
      where: { tenantId },
      orderBy: { rank: "asc" },
      take: 5,
      include: { market: { include: { contractingAuthority: true, sector: true } } },
    }),
    prisma.market.findMany({ where: { publishedAt: { gte: ago30d } }, select: { publishedAt: true, amountEstimatedExclTax: true } }),
    prisma.market.groupBy({ by: ["contractingAuthorityId"], _count: { _all: true }, orderBy: { _count: { contractingAuthorityId: "desc" } }, take: 5 }),
    prisma.market.groupBy({ by: ["sectorId"], _count: { _all: true }, orderBy: { _count: { sectorId: "desc" } }, take: 6, where: { sectorId: { not: null } } }),
    prisma.companyParticipation.groupBy({ by: ["companyId"], _count: { _all: true }, orderBy: { _count: { companyId: "desc" } }, take: 5 }),
    prisma.alert.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  const totalValue = matchedScores.reduce((sum, s) => sum + Number(s.market.amountEstimatedExclTax ?? 0), 0);

  const authorityIds = topAuthorities.map((a) => a.contractingAuthorityId);
  const authorities = await prisma.contractingAuthority.findMany({ where: { id: { in: authorityIds } } });
  const authorityById = new Map(authorities.map((a) => [a.id, a]));

  const sectorIds = topSectors.map((s) => s.sectorId).filter((v): v is string => !!v);
  const sectors = await prisma.sector.findMany({ where: { id: { in: sectorIds } } });
  const sectorById = new Map(sectors.map((s) => [s.id, s]));

  const companyIds = topCompanies.map((c) => c.companyId);
  const companies = await prisma.company.findMany({ where: { id: { in: companyIds } } });
  const companyById = new Map(companies.map((c) => [c.id, c]));

  // Timeline d'échéances (marchés pertinents à venir sous 14 jours)
  const upcomingDeadlines = await prisma.score.findMany({
    where: { tenantId, global: { gte: 40 }, market: { submissionDeadline: { gte: now } } },
    orderBy: { market: { submissionDeadline: "asc" } },
    take: 6,
    include: { market: true },
  });

  return {
    kpis: {
      newOpportunities,
      matchingCount,
      deadlineSoon,
      watchedCount,
      recentResults,
      planifiedCount,
      criticalAlerts,
      totalValue,
    },
    recommendations,
    activityMarkets,
    topAuthorities: topAuthorities.map((a) => ({ name: authorityById.get(a.contractingAuthorityId)?.name ?? "—", count: a._count._all })),
    topSectors: topSectors.map((s) => ({ name: sectorById.get(s.sectorId!)?.name ?? "—", count: s._count._all })),
    topCompanies: topCompanies.map((c) => ({ name: companyById.get(c.companyId)?.canonicalName ?? "—", count: c._count._all })),
    upcomingDeadlines,
    recentAlerts,
  };
}
