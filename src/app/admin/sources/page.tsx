import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { toggleSourceActiveAction } from "@/app/admin/actions";
import { formatDateTime } from "@/lib/utils";
import { IngestButton } from "@/components/domain/IngestButton";
import { ClearDemoDataButton } from "@/components/domain/ClearDemoDataButton";

export default async function AdminSourcesPage() {
  const sources = await prisma.source.findMany({ include: { _count: { select: { publications: true } } } });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-ink">Sources</h1>
      <Card>
        <CardBody className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-ink">Données de démonstration</p>
            <p className="text-xs text-ink-muted">Retire les marchés fictifs du jeu de données initial (Annexe D) sans toucher aux marchés réellement ingérés depuis DGCMEF.</p>
          </div>
          <ClearDemoDataButton />
        </CardBody>
      </Card>
      <div className="space-y-2">
        {sources.map((s) => (
          <Card key={s.id}><CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">{s.name}</p>
                <p className="text-xs text-ink-muted">{s.baseUrl} · {s._count.publications} publication(s) · dernier passage {formatDateTime(s.lastCrawledAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={s.isActive ? "success" : "neutral"}>{s.isActive ? "Actif" : "Inactif"}</Badge>
                <form action={toggleSourceActiveAction.bind(null, s.id)}>
                  <button type="submit" className="text-xs text-brand hover:underline">{s.isActive ? "Désactiver" : "Activer"}</button>
                </form>
                <IngestButton sourceId={s.id} />
              </div>
            </div>
          </CardBody></Card>
        ))}
      </div>
    </div>
  );
}
