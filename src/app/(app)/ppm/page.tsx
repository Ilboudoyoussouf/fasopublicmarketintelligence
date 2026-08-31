import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StateNotice } from "@/components/ui/StateNotice";
import { formatFcfa } from "@/lib/utils";

const PPM_STATUS_LABEL: Record<string, string> = {
  PLANIFIE: "Planifié", AVIS_GENERAL_PUBLIE: "Avis général publié", AVIS_MARCHE_PUBLIE: "Avis de marché publié",
  EN_SOUMISSION: "En soumission", EN_EVALUATION: "En évaluation", RESULTAT: "Résultat", ATTRIBUE: "Attribué",
};

export default async function PpmPage() {
  const plans = await prisma.ppmPlan.findMany({
    include: { contractingAuthority: true, items: true },
    orderBy: { exercice: "desc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Plans de passation des marchés</h1>
        <p className="text-sm text-ink-muted">Objet stratégique distinct du quotidien — cycle planifié → avis → soumission → résultat → attribution.</p>
      </div>

      {plans.length === 0 ? <StateNotice kind="empty" title="Aucun plan de passation publié" /> : (
        <div className="space-y-2">
          {plans.map((p) => {
            const total = p.items.reduce((s, i) => s + Number(i.budget ?? 0), 0);
            return (
              <Link key={p.id} href={`/ppm/${p.id}`}>
                <Card><CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-ink">{p.contractingAuthority.name}</p>
                      <p className="text-xs text-ink-muted">Exercice {p.exercice} · {p.items.length} ligne(s) planifiée(s)</p>
                    </div>
                    <div className="text-right">
                      <Badge tone="neutral">{PPM_STATUS_LABEL[p.status]}</Badge>
                      <p className="mt-1 text-sm font-semibold text-ink">{formatFcfa(total)}</p>
                    </div>
                  </div>
                </CardBody></Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
