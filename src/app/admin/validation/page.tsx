import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StateNotice } from "@/components/ui/StateNotice";
import { validateDataQualityAction } from "@/app/admin/actions";

export default async function AdminValidationPage() {
  const checks = await prisma.dataQualityCheck.findMany({
    where: { status: { in: ["EXTRAIT_AUTOMATIQUEMENT", "INCERTAIN"] } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Validation humaine</h1>
        <p className="text-sm text-ink-muted">Donnée extraite → Vérifier → Corriger → Valider. Priorité aux données sensibles (montant, référence, date, entreprise, IFU, résultat, attribution, motifs de rejet).</p>
      </div>

      {checks.length === 0 ? <StateNotice kind="empty" title="Aucune donnée en attente de validation" /> : (
        <div className="space-y-2">
          {checks.map((c) => (
            <Card key={c.id}><CardBody>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">{c.entityType} — {c.field}</p>
                  <p className="text-xs text-ink-muted">Méthode : {c.extractionMethod ?? "—"} · confiance {c.confidence ? Math.round(c.confidence * 100) : "?"}%</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={c.status === "INCERTAIN" ? "warning" : "neutral"}>{c.status}</Badge>
                  <form action={validateDataQualityAction.bind(null, c.id, "VALIDE")}>
                    <button type="submit" className="rounded-md bg-success px-2.5 py-1 text-xs font-medium text-white">Valider</button>
                  </form>
                  <form action={validateDataQualityAction.bind(null, c.id, "REJETE")}>
                    <button type="submit" className="rounded-md border border-critical px-2.5 py-1 text-xs font-medium text-critical">Rejeter</button>
                  </form>
                </div>
              </div>
            </CardBody></Card>
          ))}
        </div>
      )}
    </div>
  );
}
