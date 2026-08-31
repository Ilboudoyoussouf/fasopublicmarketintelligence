import { requireTenantContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StateNotice } from "@/components/ui/StateNotice";
import { AlertPriorityBadge, ALERT_TYPE_LABEL } from "@/components/domain/AlertBadge";
import { markAlertReadAction, markAllAlertsReadAction } from "@/app/(app)/veille/actions";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";

export default async function AlertesPage() {
  const { tenant } = await requireTenantContext();
  const alerts = await prisma.alert.findMany({ where: { tenantId: tenant.id }, orderBy: { createdAt: "desc" }, take: 50 });
  const unread = alerts.filter((a) => !a.readAt).length;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Centre d&apos;alertes</h1>
          <p className="text-sm text-ink-muted">{unread} non lue(s) sur {alerts.length}</p>
        </div>
        {unread > 0 && (
          <form action={markAllAlertsReadAction}>
            <Button type="submit" variant="secondary" size="sm">Tout marquer comme lu</Button>
          </form>
        )}
      </div>

      {alerts.length === 0 ? <StateNotice kind="empty" title="Aucune alerte" /> : (
        <div className="space-y-2">
          {alerts.map((a) => (
            <Card key={a.id} className={a.readAt ? "" : "border-brand"}>
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-1 flex items-center gap-1.5">
                      <AlertPriorityBadge priority={a.priority} />
                      <span className="text-[11px] text-ink-faint">{ALERT_TYPE_LABEL[a.type]}</span>
                    </div>
                    <p className="text-sm font-medium text-ink">{a.title}</p>
                    {a.body && <p className="text-xs text-ink-muted">{a.body}</p>}
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-ink-faint">
                      <span>{timeAgo(a.createdAt)}</span>
                      {a.relatedMarketId && <Link href={`/marches/${a.relatedMarketId}`} className="text-brand hover:underline">Voir le marché</Link>}
                    </div>
                  </div>
                  {!a.readAt && (
                    <form action={markAlertReadAction.bind(null, a.id)}>
                      <Button type="submit" variant="ghost" size="sm">Marquer lu</Button>
                    </form>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
