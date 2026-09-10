import { requireTenantContext } from "@/lib/session";
import { getDashboardData } from "@/lib/queries/dashboard";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { ScoreBlock } from "@/components/ui/ScoreBlock";
import { Badge } from "@/components/ui/Badge";
import { ChartCard } from "@/components/charts/ChartCard";
import { SimpleBarChart, SimpleAreaChart } from "@/components/charts/Charts";
import { StateNotice } from "@/components/ui/StateNotice";
import { formatFcfa, formatDate, daysUntil } from "@/lib/utils";
import Link from "next/link";
import { AlertPriorityBadge, alertPriorityTone } from "@/components/domain/AlertBadge";

export default async function DashboardPage() {
  const { tenant } = await requireTenantContext();
  const data = await getDashboardData(tenant.id);
  const today = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date());

  const activityByDay = new Map<string, { count: number; value: number }>();
  for (const m of data.activityMarkets) {
    if (!m.publishedAt) continue;
    const key = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(m.publishedAt);
    const prev = activityByDay.get(key) ?? { count: 0, value: 0 };
    activityByDay.set(key, { count: prev.count + 1, value: prev.value + Number(m.amountEstimatedExclTax ?? 0) });
  }
  const activitySeries = [...activityByDay.entries()].map(([date, v]) => ({ date, marchés: v.count }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink">Bonjour, {tenant.name}</h1>
        <p className="text-sm text-ink-muted">{today} · voici votre synthèse de la commande publique.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Nouvelles opportunités" value={String(data.kpis.newOpportunities)} period="7 derniers jours" source="DGCMEF" />
        <StatCard label="Opportunités correspondantes" value={String(data.kpis.matchingCount)} period="profil actuel" source="Moteur de matching" />
        <StatCard label="Échéances < 7 jours" value={String(data.kpis.deadlineSoon)} deltaLabel="parmi vos opportunités" source="Calendrier" />
        <StatCard label="Marchés suivis" value={String(data.kpis.watchedCount)} source="Watchlists" />
        <StatCard label="Résultats récents" value={String(data.kpis.recentResults)} period="14 derniers jours" source="DGCMEF" />
        <StatCard label="Valeur des opportunités" value={formatFcfa(data.kpis.totalValue)} period="score ≥ 50" source="Moteur de scoring" />
        <StatCard label="Marchés planifiés (PPM)" value={String(data.kpis.planifiedCount)} source="Plans de passation" />
        <StatCard label="Alertes critiques" value={String(data.kpis.criticalAlerts)} source="Centre d'alertes" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Opportunités recommandées</CardTitle>
              <Link href="/opportunites?vue=recommandees" className="text-xs font-medium text-brand hover:underline">Tout voir</Link>
            </CardHeader>
            <CardBody className="space-y-3">
              {data.recommendations.length === 0 ? (
                <StateNotice kind="empty" title="Aucune recommandation pour l'instant" description="Complétez votre profil dans « Mon entreprise » pour affiner le matching." />
              ) : (
                data.recommendations.map((rec) => (
                  <Link key={rec.id} href={`/marches/${rec.marketId}`} className="block rounded-md border border-line p-3 hover:border-brand">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{rec.market.title}</p>
                        <p className="text-xs text-ink-muted">{rec.market.contractingAuthority.name} · {formatFcfa(rec.market.amountEstimatedExclTax?.toString())}</p>
                      </div>
                      <Badge tone="brand">#{rec.rank}</Badge>
                    </div>
                  </Link>
                ))
              )}
            </CardBody>
          </Card>

          <ChartCard title="Activité du marché" period="30 derniers jours" unit="nombre de marchés publiés" source="DGCMEF" updatedAt={formatDate(new Date())}>
            {activitySeries.length > 0 ? <SimpleAreaChart data={activitySeries} xKey="date" yKey="marchés" /> : <StateNotice kind="empty" title="Pas assez de données" />}
          </ChartCard>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ChartCard title="Organismes actifs" period="cumul" source="DGCMEF" height={220}>
              {data.topAuthorities.length > 0 ? <SimpleBarChart data={data.topAuthorities} xKey="name" yKey="count" /> : <StateNotice kind="empty" title="Aucune donnée" />}
            </ChartCard>
            <ChartCard title="Secteurs" period="cumul" source="DGCMEF" height={220}>
              {data.topSectors.length > 0 ? <SimpleBarChart data={data.topSectors} xKey="name" yKey="count" color="#2563eb" /> : <StateNotice kind="empty" title="Aucune donnée" />}
            </ChartCard>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Échéances</CardTitle></CardHeader>
            <CardBody className="space-y-2">
              {data.upcomingDeadlines.length === 0 ? (
                <StateNotice kind="empty" title="Aucune échéance à venir" />
              ) : (
                data.upcomingDeadlines.map((s) => {
                  const d = daysUntil(s.market.submissionDeadline);
                  return (
                    <Link key={s.id} href={`/marches/${s.marketId}`} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-surface-elevated">
                      <span className="min-w-0 truncate text-xs text-ink">{s.market.title}</span>
                      <Badge tone={d !== null && d <= 3 ? "critical" : d !== null && d <= 7 ? "warning" : "neutral"}>{d}j</Badge>
                    </Link>
                  );
                })
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertes</CardTitle>
              <Link href="/veille/alertes" className="text-xs font-medium text-brand hover:underline">Tout voir</Link>
            </CardHeader>
            <CardBody className="space-y-2">
              {data.recentAlerts.length === 0 ? (
                <StateNotice kind="empty" title="Aucune alerte" />
              ) : (
                data.recentAlerts.map((a) => (
                  <div key={a.id} className="flex items-start gap-2 rounded-md px-2 py-1.5">
                    <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${alertPriorityTone(a.priority)}`} />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-ink">{a.title}</p>
                      <AlertPriorityBadge priority={a.priority} />
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Concurrence</CardTitle></CardHeader>
            <CardBody className="space-y-1.5">
              {data.topCompanies.length === 0 ? (
                <StateNotice kind="empty" title="Aucune donnée" />
              ) : (
                data.topCompanies.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <span className="truncate text-ink-muted">{c.name}</span>
                    <span className="font-medium text-ink">{c.count}</span>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <p className="text-[11px] text-ink-faint">
        Les données proviennent de sources officielles et sont restructurées à des fins de veille et d&apos;analyse. Les scores sont indicatifs.
      </p>
    </div>
  );
}
