import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PLAN_LABEL } from "@/lib/plans";

export default async function AdminEntreprisesPage() {
  const tenants = await prisma.tenant.findMany({
    include: { subscription: true, members: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-ink">Entreprises abonnées ({tenants.length})</h1>
      <div className="space-y-2">
        {tenants.map((t) => (
          <Card key={t.id}><CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">{t.name}</p>
                <p className="text-xs text-ink-muted">{t.members.length} membre(s) · {t.regionName ?? "—"}</p>
              </div>
              <Badge tone={t.subscription?.status === "ACTIVE" ? "success" : "neutral"}>{PLAN_LABEL[t.subscription?.plan ?? "FREE"]}</Badge>
            </div>
          </CardBody></Card>
        ))}
      </div>
    </div>
  );
}
