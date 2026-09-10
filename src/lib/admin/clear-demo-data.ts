import { prisma } from "@/lib/prisma";

/**
 * Supprime les marchés de démonstration (jeu de données Annexe D créé par
 * `prisma/seed.ts`) et tout ce qui en dépend, sans toucher aux vraies
 * données ingérées depuis dgcmef.gov.bf.
 *
 * Les documents de seed sont identifiables de façon fiable : leur
 * `fileHash` commence par "sha256-demo-" (littéral, jamais produit par une
 * extraction réelle — voir `src/lib/ingestion/storage.ts` qui calcule un
 * vrai SHA-256). Un marché est "de démonstration" si son `sourceDocumentId`
 * pointe vers un tel document.
 *
 * Aucune contrainte ON DELETE CASCADE n'existe dans le schéma (section
 * traçabilité) : la suppression respecte donc l'ordre des dépendances,
 * enfants avant parents.
 */
export async function clearDemoMarkets() {
  const demoDocs = await prisma.document.findMany({
    where: { fileHash: { startsWith: "sha256-demo-" } },
    select: { id: true },
  });
  const demoDocIds = demoDocs.map((d) => d.id);

  const demoMarkets = await prisma.market.findMany({
    where: { sourceDocumentId: { in: demoDocIds } },
    select: { id: true, title: true },
  });
  const demoMarketIds = demoMarkets.map((m) => m.id);

  if (demoMarketIds.length === 0) {
    return { deletedMarkets: 0, titles: [] as string[] };
  }

  const demoBids = await prisma.bid.findMany({ where: { marketId: { in: demoMarketIds } }, select: { id: true } });
  const demoBidIds = demoBids.map((b) => b.id);
  const demoAppeals = await prisma.appeal.findMany({ where: { marketId: { in: demoMarketIds } }, select: { id: true } });
  const demoAppealIds = demoAppeals.map((a) => a.id);

  await prisma.$transaction([
    // Petits-enfants (dépendent de Bid / Appeal, pas directement de Market)
    prisma.bidCorrection.deleteMany({ where: { bidId: { in: demoBidIds } } }),
    prisma.evaluation.deleteMany({ where: { bidId: { in: demoBidIds } } }),
    prisma.appealDecision.deleteMany({ where: { appealId: { in: demoAppealIds } } }),

    // Enfants directs de Market
    prisma.marketLot.deleteMany({ where: { marketId: { in: demoMarketIds } } }),
    prisma.marketVersion.deleteMany({ where: { marketId: { in: demoMarketIds } } }),
    prisma.marketEvent.deleteMany({ where: { marketId: { in: demoMarketIds } } }),
    prisma.notice.deleteMany({ where: { marketId: { in: demoMarketIds } } }),
    prisma.correction.deleteMany({ where: { marketId: { in: demoMarketIds } } }),
    prisma.cancellation.deleteMany({ where: { marketId: { in: demoMarketIds } } }),
    prisma.republication.deleteMany({ where: { marketId: { in: demoMarketIds } } }),
    prisma.requirement.deleteMany({ where: { marketId: { in: demoMarketIds } } }),
    prisma.marketRequiredDocument.deleteMany({ where: { marketId: { in: demoMarketIds } } }),
    prisma.marketReservation.deleteMany({ where: { marketId: { in: demoMarketIds } } }),
    prisma.companyParticipation.deleteMany({ where: { marketId: { in: demoMarketIds } } }),
    prisma.bid.deleteMany({ where: { marketId: { in: demoMarketIds } } }),
    prisma.result.deleteMany({ where: { marketId: { in: demoMarketIds } } }),
    prisma.appeal.deleteMany({ where: { marketId: { in: demoMarketIds } } }),
    prisma.review.deleteMany({ where: { marketId: { in: demoMarketIds } } }),
    prisma.funding.deleteMany({ where: { marketId: { in: demoMarketIds } } }),
    prisma.score.deleteMany({ where: { marketId: { in: demoMarketIds } } }),
    prisma.matchResult.deleteMany({ where: { marketId: { in: demoMarketIds } } }),
    prisma.recommendation.deleteMany({ where: { marketId: { in: demoMarketIds } } }),
    prisma.watchlistTarget.deleteMany({ where: { marketId: { in: demoMarketIds } } }),
    prisma.dataQualityCheck.deleteMany({ where: { entityType: "Market", entityId: { in: demoMarketIds } } }),

    // Références non bloquantes à nettoyer plutôt qu'à casser
    prisma.ppmItem.updateMany({ where: { linkedMarketId: { in: demoMarketIds } }, data: { linkedMarketId: null } }),

    // Enfin, les marchés eux-mêmes
    prisma.market.deleteMany({ where: { id: { in: demoMarketIds } } }),
  ]);

  return { deletedMarkets: demoMarketIds.length, titles: demoMarkets.map((m) => m.title) };
}
