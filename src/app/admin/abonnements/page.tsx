import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatFcfa, formatDate } from "@/lib/utils";
import { PLAN_LABEL } from "@/lib/plans";

export default async function AdminAbonnementsPage() {
  const subscriptions = await prisma.subscription.findMany({ include: { tenant: true, payments: true }, orderBy: { createdAt: "desc" } });
  const totalRevenue = subscriptions.flatMap((s) => s.payments).filter((p) => p.status === "SUCCEEDED").reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Abonnements &amp; paiements</h1>
        <p className="text-sm text-ink-muted">Revenu cumulé : {formatFcfa(totalRevenue)}</p>
      </div>
      <div className="space-y-2">
        {subscriptions.map((s) => (
          <Card key={s.id}><CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">{s.tenant.name}</p>
                <p className="text-xs text-ink-muted">{s.payments.length} paiement(s) · renouvellement {formatDate(s.currentPeriodEnd)}</p>
              </div>
              <Badge tone={s.status === "ACTIVE" ? "success" : s.status === "SUSPENDED" ? "critical" : "warning"}>{PLAN_LABEL[s.plan]} — {s.status}</Badge>
            </div>
          </CardBody></Card>
        ))}
      </div>
    </div>
  );
}
