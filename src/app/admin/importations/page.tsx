import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export default async function AdminImportationsPage() {
  const publications = await prisma.publication.findMany({
    include: { documents: true },
    orderBy: { publishedAt: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Importations</h1>
        <p className="text-sm text-ink-muted">Publications reçues et leur statut d&apos;extraction.</p>
      </div>
      <div className="space-y-2">
        {publications.map((p) => {
          const failed = p.documents.some((d) => d.extractionStatus === "FAILED");
          const validated = p.documents.every((d) => d.extractionStatus === "VALIDATED");
          return (
            <Card key={p.id}><CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">Quotidien n°{p.numero}</p>
                  <p className="text-xs text-ink-muted">{formatDate(p.publishedAt)} · {p.documents.length} fichier(s){p.isDoubleIssue ? " · numéro double" : ""}</p>
                </div>
                <Badge tone={failed ? "critical" : validated ? "success" : "neutral"}>{failed ? "Échec" : validated ? "Validé" : "En cours"}</Badge>
              </div>
            </CardBody></Card>
          );
        })}
      </div>
    </div>
  );
}
