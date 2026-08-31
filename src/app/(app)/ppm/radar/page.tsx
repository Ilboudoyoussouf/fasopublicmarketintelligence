import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StateNotice } from "@/components/ui/StateNotice";
import { formatFcfa } from "@/lib/utils";
import { FINANCING_SOURCE_LABEL, PROCEDURE_TYPE_LABEL } from "@/lib/labels";
import { Radar } from "lucide-react";

export default async function RadarPage() {
  const items = await prisma.ppmItem.findMany({
    where: { status: "PLANIFIE" },
    include: { plan: { include: { contractingAuthority: true } }, sector: true, project: true },
    orderBy: { budget: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Radar className="h-5 w-5 text-brand" />
        <div>
          <h1 className="text-lg font-semibold text-ink">Radar des marchés à venir</h1>
          <p className="text-sm text-ink-muted">Opportunités planifiées non encore publiées — anticipez votre préparation.</p>
        </div>
      </div>

      {items.length === 0 ? <StateNotice kind="empty" title="Aucun marché planifié détecté" /> : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id}><CardBody>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">{item.object}</p>
                  <p className="text-xs text-ink-muted">
                    {item.plan.contractingAuthority.name} · {item.sector?.name ?? "Secteur non précisé"}
                    {item.procedureType ? ` · ${PROCEDURE_TYPE_LABEL[item.procedureType]}` : ""}
                  </p>
                  <p className="text-xs text-ink-faint">
                    Période prévue : {item.periodPlanned ?? "—"}
                    {item.financingSource ? ` · ${FINANCING_SOURCE_LABEL[item.financingSource]}` : ""}
                    {item.project ? ` · Projet : ${item.project.name}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <Badge tone="brand">Planifié</Badge>
                  <p className="mt-1 text-sm font-semibold text-ink">{formatFcfa(item.budget?.toString())}</p>
                </div>
              </div>
            </CardBody></Card>
          ))}
        </div>
      )}
    </div>
  );
}
