import { requireTenantContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { AccountTabs } from "@/components/domain/AccountTabs";
import { Badge } from "@/components/ui/Badge";
import { StateNotice } from "@/components/ui/StateNotice";
import { formatDateTime } from "@/lib/utils";

export default async function JournalConnexionsPage() {
  const { session } = await requireTenantContext();
  const events = await prisma.loginEvent.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 30 });

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <AccountTabs />
      <Card>
        <CardHeader><CardTitle>Journal des connexions</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          {events.length === 0 ? <StateNotice kind="empty" title="Aucune connexion enregistrée" /> : (
            events.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm">
                <span className="text-ink-muted">{formatDateTime(e.createdAt)}</span>
                <Badge tone={e.success ? "success" : "critical"}>{e.success ? "Connexion réussie" : "Échec"}</Badge>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
