import { notFound } from "next/navigation";
import { ChartCard } from "@/components/charts/ChartCard";
import { SimpleBarChart, SimpleLineChart, SimpleDonutChart, SimpleTreemap, SimpleScatterChart } from "@/components/charts/Charts";
import { StatCard } from "@/components/ui/StatCard";
import { StateNotice } from "@/components/ui/StateNotice";
import { formatDate, formatFcfa } from "@/lib/utils";
import {
  getVolumesData, getMontantsData, getSecteursData, getGeographieData, getOrganismesData,
  getEntreprisesData, getConcurrenceData, getPrixData, getReussiteData, getCausesEchecData,
  getFinancementsData, getTemporelleData,
} from "@/lib/queries/analyses";

const TITLES: Record<string, string> = {
  volumes: "Analyse des volumes", montants: "Analyse des montants", secteurs: "Analyse des secteurs",
  geographie: "Analyse géographique", organismes: "Analyse des organismes", entreprises: "Analyse des entreprises",
  concurrence: "Analyse concurrentielle", prix: "Analyse des prix", reussite: "Taux de réussite",
  "causes-echec": "Analyse des causes d'échec", financements: "Analyse des financements", temporelle: "Analyse temporelle",
  tendances: "Tendances & prévisions",
};

export default async function AnalyseDimensionPage({ params }: { params: Promise<{ dimension: string }> }) {
  const { dimension } = await params;
  if (!TITLES[dimension]) notFound();
  const updatedAt = formatDate(new Date());

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-ink">{TITLES[dimension]}</h1>
      {await renderDimension(dimension, updatedAt)}
      <p className="text-[11px] text-ink-faint">Projection statistique — non garantie. Les données analytiques ne remplacent pas la publication officielle.</p>
    </div>
  );
}

