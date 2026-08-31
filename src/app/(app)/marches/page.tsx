import { Suspense } from "react";
import { requireTenantContext } from "@/lib/session";
import { listMarkets, type MarketFilters } from "@/lib/queries/markets";
import { prisma } from "@/lib/prisma";
import { MarketRow } from "@/components/domain/MarketRow";
import { FilterBar } from "@/components/domain/FilterBar";
import { StateNotice } from "@/components/ui/StateNotice";
import { SECTOR_GROUP_LABEL, MARKET_STATUS_LABEL } from "@/lib/labels";
import { Pagination } from "@/components/domain/Pagination";
import type { MarketStatus, SectorGroup } from "@prisma/client";

export default async function MarchesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { tenant } = await requireTenantContext();
  const sp = await searchParams;
  const page = Number(sp.page ?? "1");

  const filters: MarketFilters = {
    q: sp.q,
    groupe: sp.groupe as SectorGroup | undefined,
    sectorId: sp.sectorId,
    region: sp.region,
    organisme: sp.organisme,
    statut: sp.statut as MarketStatus | undefined,
    tri: (sp.tri as MarketFilters["tri"]) ?? "recent",
  };

  const [{ items, total }, sectors, authorities, regions, scores] = await Promise.all([
    listMarkets(filters, { take: 20, skip: (page - 1) * 20 }),
    prisma.sector.findMany({ orderBy: { name: "asc" } }),
    prisma.contractingAuthority.findMany({ orderBy: { name: "asc" } }),
    prisma.region.findMany({ orderBy: { name: "asc" } }),
    prisma.score.findMany({ where: { tenantId: tenant.id } }),
  ]);
  const scoreByMarket = new Map(scores.map((s) => [s.marketId, s.global]));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Marchés</h1>
        <p className="text-sm text-ink-muted">{total} marché(s) — filtrez par catégorie, procédure, région, organisme, montant ou statut.</p>
      </div>

      <Suspense>
        <FilterBar
          fields={[
            { type: "search", name: "q", placeholder: "Rechercher un marché…" },
            { type: "select", name: "groupe", label: "Toutes catégories", options: Object.entries(SECTOR_GROUP_LABEL).map(([value, label]) => ({ value, label })) },
            { type: "select", name: "sectorId", label: "Tous secteurs", options: sectors.map((s) => ({ value: s.id, label: s.name })) },
            { type: "select", name: "region", label: "Toutes régions", options: regions.map((r) => ({ value: r.name, label: r.name })) },
            { type: "select", name: "organisme", label: "Tous organismes", options: authorities.map((a) => ({ value: a.id, label: a.name })) },
            { type: "select", name: "statut", label: "Tous statuts", options: Object.entries(MARKET_STATUS_LABEL).map(([value, label]) => ({ value, label })) },
            { type: "select", name: "tri", label: "Trier : plus récent", options: [{ value: "montant_desc", label: "Montant décroissant" }, { value: "echeance_asc", label: "Échéance la plus proche" }] },
          ]}
        />
      </Suspense>

      {items.length === 0 ? (
        <StateNotice kind="empty" title="Aucun marché ne correspond à ces filtres" description="Essayez d'élargir votre recherche." />
      ) : (
        <div className="space-y-2">
          {items.map((m) => (
            <MarketRow key={m.id} market={m} score={scoreByMarket.get(m.id)} />
          ))}
        </div>
      )}

      <Suspense>
        <Pagination total={total} page={page} pageSize={20} />
      </Suspense>

      <p className="text-[11px] text-ink-faint">
        Source : DGCMEF — les données affichées renvoient à leur publication d&apos;origine depuis la fiche marché.
      </p>
    </div>
  );
}
