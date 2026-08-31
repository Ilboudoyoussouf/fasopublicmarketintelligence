import { prisma } from "@/lib/prisma";
import { ChartCard } from "@/components/charts/ChartCard";
import { SimpleDonutChart } from "@/components/charts/Charts";
import { StateNotice } from "@/components/ui/StateNotice";
import { formatDate } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  EXTRAIT_AUTOMATIQUEMENT: "Extrait automatiquement", VALIDE: "Validé", CORRIGE: "Corrigé", INCERTAIN: "Incertain", REJETE: "Rejeté",
};

export default async function AdminQualitePage() {
  const counts = await prisma.dataQualityCheck.groupBy({ by: ["status"], _count: { _all: true } });
  const data = counts.map((c) => ({ name: STATUS_LABEL[c.status], value: c._count._all }));
  const recent = await prisma.dataQualityCheck.findMany({ orderBy: { createdAt: "desc" }, take: 15 });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-ink">Qualité des données</h1>

      <ChartCard title="Répartition des statuts de validation" period="cumul" source="Pipeline d'extraction" updatedAt={formatDate(new Date())}>
        {data.length > 0 ? <SimpleDonutChart data={data} nameKey="name" valueKey="value" /> : <StateNotice kind="empty" title="Aucune donnée" />}
      </ChartCard>

      <div className="space-y-1.5">
        {recent.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-md border border-line bg-paper px-3 py-2 text-sm">
            <span className="text-ink-muted">{c.entityType} · {c.field}</span>
            <span className="text-ink-faint">{STATUS_LABEL[c.status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
