import Link from "next/link";
import { requireTenantContext } from "@/lib/session";
import { getOpportunities, VIEW_LABEL, type OpportunityView } from "@/lib/queries/opportunities";
import { prisma } from "@/lib/prisma";
import { MarketRow } from "@/components/domain/MarketRow";
import { StateNotice } from "@/components/ui/StateNotice";
import { cn } from "@/lib/utils";

export default async function OpportunitesPage({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const { tenant } = await requireTenantContext();
  const sp = await searchParams;
  const vue = (sp.vue as OpportunityView) ?? "recommandees";

  const [items, scores] = await Promise.all([
    getOpportunities(tenant.id, vue),
    prisma.score.findMany({ where: { tenantId: tenant.id } }),
  ]);
  const scoreByMarket = new Map(scores.map((s) => [s.marketId, s.global]));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Opportunités</h1>
        <p className="text-sm text-ink-muted">Marchés filtrés et classés selon votre profil.</p>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-line pb-3">
        {(Object.keys(VIEW_LABEL) as OpportunityView[]).map((v) => (
          <Link
            key={v}
            href={`/opportunites?vue=${v}`}
            className={cn("rounded-full px-3 py-1.5 text-xs font-medium", v === vue ? "bg-brand text-white" : "bg-paper-sunken text-ink-muted hover:text-ink")}
          >
            {VIEW_LABEL[v]}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <StateNotice kind="empty" title="Aucune opportunité dans cette vue" description="Ajustez votre profil ou revenez plus tard : la veille est mise à jour en continu." />
      ) : (
        <div className="space-y-2">
          {items.map((m) => (
            <MarketRow key={m.id} market={m} score={scoreByMarket.get(m.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
