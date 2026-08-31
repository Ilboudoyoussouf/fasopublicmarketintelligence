import { requireTenantContext } from "@/lib/session";
import { getOpportunities } from "@/lib/queries/opportunities";
import { MarketRow } from "@/components/domain/MarketRow";
import { StateNotice } from "@/components/ui/StateNotice";

export default async function FavorisPage() {
  const { tenant } = await requireTenantContext();
  const items = await getOpportunities(tenant.id, "suivies");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Mes favoris</h1>
        <p className="text-sm text-ink-muted">Marchés suivis depuis leur fiche.</p>
      </div>
      {items.length === 0 ? <StateNotice kind="empty" title="Aucun favori" description="Cliquez sur « Suivre » depuis une fiche marché." /> : (
        <div className="space-y-2">{items.map((m) => <MarketRow key={m.id} market={m} />)}</div>
      )}
    </div>
  );
}
