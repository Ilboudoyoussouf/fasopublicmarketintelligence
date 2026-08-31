import { requireTenantContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { AccountTabs } from "@/components/domain/AccountTabs";
import { Badge } from "@/components/ui/Badge";
import { StateNotice } from "@/components/ui/StateNotice";
import { formatFcfa, formatDate } from "@/lib/utils";

export default async function FacturationPage() {
  const { tenant } = await requireTenantContext();
  const payments = tenant.subscription
    ? await prisma.payment.findMany({ where: { subscriptionId: tenant.subscription.id }, orderBy: { createdAt: "desc" } })
    : [];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <AccountTabs />
      <Card>
        <CardHeader><CardTitle>Historique de facturation</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          {payments.length === 0 ? <StateNotice kind="empty" title="Aucun paiement enregistré" /> : (
            payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-md border border-line p-2.5 text-sm">
                <div>
                  <p className="text-ink">{formatFcfa(p.amount.toString())} — {p.provider}</p>
                  <p className="text-xs text-ink-faint">{formatDate(p.paidAt ?? p.createdAt)} · réf. {p.externalRef}</p>
                </div>
                <Badge tone={p.status === "SUCCEEDED" ? "success" : p.status === "FAILED" ? "critical" : "warning"}>{p.status}</Badge>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
