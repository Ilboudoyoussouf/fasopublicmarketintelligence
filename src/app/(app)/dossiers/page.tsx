import { requireTenantContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { StateNotice } from "@/components/ui/StateNotice";
import { formatDate } from "@/lib/utils";

export default async function DossiersPage() {
  const { tenant } = await requireTenantContext();
  const folders = await prisma.submissionFolder.findMany({
    where: { tenantId: tenant.id },
    include: { checklist: true },
    orderBy: { updatedAt: "desc" },
  });

  const marketIds = folders.map((f) => f.marketId);
  const markets = await prisma.market.findMany({ where: { id: { in: marketIds } } });
  const marketById = new Map(markets.map((m) => [m.id, m]));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Mes dossiers de soumission</h1>
        <p className="text-sm text-ink-muted">Créés depuis « Ajouter au dossier » sur une fiche marché.</p>
      </div>

      {folders.length === 0 ? (
        <StateNotice kind="empty" title="Aucun dossier" description="Ouvrez une fiche marché et cliquez sur « Ajouter au dossier »." />
      ) : (
        <div className="space-y-2">
          {folders.map((f) => {
            const market = marketById.get(f.marketId);
            const done = f.checklist.filter((c) => c.done).length;
            return (
              <Link key={f.id} href={`/dossiers/${f.id}`}>
                <Card><CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-ink">{market?.title ?? "Marché"}</p>
                      <p className="text-xs text-ink-muted">Mis à jour le {formatDate(f.updatedAt)} · {f.status}</p>
                    </div>
                    <p className="text-sm font-semibold text-ink">{done}/{f.checklist.length} tâches</p>
                  </div>
                </CardBody></Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
