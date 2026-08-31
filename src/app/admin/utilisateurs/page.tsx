import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { togglePlatformAdminAction } from "@/app/admin/actions";
import { formatDate } from "@/lib/utils";

export default async function AdminUtilisateursPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, include: { memberships: { include: { tenant: true } } } });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-ink">Utilisateurs ({users.length})</h1>
      <div className="space-y-2">
        {users.map((u) => (
          <Card key={u.id}><CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">{u.fullName} — {u.email}</p>
                <p className="text-xs text-ink-muted">
                  {u.memberships.map((m) => m.tenant.name).join(", ") || "Sans organisation"} · inscrit le {formatDate(u.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {u.isPlatformAdmin && <Badge tone="brand">Admin plateforme</Badge>}
                <form action={togglePlatformAdminAction.bind(null, u.id)}>
                  <button type="submit" className="text-xs text-brand hover:underline">{u.isPlatformAdmin ? "Retirer" : "Promouvoir"}</button>
                </form>
              </div>
            </div>
          </CardBody></Card>
        ))}
      </div>
    </div>
  );
}