async function renderDimension(dimension: string, updatedAt: string) {
  switch (dimension) {
    case "volumes": {
      const d = await getVolumesData();
      return (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Marchés au total" value={String(d.total)} source="DGCMEF" />
          </div>
          <ChartCard title="Marchés publiés par statut" period="cumul" source="DGCMEF" updatedAt={updatedAt}>
            <SimpleBarChart data={d.byStatus} xKey="name" yKey="count" />
          </ChartCard>
          <ChartCard title="Évolution mensuelle du nombre de marchés" period="12 derniers mois" source="DGCMEF" updatedAt={updatedAt}>
            <SimpleLineChart data={d.series} xKey="mois" series={["nombre"]} />
          </ChartCard>
        </>
      );
    }
    case "montants": {
      const d = await getMontantsData();
      return (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Valeur totale estimée" value={formatFcfa(d.total)} source="DGCMEF" />
            <StatCard label="Montant moyen" value={formatFcfa(d.average)} source="DGCMEF" />
            <StatCard label="Marchés chiffrés" value={String(d.count)} source="DGCMEF" />
          </div>
          <ChartCard title="Évolution de la valeur publiée" period="12 derniers mois" unit="millions FCFA" source="DGCMEF" updatedAt={updatedAt}>
            <SimpleLineChart data={d.series} xKey="mois" series={["valeur"]} />
          </ChartCard>
          {d.byGroup.length > 0 && (
            <ChartCard title="Répartition de la valeur par secteur" period="cumul" unit="FCFA" source="DGCMEF" updatedAt={updatedAt}>
              <SimpleTreemap data={d.byGroup} />
            </ChartCard>
          )}
        </>
      );
    }
    case "secteurs": {
      const d = await getSecteursData();
      return (
        <>
          <ChartCard title="Top secteurs" period="cumul" source="DGCMEF" updatedAt={updatedAt}>
            {d.bySector.length > 0 ? <SimpleBarChart data={d.bySector} xKey="name" yKey="count" /> : <StateNotice kind="empty" title="Aucune donnée" />}
          </ChartCard>
          <ChartCard title="Répartition par famille" period="cumul" source="DGCMEF" updatedAt={updatedAt}>
            {d.byGroup.length > 0 ? <SimpleDonutChart data={d.byGroup} nameKey="name" valueKey="value" /> : <StateNotice kind="empty" title="Aucune donnée" />}
          </ChartCard>
        </>
      );
    }
    case "geographie": {
      const d = await getGeographieData();
      return (
        <ChartCard title="Marchés par région" period="cumul" unit="nombre / millions FCFA" source="DGCMEF" updatedAt={updatedAt}>
          {d.length > 0 ? <SimpleBarChart data={d} xKey="name" yKey="count" /> : <StateNotice kind="empty" title="Aucune donnée géographique" />}
        </ChartCard>
      );
    }
    case "organismes": {
      const d = await getOrganismesData();
      return (
        <ChartCard title="Organismes les plus actifs" period="cumul" source="DGCMEF" updatedAt={updatedAt}>
          {d.length > 0 ? <SimpleBarChart data={d} xKey="name" yKey="count" /> : <StateNotice kind="empty" title="Aucune donnée" />}
        </ChartCard>
      );
    }
    case "entreprises": {
      const d = await getEntreprisesData();
      return (
        <ChartCard title="Entreprises les plus actives" period="cumul" source="DGCMEF" updatedAt={updatedAt}>
          {d.length > 0 ? <SimpleBarChart data={d} xKey="name" yKey="count" /> : <StateNotice kind="empty" title="Aucune donnée" />}
        </ChartCard>
      );
    }
    case "concurrence": {
      const d = await getConcurrenceData();
      return (
        <ChartCard title="Victoires par entreprise" period="cumul" unit="millions FCFA attribués" source="DGCMEF" updatedAt={updatedAt}>
          {d.length > 0 ? <SimpleBarChart data={d} xKey="name" yKey="victoires" /> : <StateNotice kind="empty" title="Aucune donnée" />}
        </ChartCard>
      );
    }
    case "prix": {
      const d = await getPrixData();
      return (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Moyenne" value={formatFcfa(d.stats.mean)} source="Résultats" />
            <StatCard label="Médiane" value={formatFcfa(d.stats.median)} source="Résultats" />
            <StatCard label="Minimum" value={formatFcfa(d.stats.min)} source="Résultats" />
            <StatCard label="Maximum" value={formatFcfa(d.stats.max)} source="Résultats" />
          </div>
          <ChartCard title="Montant attribué vs estimation" period="cumul" unit="millions FCFA" source="DGCMEF" updatedAt={updatedAt}>
            {d.points.length > 0 ? <SimpleScatterChart data={d.points} xKey="estimation" yKey="attribue" xLabel="Estimation" yLabel="Attribué" /> : <StateNotice kind="empty" title="Historique insuffisant" />}
          </ChartCard>
          <p className="text-[11px] text-ink-faint">Ne constitue pas un prix officiel (section 34).</p>
        </>
      );
    }
    case "reussite": {
      const d = await getReussiteData();
      return (
        <ChartCard title="Taux de réussite par entreprise (≥ 2 participations)" period="cumul" unit="%" source="DGCMEF" updatedAt={updatedAt}>
          {d.length > 0 ? <SimpleBarChart data={d} xKey="name" yKey="taux" color="#35c47a" /> : <StateNotice kind="empty" title="Historique insuffisant" />}
        </ChartCard>
      );
    }
    case "causes-echec": {
      const d = await getCausesEchecData();
      return (
        <ChartCard title="Motifs de rejet" period="cumul" source="Résultats officiels" updatedAt={updatedAt}>
          {d.length > 0 ? <SimpleDonutChart data={d} nameKey="name" valueKey="value" /> : <StateNotice kind="empty" title="Aucun motif de rejet enregistré" />}
        </ChartCard>
      );
    }
    case "financements": {
      const d = await getFinancementsData();
      return (
        <ChartCard title="Répartition par source de financement" period="cumul" unit="millions FCFA" source="DGCMEF" updatedAt={updatedAt}>
          {d.length > 0 ? <SimpleBarChart data={d} xKey="name" yKey="valeur" /> : <StateNotice kind="empty" title="Aucune donnée" />}
        </ChartCard>
      );
    }
    case "temporelle": {
      const d = await getTemporelleData();
      return (
        <ChartCard title="Évolution mensuelle" period="12 derniers mois" source="DGCMEF" updatedAt={updatedAt}>
          {d.series.length > 0 ? <SimpleLineChart data={d.series} xKey="mois" series={["nombre", "valeur"]} /> : <StateNotice kind="empty" title="Aucune donnée" />}
        </ChartCard>
      );
    }
    case "tendances": {
      const d = await getTemporelleData();
      const last = d.series.at(-1);
      const prev = d.series.at(-2);
      const trendPct = last && prev && prev.nombre > 0 ? Math.round(((last.nombre - prev.nombre) / prev.nombre) * 100) : null;
      return (
        <>
          {trendPct !== null && (
            <StatCard label="Tendance du dernier mois" value={`${trendPct >= 0 ? "+" : ""}${trendPct}%`} delta={trendPct} period="vs mois précédent" source="DGCMEF" />
          )}
          <ChartCard title="Évolution et projection" period="12 derniers mois" source="DGCMEF" updatedAt={updatedAt}>
            {d.series.length > 0 ? <SimpleLineChart data={d.series} xKey="mois" series={["nombre"]} /> : <StateNotice kind="empty" title="Historique insuffisant" />}
          </ChartCard>
        </>
      );
    }
    default:
      return null;
  }
}
