import { prisma } from "@/lib/prisma";

export async function getMarketDetail(marketId: string) {
  const market = await prisma.market.findUnique({
    where: { id: marketId },
    include: {
      contractingAuthority: true,
      sector: true,
      subsector: true,
      region: true,
      lots: { include: { attributaire: true } },
      requirements: true,
      requiredDocuments: true,
      reservations: true,
      events: { orderBy: { occurredAt: "asc" } },
      versions: { orderBy: { versionNumber: "asc" } },
      corrections: { orderBy: { effectiveAt: "asc" } },
      cancellations: true,
      republications: true,
      results: { include: { winnerCompany: true } },
      appeals: { include: { decisions: true, requesterCompany: true } },
      reviews: true,
      notices: { orderBy: { publishedAt: "asc" }, include: { publication: true, document: true } },
      fundings: { include: { donor: true, project: true } },
      bids: { include: { company: true }, orderBy: { rank: "asc" } },
    },
  });
  if (!market) return null;

  const sectorMarketIds = market.sectorId
    ? (await prisma.market.findMany({ where: { sectorId: market.sectorId }, select: { id: true } })).map((m) => m.id)
    : [];

  const [priceStats, competitorHistory] = await Promise.all([
    market.sectorId
      ? prisma.market.aggregate({
          where: { sectorId: market.sectorId, amountAwarded: { not: null } },
          _avg: { amountAwarded: true },
          _min: { amountAwarded: true },
          _max: { amountAwarded: true },
          _count: { _all: true },
        })
      : null,
    sectorMarketIds.length > 0
      ? prisma.companyParticipation.groupBy({
          by: ["companyId"],
          where: { marketId: { in: sectorMarketIds } },
          _count: { _all: true },
          orderBy: { _count: { companyId: "desc" } },
          take: 5,
        })
      : Promise.resolve([]),
  ]);

  const competitorIds = competitorHistory.map((c) => c.companyId);
  const competitors = competitorIds.length
    ? await prisma.company.findMany({ where: { id: { in: competitorIds } } })
    : [];
  const competitorById = new Map(competitors.map((c) => [c.id, c]));

  return {
    market,
    priceStats,
    competitors: competitorHistory.map((c) => ({ company: competitorById.get(c.companyId), count: c._count._all })),
  };
}
