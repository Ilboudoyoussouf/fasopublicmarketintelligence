import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StateNotice } from "@/components/ui/StateNotice";
import { FilterBar } from "@/components/domain/FilterBar";
import { formatDate } from "@/lib/utils";
import { FileText } from "lucide-react";

const EXTRACTION_LABEL: Record<string, string> = {
  PENDING: "En attente", DOWNLOADED: "Téléchargé", OCR_DONE: "OCR effectué", PARSED: "Analysé",
  CLASSIFIED: "Classifié", EXTRACTED: "Extrait", VALIDATED: "Validé", FAILED: "Échec",
};

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const sp = await searchParams;

  const documents = await prisma.document.findMany({
    where: {
      ...(sp.q ? { OR: [{ filename: { contains: sp.q } }, { publication: { numero: { contains: sp.q } } }] } : {}),
      ...(sp.type ? { publication: { kind: sp.type as never } } : {}),
    },
    include: { publication: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Bibliothèque des quotidiens</h1>
        <p className="text-sm text-ink-muted">Documents sources DGCMEF, avec numéro, date, taille et statut d&apos;extraction.</p>
      </div>

      <Suspense>
        <FilterBar fields={[
          { type: "search", name: "q", placeholder: "Rechercher un numéro ou un fichier…" },
          { type: "select", name: "type", label: "Tous types", options: [
            { value: "QUOTIDIEN_MARCHES", label: "Quotidien des marchés" },
            { value: "AVIS_GENERAL", label: "Avis général" },
            { value: "PPM", label: "PPM" },
            { value: "DOCUMENT_REGLEMENTAIRE", label: "Document réglementaire" },
          ] },
        ]} />
      </Suspense>

      {documents.length === 0 ? <StateNotice kind="empty" title="Aucun document" /> : (
        <div className="space-y-2">
          {documents.map((d) => (
            <Link key={d.id} href={`/documents/${d.id}`} className="flex items-center justify-between rounded-lg border border-line bg-paper p-3.5 hover:border-brand">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-ink-faint" />
                <div>
                  <p className="text-sm font-medium text-ink">{d.filename}{d.isBis ? " (bis)" : ""}</p>
                  <p className="text-xs text-ink-muted">Quotidien n°{d.publication.numero} · {formatDate(d.publication.publishedAt)}</p>
                </div>
              </div>
              <Badge tone={d.extractionStatus === "VALIDATED" ? "success" : d.extractionStatus === "FAILED" ? "critical" : "neutral"}>
                {EXTRACTION_LABEL[d.extractionStatus]}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
