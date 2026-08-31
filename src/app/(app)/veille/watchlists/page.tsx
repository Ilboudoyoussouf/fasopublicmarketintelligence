import { requireTenantContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StateNotice } from "@/components/ui/StateNotice";
import { createWatchlistAction, deleteWatchlistAction } from "@/app/(app)/veille/actions";
import { Trash2 } from "lucide-react";

const TYPE_LABEL: Record<string, string> = {
  MARKET: "Marché", ORGANIZATION: "Organisme", COMPANY: "Entreprise", SECTOR: "Secteur", PROJECT: "Projet", REGION: "Région", KEYWORD: "Mot-clé",
};

export default async function WatchlistsPage() {
  const { tenant } = await requireTenantContext();
  const watchlists = await prisma.watchlist.findMany({
    where: { tenantId: tenant.id },
    include: { targets: { include: { market: true, company: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Mes watchlists</h1>
        <p className="text-sm text-ink-muted">Suivez un secteur, un organisme, une entreprise, une région ou un mot-clé.</p>
      </div>

      <Card>
        <CardBody>
          <form action={createWatchlistAction} className="flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted">Type</label>
              <select name="type" className="input w-40">
                {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-ink-muted">Mot-clé / nom</label>
              <input name="keyword" required placeholder="Ex. Informatique, Ministère X…" className="input" />
            </div>
            <Button type="submit" variant="primary">Ajouter</Button>
          </form>
        </CardBody>
      </Card>

      {watchlists.length === 0 ? <StateNotice kind="empty" title="Aucune watchlist" /> : (
        <div className="space-y-2">
          {watchlists.map((w) => (
            <Card key={w.id}><CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <Badge tone="neutral">{TYPE_LABEL[w.type]}</Badge>
                  <p className="mt-1 text-sm font-medium text-ink">{w.keyword ?? `${w.targets.length} élément(s) suivi(s)`}</p>
                </div>
                <form action={deleteWatchlistAction.bind(null, w.id)}>
                  <Button type="submit" variant="ghost" size="sm"><Trash2 className="h-3.5 w-3.5 text-critical" /></Button>
                </form>
              </div>
            </CardBody></Card>
          ))}
        </div>
      )}
    </div>
  );
}
