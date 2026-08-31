import { requireTenantContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { addTenantDocumentAction } from "@/app/(app)/compte/actions";
import { REQUIRED_DOC_LABEL, DOC_LIFECYCLE_LABEL, DOC_LIFECYCLE_TONE } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import { StateNotice } from "@/components/ui/StateNotice";

export default async function EntrepriseDocumentsPage() {
  const { tenant } = await requireTenantContext();
  const documents = await prisma.tenantDocument.findMany({ where: { tenantId: tenant.id }, orderBy: { createdAt: "desc" } });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Documents de l&apos;entreprise</h1>
        <p className="text-sm text-ink-muted">Bibliothèque de pièces utilisée pour vérifier votre éligibilité (section 10).</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Ajouter un document</CardTitle></CardHeader>
        <CardBody>
          <form action={addTenantDocumentAction} className="flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted">Type</label>
              <select name="docType" className="input w-48">
                {Object.entries(REQUIRED_DOC_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted">Libellé</label>
              <input name="label" className="input w-40" placeholder="Optionnel" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted">Date d&apos;expiration</label>
              <input name="expirationDate" type="date" className="input w-40" />
            </div>
            <button type="submit" className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white">Ajouter</button>
          </form>
        </CardBody>
      </Card>

      {documents.length === 0 ? <StateNotice kind="empty" title="Aucun document" /> : (
        <div className="space-y-2">
          {documents.map((d) => (
            <Card key={d.id}><CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">{REQUIRED_DOC_LABEL[d.docType]}{d.label ? ` — ${d.label}` : ""}</p>
                  <p className="text-xs text-ink-muted">
                    {d.expirationDate ? `Expire le ${formatDate(d.expirationDate)}` : "Sans date d'expiration"}
                    {d.confidence ? ` · confiance ${Math.round(d.confidence * 100)}%` : ""}
                  </p>
                </div>
                <Badge tone={DOC_LIFECYCLE_TONE[d.status]}>{DOC_LIFECYCLE_LABEL[d.status]}</Badge>
              </div>
            </CardBody></Card>
          ))}
        </div>
      )}
    </div>
  );
}
