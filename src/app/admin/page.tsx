import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function AdminDashboardPage() {
  const [users, tenants, activeSubscriptions, markets, documents, jobsFailed, jobsPending, qualityIssues, auditRecent] = await Promise.all([
    prisma.user.count(),
    prisma.tenant.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.market.count(),
    prisma.document.count(),
    prisma.extractionJob.count({ where: { status: "FAILED" } }),
    prisma.extractionJob.count({ where: { status: { in: ["PENDING", "RUNNING"] } } }),
    prisma.dataQualityCheck.count({ where: { status: { in: ["INCERTAIN", "REJETE"] } } }),
    prisma.auditLog.findMany({ orderBy: { occurredAt: "desc" }, take: 6 }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink">Dashboard admin</h1>
        <p className="text-sm text-ink-muted">Vue d&apos;ensemble de la plateforme.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Utilisateurs" value={String(users)} source="Comptes" />
        <StatCard label="Entreprises abonnées" value={String(tenants)} source="Tenants" />
        <StatCard label="Abonnements actifs" value={String(activeSubscriptions)} source="Facturation" />
        <StatCard label="Marchés en base" value={String(markets)} source="DGCMEF" />
        <StatCard label="Documents ingérés" value={String(documents)} source="Pipeline" />
        <StatCard label="Jobs en échec" value={String(jobsFailed)} source="Extraction" />
        <StatCard label="Jobs en attente" value={String(jobsPending)} source="Extraction" />
        <StatCard label="Données à valider" value={String(qualityIssues)} source="Qualité des données" />
      </div>

      <Card>
        <CardHeader><CardTitle>Activité récente (audit)</CardTitle></CardHeader>
        <CardBody className="space-y-1.5">
          {auditRecent.map((a) => (
            <div key={a.id} className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-2">
              <span className="min-w-0 truncate text-ink-muted">{a.action} — {a.entityType}</span>
              <Badge tone="neutral" className="shrink-0 self-start sm:self-auto">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(a.occurredAt)}</Badge>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
