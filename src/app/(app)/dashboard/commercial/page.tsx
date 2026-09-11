import Link from "next/link";
import { requireTenantContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ChartCard } from "@/components/charts/ChartCard";
import { SimpleBarChart } from "@/components/charts/Charts";
import { StateNotice } from "@/components/ui/StateNotice";
import { formatFcfa, formatDate, daysUntil } from "@/lib/utils";
import { MATCH_VERDICT_LABEL, MATCH_VERDICT_TONE } from "@/lib/labels";
import type { MatchVerdict } from "@prisma/client";

const VERDICT_ORDER: MatchVerdict[] = ["COMPATIBLE", "PROBABLEMENT_COMPATIBLE", "A_VERIFIER", "INCOMPATIBLE"];

export default async function DashboardCommercialPage() {
  const { tenant } = await requireTenantContext();
  const today = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date());

  // Score.market et SubmissionFolder.market sont des relations obligatoires côté schéma,
  // mais l'absence de cascade de suppression peut laisser des lignes orphelines (marketId
  // pointant vers un marché déjà supprimé) — on résout donc les marchés séparément plutôt
  // que via `include`, qui lèverait une erreur Prisma sur la moindre ligne orpheline.
  const [folders, verdictGroups, matchedScores] = await Promise.all([
    prisma.submissionFolder.findMany({ where: { tenantId: tenant.id }, include: { checklist: true }, orderBy: { updatedAt: "desc" } }),
    prisma.matchResult.groupBy({ by: ["verdict"], where: { tenantId: tenant.id }, _count: { _all: true } }),
    prisma.score.findMany({ where: { tenantId: tenant.id, global: { gte: 50 } } }),
  ]);

  const relevantMarketIds = [...new Set([...folders.map((f) => f.marketId), ...matchedScores.map((s) => s.marketId)])];
  const markets = await prisma.market.findMany({
    where: { id: { in: relevantMarketIds } },
    include: { sector: true, contractingAuthority: true },
  });
  const marketById = new Map(markets.map((m) => [m.id, m]));

  const pipelineValue = folders.reduce((sum, f) => sum + Number(marketById.get(f.marketId)?.amountEstimatedExclTax ?? 0), 0);
  const opportunityValue = matchedScores.reduce((sum, s) => sum + Number(marketById.get(s.marketId)?.amountEstimatedExclTax ?? 0), 0);

  const upcomingDeadlines = folders
    .map((f) => ({ folder: f, market: marketById.get(f.marketId) }))
    .filter((x): x is { folder: (typeof folders)[number]; market: NonNullable<typeof x.market> } => Boolean(x.market?.submissionDeadline && x.market.submissionDeadline > new Date()))
    .sort((a, b) => a.market.submissionDeadline!.getTime() - b.market.submissionDeadline!.getTime())
    .slice(0, 8);

  const deadlineSoonCount = upcomingDeadlines.filter((x) => (daysUntil(x.market.submissionDeadline) ?? 999) <= 7).length;

  const readinessAvg = folders.length > 0
    ? Math.round((folders.reduce((sum, f) => sum + (f.checklist.length > 0 ? f.checklist.filter((c) => c.done).length / f.checklist.length : 0), 0) / folders.length) * 100)
    : 0;

  const funnelData = VERDICT_ORDER.map((v) => ({
    name: MATCH_VERDICT_LABEL[v],
    nombre: verdictGroups.find((g) => g.verdict === v)?._count._all ?? 0,
  }));

  const sectorMap = new Map<string, number>();
  for (const s of matchedScores) {
    const market = marketById.get(s.marketId);
    if (!market) continue;
    const name = market.sector?.name ?? "Non classé";
    sectorMap.set(name, (sectorMap.get(name) ?? 0) + Number(market.amountEstimatedExclTax ?? 0));
  }
  const sectorSeries = [...sectorMap.entries()]
    .map(([name, value]) => ({ name, valeur: Math.round(value / 1_000_000) }))
    .sort((a, b) => b.valeur - a.valeur)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink">Dashboard commercial</h1>
        <p className="text-sm text-ink-muted">{today} · pipeline de soumission et qualification des opportunités de {tenant.name}.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Dossiers actifs" value={String(folders.length)} source="Dossiers de soumission" />
        <StatCard label="Valeur du pipeline" value={formatFcfa(pipelineValue)} deltaLabel="marchés en dossier" source="Dossiers de soumission" />
        <StatCard label="Échéances < 7 jours" value={String(deadlineSoonCount)} source="Dossiers actifs" />
        <StatCard label="Préparation moyenne" value={`${readinessAvg}%`} deltaLabel="complétion des checklists" source="Dossiers de soumission" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <ChartCard title="Funnel de qualification" period="cumul" unit="nombre de marchés" source="Moteur de matching">
            <SimpleBarChart data={funnelData} xKey="name" yKey="nombre" highlightKey="Compatible" />
          </ChartCard>

          <ChartCard title="Pipeline d'opportunités par secteur" period="cumul" unit="millions FCFA, opportunités pertinentes" source="Moteur de scoring">
            {sectorSeries.length > 0 ? <SimpleBarChart data={sectorSeries} xKey="name" yKey="valeur" /> : <StateNotice kind="empty" title="Aucune opportunité pertinente pour l'instant" />}
          </ChartCard>

          <Card>
            <CardHeader>
              <CardTitle>Dossiers de soumission</CardTitle>
              <Link href="/dossiers" className="text-xs font-medium text-brand hover:underline">Tout voir</Link>
            </CardHeader>
            <CardBody className="space-y-2">
              {folders.length === 0 ? (
                <StateNotice kind="empty" title="Aucun dossier ouvert" description="Ouvrez une fiche marché et cliquez sur « Ajouter au dossier »." />
              ) : (
                folders.slice(0, 8).map((f) => {
                  const market = marketById.get(f.marketId);
                  const done = f.checklist.filter((c) => c.done).length;
                  return (
                    <Link key={f.id} href={`/dossiers/${f.id}`} className="flex items-center justify-between gap-3 rounded-md border border-line p-2.5 hover:border-brand">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-ink">{market?.title ?? "Marché"}</p>
                        <p className="text-xs text-ink-muted">{f.status} · {f.checklist.length > 0 ? `${done}/${f.checklist.length} tâches` : "aucune tâche"}</p>
                      </div>
                      {market?.amountEstimatedExclTax && <span className="shrink-0 text-xs font-medium text-ink">{formatFcfa(market.amountEstimatedExclTax.toString())}</span>}
                    </Link>
                  );
                })
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Échéances de vos dossiers</CardTitle></CardHeader>
            <CardBody className="space-y-2">
              {upcomingDeadlines.length === 0 ? (
                <StateNotice kind="empty" title="Aucune échéance à venir" />
              ) : (
                upcomingDeadlines.map(({ folder, market }) => {
                  const d = daysUntil(market.submissionDeadline);
                  return (
                    <Link key={folder.id} href={`/dossiers/${folder.id}`} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-surface-elevated">
                      <span className="min-w-0 truncate text-xs text-ink">{market.title}</span>
                      <Badge tone={d !== null && d <= 3 ? "critical" : d !== null && d <= 7 ? "warning" : "neutral"}>{d}j</Badge>
                    </Link>
                  );
                })
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Qualification des opportunités</CardTitle></CardHeader>
            <CardBody className="space-y-2">
              {VERDICT_ORDER.map((v) => {
                const count = verdictGroups.find((g) => g.verdict === v)?._count._all ?? 0;
                return (
                  <div key={v} className="flex items-center justify-between text-xs">
                    <Badge tone={MATCH_VERDICT_TONE[v]}>{MATCH_VERDICT_LABEL[v]}</Badge>
                    <span className="font-medium text-ink">{count}</span>
                  </div>
                );
              })}
              <p className="pt-1 text-[11px] text-ink-faint">Valeur des opportunités compatibles : {formatFcfa(opportunityValue)}</p>
            </CardBody>
          </Card>
        </div>
      </div>

      <p className="text-[11px] text-ink-faint">
        Le pipeline et la qualification sont calculés à partir de votre profil d&apos;entreprise et de vos dossiers de soumission. Complétez votre profil dans « Mon entreprise » pour affiner le matching.
      </p>
    </div>
  );
}
