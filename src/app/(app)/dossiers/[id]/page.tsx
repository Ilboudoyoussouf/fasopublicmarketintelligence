import { notFound } from "next/navigation";
import { requireTenantContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { toggleChecklistItemAction, updateFolderNotesAction } from "@/app/(app)/dossiers/actions";
import { REQUIRED_DOC_LABEL, DOC_LIFECYCLE_LABEL, DOC_LIFECYCLE_TONE } from "@/lib/labels";
import { Check } from "lucide-react";
import Link from "next/link";

export default async function DossierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenant } = await requireTenantContext();
  const folder = await prisma.submissionFolder.findFirst({ where: { id, tenantId: tenant.id }, include: { checklist: true } });
  if (!folder) notFound();

  const [market, requiredDocs, tenantDocs] = await Promise.all([
    prisma.market.findUnique({ where: { id: folder.marketId }, include: { contractingAuthority: true } }),
    prisma.marketRequiredDocument.findMany({ where: { marketId: folder.marketId } }),
    prisma.tenantDocument.findMany({ where: { tenantId: tenant.id } }),
  ]);
  const tenantDocByType = new Map(tenantDocs.map((d) => [d.docType, d]));

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        {market && <Link href={`/marches/${market.id}`} className="text-xs text-brand hover:underline">← {market.title}</Link>}
        <h1 className="mt-1 text-lg font-semibold text-ink">Dossier de soumission</h1>
        {market && <p className="text-sm text-ink-muted">{market.contractingAuthority.name}</p>}
      </div>

      <Card>
        <CardHeader><CardTitle>Checklist</CardTitle></CardHeader>
        <CardBody className="space-y-1.5">
          {folder.checklist.map((item) => (
            <form key={item.id} action={toggleChecklistItemAction.bind(null, item.id, folder.id)}>
              <button type="submit" className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface-elevated">
                <span className={`flex h-4 w-4 items-center justify-center rounded border ${item.done ? "border-success bg-success text-white" : "border-line-strong"}`}>
                  {item.done && <Check className="h-3 w-3" />}
                </span>
                <span className={item.done ? "text-ink-faint line-through" : "text-ink"}>{item.label}</span>
              </button>
            </form>
          ))}
          <p className="pt-1 text-xs text-ink-faint">{folder.checklist.filter((c) => c.done).length}/{folder.checklist.length} tâches complétées</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Documents requis</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          {requiredDocs.length === 0 ? (
            <p className="text-xs text-ink-faint">Liste des pièces non encore extraite pour ce marché.</p>
          ) : (
            requiredDocs.map((d) => {
              const owned = tenantDocByType.get(d.docType);
              const status = owned?.status ?? "MISSING";
              return (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink">{REQUIRED_DOC_LABEL[d.docType]}{!d.mandatory ? " (optionnel)" : ""}</span>
                  <Badge tone={DOC_LIFECYCLE_TONE[status]}>{DOC_LIFECYCLE_LABEL[status]}</Badge>
                </div>
              );
            })
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
        <CardBody>
          <form action={updateFolderNotesAction.bind(null, folder.id)} className="space-y-2">
            <textarea name="notes" defaultValue={folder.notes ?? ""} rows={4} className="input" placeholder="Notes internes sur ce dossier…" />
            <button type="submit" className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white">Enregistrer</button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
