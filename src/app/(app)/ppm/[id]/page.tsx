import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StateNotice } from "@/components/ui/StateNotice";
import { formatFcfa } from "@/lib/utils";
import { FINANCING_SOURCE_LABEL } from "@/lib/labels";
import { ArrowRight } from "lucide-react";

const PPM_STATUS_LABEL: Record<string, string> = {
  PLANIFIE: "Planifié", AVIS_GENERAL_PUBLIE: "Avis général publié", AVIS_MARCHE_PUBLIE: "Avis de marché publié",
  EN_SOUMISSION: "En soumission", EN_EVALUATION: "En évaluation", RESULTAT: "Résultat", ATTRIBUE: "Attribué",
};

export default async function PpmPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = await prisma.ppmPlan.findUnique({
    where: { id },
    include: { contractingAuthority: true, items: { include: { sector: true, linkedMarket: true } } },
  });
  if (!plan) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Plan de passation — {plan.contractingAuthority.name}</h1>
        <p className="text-sm text-ink-muted">Exercice {plan.exercice}</p>
      </div>

      {plan.items.length === 0 ? <StateNotice kind="empty" title="Aucune ligne planifiée" /> : (
        <div className="space-y-2">
          {plan.items.map((item) => (
            <Card key={item.id}><CardBody>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">{item.object}</p>
                  <p className="text-xs text-ink-muted">
                    {item.sector?.name ?? "Secteur non précisé"} · {item.periodPlanned ?? "Période non précisée"}
                    {item.financingSource ? ` · ${FINANCING_SOURCE_LABEL[item.financingSource]}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <Badge tone="neutral">{PPM_STATUS_LABEL[item.status]}</Badge>
                  <p className="mt-1 text-sm font-semibold text-ink">{formatFcfa(item.budget?.toString())}</p>
                </div>
              </div>
              {item.linkedMarket && (
                <Link href={`/marches/${item.linkedMarket.id}`} className="mt-2 flex items-center gap-1 text-xs text-brand hover:underline">
                  Voir le marché publié <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </CardBody></Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Chronologie plan → marché</CardTitle></CardHeader>
        <CardBody>
          <ol className="flex flex-wrap gap-2 text-xs text-ink-muted">
            {["Planifié", "Avis général", "Avis de marché", "Soumission", "Évaluation", "Résultat", "Attribution"].map((step, i, arr) => (
              <li key={step} className="flex items-center gap-2">
                <Badge tone="neutral">{step}</Badge>
                {i < arr.length - 1 && <ArrowRight className="h-3 w-3" />}
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>
    </div>
  );
}
