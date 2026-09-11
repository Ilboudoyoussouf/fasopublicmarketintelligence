import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { SimpleBarChart, SimpleLineChart, SimpleDonutChart } from "@/components/charts/Charts";
import { Card, CardBody } from "@/components/ui/Card";
import { formatFcfa } from "@/lib/utils";
import { MARKET_STATUS_LABEL } from "@/lib/labels";
import {
  getVolumesData, getMontantsData, getSecteursData, getGeographieData, getOrganismesData, getEntreprisesData,
} from "@/lib/queries/analyses";

const LINK_OUT = [
  { slug: "prix", label: "Prix", desc: "Écarts entre estimation et attribution." },
  { slug: "reussite", label: "Taux de réussite", desc: "Taux de succès des entreprises actives." },
  { slug: "concurrence", label: "Concurrence", desc: "Victoires et montants cumulés par entreprise." },
  { slug: "causes-echec", label: "Causes d'échec", desc: "Motifs de rejet les plus fréquents." },
  { slug: "financements", label: "Financements", desc: "Répartition par source de financement." },
  { slug: "temporelle", label: "Temporelle & tendances", desc: "Évolution mensuelle et prévisions." },
];

export default async function DashboardAnalytiquePage() {
  const today = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date());

  const [volumes, montants, secteurs, geographie, organismes, entreprises] = await Promise.all([
    getVolumesData(),
    getMontantsData(),
    getSecteursData(),
    getGeographieData(),
    getOrganismesData(),
    getEntreprisesData(),
  ]);

  const statusSeries = volumes.byStatus
    .map((s) => ({ name: MARKET_STATUS_LABEL[s.name] ?? s.name, nombre: s.count }))
    .sort((a, b) => b.nombre - a.nombre);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink">Dashboard analytique</h1>
        <p className="text-sm text-ink-muted">{today} · vue d&apos;ensemble de l&apos;intelligence de marché, toutes sources confondues.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Marchés analysés" value={String(volumes.total)} source="DGCMEF" />
        <StatCard label="Valeur cumulée" value={formatFcfa(montants.total)} deltaLabel={`${montants.count} marché(s) chiffré(s)`} source="Montants estimés" />
        <StatCard label="Montant moyen" value={formatFcfa(montants.average)} source="Montants estimés" />
        <StatCard label="Organismes actifs" value={String(organismes.length)} deltaLabel="parmi les plus actifs" source="Autorités contractantes" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Évolution mensuelle des publications" period="12 derniers mois" unit="nombre de marchés" source="DGCMEF">
          <SimpleLineChart data={volumes.series} xKey="mois" series={["nombre"]} />
        </ChartCard>

        <ChartCard title="Répartition par statut" period="cumul" unit="nombre de marchés" source="DGCMEF">
          <SimpleBarChart data={statusSeries} xKey="name" yKey="nombre" />
        </ChartCard>

        <ChartCard title="Répartition par secteur" period="cumul" unit="groupes de secteurs" source="Taxonomie sectorielle">
          <SimpleDonutChart data={secteurs.byGroup} nameKey="name" valueKey="value" />
        </ChartCard>

        <ChartCard title="Répartition géographique" period="cumul" unit="millions FCFA par région" source="DGCMEF">
          <SimpleBarChart data={geographie.slice(0, 8)} xKey="name" yKey="valeur" />
        </ChartCard>

        <ChartCard title="Organismes les plus actifs" period="cumul" unit="nombre de marchés" source="Autorités contractantes">
          <SimpleBarChart data={organismes.slice(0, 8).map((o) => ({ name: o.name, nombre: o.count }))} xKey="name" yKey="nombre" />
        </ChartCard>

        <ChartCard title="Entreprises les plus présentes" period="cumul" unit="nombre de participations" source="Résolution d'entité">
          <SimpleBarChart data={entreprises.slice(0, 8).map((e) => ({ name: e.name, nombre: e.count }))} xKey="name" yKey="nombre" />
        </ChartCard>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink">Approfondir l&apos;analyse</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LINK_OUT.map((d) => (
            <Link key={d.slug} href={`/analyses/${d.slug}`}>
              <Card><CardBody>
                <p className="text-sm font-medium text-ink">{d.label}</p>
                <p className="mt-1 text-xs text-ink-muted">{d.desc}</p>
              </CardBody></Card>
            </Link>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-ink-faint">
        Ce tableau de bord agrège l&apos;ensemble des marchés analysés par la plateforme. Pour l&apos;analyse détaillée par dimension, consultez le module « Analyses ».
      </p>
    </div>
  );
}
