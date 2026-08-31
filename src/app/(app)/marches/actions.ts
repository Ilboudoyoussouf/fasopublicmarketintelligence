"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { WatchlistType } from "@prisma/client";

export async function toggleWatchMarketAction(marketId: string) {
  const { tenant } = await requireTenantContext();

  const existing = await prisma.watchlistTarget.findFirst({
    where: { marketId, watchlist: { tenantId: tenant.id, type: WatchlistType.MARKET } },
  });

  if (existing) {
    await prisma.watchlistTarget.delete({ where: { id: existing.id } });
  } else {
    const watchlist = await prisma.watchlist.findFirst({ where: { tenantId: tenant.id, type: WatchlistType.MARKET, keyword: null } })
      ?? await prisma.watchlist.create({ data: { tenantId: tenant.id, type: WatchlistType.MARKET } });
    await prisma.watchlistTarget.create({ data: { watchlistId: watchlist.id, marketId } });
  }

  revalidatePath(`/marches/${marketId}`);
  revalidatePath("/veille/watchlists");
}

export async function addToFolderAction(marketId: string) {
  const { tenant } = await requireTenantContext();
  await prisma.submissionFolder.upsert({
    where: { tenantId_marketId: { tenantId: tenant.id, marketId } },
    update: {},
    create: {
      tenantId: tenant.id,
      marketId,
      checklist: {
        create: [
          { label: "Vérifier l'éligibilité" },
          { label: "Réunir les pièces administratives" },
          { label: "Préparer l'offre technique" },
          { label: "Préparer l'offre financière" },
          { label: "Obtenir la garantie de soumission" },
          { label: "Déposer l'offre avant échéance" },
        ],
      },
    },
  });
  revalidatePath("/dossiers");
  revalidatePath(`/marches/${marketId}`);
}
