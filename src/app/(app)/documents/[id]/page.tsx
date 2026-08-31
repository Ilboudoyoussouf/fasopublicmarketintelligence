import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StateNotice } from "@/components/ui/StateNotice";
import { formatDateTime } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await prisma.document.findUnique({
    where: { id },
    include: { publication: true, pages: true, extractionJobs: { orderBy: { createdAt: "asc" } } },
  });
  if (!document) notFound();

  const notices = await prisma.notice.findMany({ where: { documentId: id }, include: { market: true } });
  const events = await prisma.marketEvent.findMany({ where: { sourceDocumentId: id }, include: { market: true } });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">{document.filename}</h1>
        <p className="text-sm text-ink-muted">Quotidien n°{document.publication.numero} · {formatDateTime(document.publication.publishedAt)}</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Métadonnées</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Row label="Taille" value={document.sizeBytes ? `${Math.round(document.sizeBytes / 1024)} Ko` : "—"} />
          <Row label="Hash" value={document.fileHash ?? "—"} />
          <Row label="Statut d'extraction" value={document.extractionStatus} />
          <Row label="Fichier principal" value={document.isPrincipal ? "Oui" : "Non (bis)"} />
          <Row label="Téléchargé le" value={formatDateTime(document.downloadedAt)} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Consulter la source</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          <StateNotice kind="not-available" title="Aperçu PDF non disponible dans cet environnement de démonstration" description="Le texte extrait ci-dessous provient du pipeline d'ingestion. Le fichier original reste accessible via le lien source." />
          <a href={document.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-brand hover:underline">
            Ouvrir le document source <ExternalLink className="h-3 w-3" />
          </a>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Texte extrait</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          {document.pages.length === 0 ? <StateNotice kind="empty" title="Aucun texte extrait" /> : document.pages.map((p) => (
            <div key={p.id} className="rounded-md bg-paper-sunken p-2.5 text-xs text-ink-muted">
              <p className="mb-1 font-medium text-ink">Page {p.pageNumber} {p.ocrConfidence ? `· confiance OCR ${Math.round(p.ocrConfidence * 100)}%` : ""}</p>
              {p.rawText}
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Événements détectés</CardTitle></CardHeader>
        <CardBody className="space-y-1.5">
          {notices.length === 0 && events.length === 0 ? <StateNotice kind="empty" title="Aucun événement détecté" /> : (
            <>
              {notices.map((n) => (
                <Link key={n.id} href={`/marches/${n.marketId}`} className="block text-sm text-ink hover:text-brand">{n.market.title}</Link>
              ))}
              {events.map((e) => (
                <Link key={e.id} href={`/marches/${e.marketId}`} className="flex items-center gap-2 text-sm text-ink hover:text-brand">
                  <Badge tone="neutral">{e.type}</Badge> {e.market.title}
                </Link>
              ))}
            </>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pipeline d&apos;extraction</CardTitle></CardHeader>
        <CardBody className="flex flex-wrap gap-1.5">
          {document.extractionJobs.map((j) => (
            <Badge key={j.id} tone={j.status === "SUCCEEDED" ? "success" : j.status === "FAILED" ? "critical" : "neutral"}>{j.stage} — {j.status}</Badge>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-ink-faint">{label}</dt>
      <dd className="truncate font-medium text-ink" title={value}>{value}</dd>
    </div>
  );
}
