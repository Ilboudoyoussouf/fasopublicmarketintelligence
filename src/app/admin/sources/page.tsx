import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { toggleSourceActiveAction } from "@/app/admin/actions";
import { formatDateTime } from "@/lib/utils";
import { IngestButton } from "@/components/domain/IngestButton";
import { ClearDemoDataButton } from "@/components/domain/ClearDemoDataButton";
import { UploadQuotidienForm } from "@/components/domain/UploadQuotidienForm";

export default async function AdminSourcesPage() {
  const sources = await prisma.source.findMany({ include: { _count: { select: { publications: true } } } });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-ink">Sources</h1>
      <Card>
        <CardBody className="space-y-2">
          <div>
            <p className="text-sm font-medium text-ink">Import manuel d&apos;un quotidien (PDF)</p>
            <p className="text-xs text-ink-muted">Dépose directement le PDF d&apos;un quotidien DGCMEF pour l&apos;extraire et alimenter la base, sans attendre le passage du robot ou en complément du site (ex. numéro déjà en main).</p>
          </div>
          <UploadQuotidienForm sources={sources.map((s) => ({ id: s.id, name: s.name }))} />
        </CardBody>
      </Card>
      <Card>
        <CardBody className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
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
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{s.name}</p>
                <p className="text-xs text-ink-muted break-words">{s.baseUrl} · {s._count.publications} publication(s) · dernier passage {formatDateTime(s.lastCrawledAt)}</p>
              </div>
              <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
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
