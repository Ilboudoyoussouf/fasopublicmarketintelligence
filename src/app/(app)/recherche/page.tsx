import { Suspense } from "react";
import { runGlobalSearch } from "@/lib/search/nl-query";
import { MarketRow } from "@/components/domain/MarketRow";
import { Card, CardBody } from "@/components/ui/Card";
import { StateNotice } from "@/components/ui/StateNotice";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

async function SearchResults({ q }: { q: string }) {
  if (!q.trim()) {
    return <StateNotice kind="empty" title="Saisissez une recherche" description={'Ex. « marchés informatiques à Ouagadougou de plus de 20 millions »'} />;
  }

  const { parsed, markets, companies, authorities } = await runGlobalSearch(q);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5">
        {parsed.amountMin && <Badge tone="brand">Montant ≥ {(parsed.amountMin / 1_000_000).toLocaleString("fr-FR")} M FCFA</Badge>}
        {parsed.region && <Badge tone="brand">Région : {parsed.region}</Badge>}
        {parsed.sectorKeyword && <Badge tone="brand">Secteur : {parsed.sectorKeyword}</Badge>}
        {parsed.organismeKeyword && <Badge tone="brand">Organisme : {parsed.organismeKeyword}</Badge>}
      </div>

      <section>
        <p className="mb-2 text-sm font-medium text-ink">Marchés ({markets.length})</p>
        {markets.length === 0 ? <StateNotice kind="empty" title="Aucun marché trouvé" /> : (
          <div className="space-y-2">{markets.map((m) => <MarketRow key={m.id} market={m} />)}</div>
        )}
      </section>

      {companies.length > 0 && (
        <section>
          <p className="mb-2 text-sm font-medium text-ink">Entreprises</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {companies.map((c) => (
              <Link key={c.id} href={`/entreprises/${c.id}`}><Card><CardBody className="text-sm text-ink">{c.canonicalName}</CardBody></Card></Link>
            ))}
          </div>
        </section>
      )}

      {authorities.length > 0 && (
        <section>
          <p className="mb-2 text-sm font-medium text-ink">Organismes</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {authorities.map((a) => (
              <Link key={a.id} href={`/organismes/${a.id}`}><Card><CardBody className="text-sm text-ink">{a.name}</CardBody></Card></Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default async function RecherchePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const q = sp.q ?? "";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Résultats de recherche</h1>
        {q && <p className="text-sm text-ink-muted">« {q} »</p>}
      </div>
      <Suspense fallback={<p className="text-sm text-ink-muted">Recherche…</p>}>
        <SearchResults q={q} />
      </Suspense>
    </div>
  );
}
