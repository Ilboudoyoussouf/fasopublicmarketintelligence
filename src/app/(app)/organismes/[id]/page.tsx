import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ChartCard } from "@/components/charts/ChartCard";
import { SimpleBarChart, SimpleLineChart } from "@/components/charts/Charts";
import { MarketRow } from "@/components/domain/MarketRow";
import { StateNotice } from "@/components/ui/StateNotice";
import { ORG_TYPE_LABEL, PROCEDURE_TYPE_LABEL } from "@/lib/labels";
import { formatFcfa, formatDate } from "@/lib/utils";

export default async function OrganismeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authority = await prisma.contractingAuthority.findUnique({ where: { id } });
  if (!authority) notFound();

  const markets = await prisma.market.findMany({
    where: { contractingAuthorityId: id },
    include: { contractingAuthority: true, sector: true, region: true },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  const totalValue = markets.reduce((s, m) => s + Number(m.amountEstimatedExclTax ?? 0), 0);

  const bySector = new Map<string, number>();
  const byMonth = new Map<string, number>();
  const byProcedure = new Map<string, number>();
  for (const m of markets) {
    if (m.sector) bySector.set(m.sector.name, (bySector.get(m.sector.name) ?? 0) + 1);
    byProcedure.set(PROCEDURE_TYPE_LABEL[m.procedureType], (byProcedure.get(PROCEDURE_TYPE_LABEL[m.procedureType]) ?? 0) + 1);
    if (m.publishedAt) {
      const key = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(m.publishedAt);
      byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
    }
  }

  const results = await prisma.result.findMany({ where: { market: { contractingAuthorityId: id } }, include: { winnerCompany: true }, orderBy: { resultAt: "desc" }, take: 10 });

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <Badge tone="neutral">{ORG_TYPE_LABEL[authority.type]}</Badge>
        <h1 className="mt-1 text-lg font-semibold text-ink">{authority.name}</h1>
        <p className="text-sm text-ink-muted">{authority.regionName ?? "Zone non renseignée"} · {markets.length} marché(s) récents · {formatFcfa(totalValue)}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ChartCard title="Répartition par secteur" period="marchés récents" source="DGCMEF" height={220}>
          {bySector.size > 0 ? <SimpleBarChart data={[...bySector.entries()].map(([name, count]) => ({ name, count }))} xKey="name" yKey="count" /> : <StateNotice kind="empty" title="Aucune donnée" />}
        </ChartCard>
        <ChartCard title="Activité mensuelle" period="marchés récents" source="DGCMEF" height={220}>
          {byMonth.size > 0 ? <SimpleLineChart data={[...byMonth.entries()].map(([mois, marches]) => ({ mois, marches }))} xKey="mois" series={["marches"]} /> : <StateNotice kind="empty" title="Aucune donnée" />}
        </ChartCard>
      </div>

      <Card>
        <CardHeader><CardTitle>Procédures utilisées</CardTitle></CardHeader>
        <CardBody className="flex flex-wrap gap-1.5">
          {[...byProcedure.entries()].map(([label, count]) => <Badge key={label} tone="neutral">{label} ({count})</Badge>)}
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Historique d&apos;achat récent</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          {markets.length === 0 ? <StateNotice kind="empty" title="Aucun marché" /> : markets.map((m) => <MarketRow key={m.id} market={m} />)}
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Fournisseurs récents</CardTitle></CardHeader>
        <CardBody className="space-y-1.5">
          {results.length === 0 ? <StateNotice kind="empty" title="Aucun résultat" /> : results.map((r) => (
            <div key={r.id} className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">{r.winnerCompany?.canonicalName ?? "—"}</span>
              <span className="text-ink-faint">{formatDate(r.resultAt)}</span>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
