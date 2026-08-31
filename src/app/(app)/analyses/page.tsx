import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/StatCard";
import { formatFcfa } from "@/lib/utils";

const DIMENSIONS = [
  { slug: "volumes", label: "Volumes", desc: "Nombre de marchés publiés et leur statut." },
  { slug: "montants", label: "Montants", desc: "Valeur totale, moyenne et répartition par secteur." },
  { slug: "secteurs", label: "Secteurs", desc: "Volume et poids de chaque secteur d'activité." },
  { slug: "geographie", label: "Géographie", desc: "Répartition régionale des marchés." },
  { slug: "organismes", label: "Organismes", desc: "Organismes les plus actifs." },
  { slug: "entreprises", label: "Entreprises", desc: "Entreprises les plus présentes." },
  { slug: "concurrence", label: "Concurrence", desc: "Victoires et montants cumulés par entreprise." },
  { slug: "prix", label: "Prix", desc: "Écarts entre estimation et attribution." },
  { slug: "reussite", label: "Taux de réussite", desc: "Taux de succès des entreprises actives." },
  { slug: "causes-echec", label: "Causes d'échec", desc: "Motifs de rejet les plus fréquents." },
  { slug: "financements", label: "Financements", desc: "Répartition par source de financement." },
  { slug: "temporelle", label: "Temporelle", desc: "Évolution mensuelle de l'activité." },
];

export default async function AnalysesPage() {
  const [marketCount, resultCount, companyCount, totalValue] = await Promise.all([
    prisma.market.count(),
    prisma.result.count(),
    prisma.company.count(),
    prisma.market.aggregate({ _sum: { amountEstimatedExclTax: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink">Analyses</h1>
        <p className="text-sm text-ink-muted">Vue d&apos;ensemble de l&apos;intelligence de marché — données officielles restructurées.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Marchés analysés" value={String(marketCount)} source="DGCMEF" />
        <StatCard label="Résultats" value={String(resultCount)} source="DGCMEF" />
        <StatCard label="Entreprises identifiées" value={String(companyCount)} source="Résolution d'entité" />
        <StatCard label="Valeur cumulée" value={formatFcfa(totalValue._sum.amountEstimatedExclTax?.toString())} source="Montants estimés" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DIMENSIONS.map((d) => (
          <Link key={d.slug} href={`/analyses/${d.slug}`}>
            <Card><CardBody>
              <p className="text-sm font-medium text-ink">{d.label}</p>
              <p className="mt-1 text-xs text-ink-muted">{d.desc}</p>
            </CardBody></Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
