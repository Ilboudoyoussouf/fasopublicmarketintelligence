import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { StateNotice } from "@/components/ui/StateNotice";
import { SourceTag } from "@/components/ui/SourceTag";
import { formatDate } from "@/lib/utils";

export default async function AvisGenerauxPage() {
  const notices = await prisma.generalNotice.findMany({
    include: { contractingAuthority: true, publication: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Avis généraux de passation</h1>
        <p className="text-sm text-ink-muted">Publications annuelles annonçant le programme prévisionnel des organismes.</p>
      </div>

      {notices.length === 0 ? <StateNotice kind="empty" title="Aucun avis général publié" /> : (
        <div className="space-y-2">
          {notices.map((n) => (
            <Card key={n.id}><CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">{n.contractingAuthority.name}</p>
                  <p className="text-xs text-ink-muted">Exercice {n.exercice} · publié le {formatDate(n.publishedAt)}</p>
                </div>
                <SourceTag numero={n.publication.numero} publishedAt={n.publishedAt} />
              </div>
            </CardBody></Card>
          ))}
        </div>
      )}
    </div>
  );
}
