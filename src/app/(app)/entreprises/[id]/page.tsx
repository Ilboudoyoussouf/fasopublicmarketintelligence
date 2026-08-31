import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StateNotice } from "@/components/ui/StateNotice";
import { ChartCard } from "@/components/charts/ChartCard";
import { SimpleDonutChart } from "@/components/charts/Charts";
import { formatFcfa, formatDate } from "@/lib/utils";
import { REJECTION_REASON_LABEL } from "@/lib/labels";

export default async function EntrepriseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: { aliases: true, sectors: { include: { sector: true } }, licenses: true, references: true },
  });
  if (!company) notFound();

  const participations = await prisma.companyParticipation.findMany({ where: { companyId: id } });
  const wins = participations.filter((p) => p.role === "WINNER").length;
  const losses = participations.filter((p) => p.role === "LOSER" || p.role === "DISQUALIFIED").length;
  const successRate = participations.length > 0 ? Math.round((wins / participations.length) * 100) : 0;
  const totalAwarded = participations.filter((p) => p.role === "WINNER").reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const avgAwarded = wins > 0 ? totalAwarded / wins : 0;

  const marketIds = participations.map((p) => p.marketId);
  const markets = await prisma.market.findMany({ where: { id: { in: marketIds } }, include: { contractingAuthority: true, sector: true, region: true } });
  const marketById = new Map(markets.map((m) => [m.id, m]));

  const organismes = new Set(markets.map((m) => m.contractingAuthority.name));
  const regions = new Set(markets.map((m) => m.region?.name).filter(Boolean));

  const bids = await prisma.bid.findMany({ where: { companyId: id, conformity: false }, include: { market: true } });
  const rejectionCounts = new Map<string, number>();
  for (const b of bids) {
    if (!b.rejectionReason) continue;
    const label = REJECTION_REASON_LABEL[b.rejectionReason];
    rejectionCounts.set(label, (rejectionCounts.get(label) ?? 0) + 1);
  }

  const competitorCompanyIds = new Set<string>();
  const competitorParticipations = await prisma.companyParticipation.findMany({ where: { marketId: { in: marketIds }, companyId: { not: id } } });
  for (const p of competitorParticipations) competitorCompanyIds.add(p.companyId);
  const competitors = await prisma.company.findMany({ where: { id: { in: [...competitorCompanyIds].slice(0, 8) } } });

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">{company.canonicalName}</h1>
        <p className="text-sm text-ink-muted">
          {company.ifu ? `IFU ${company.ifu} · ` : ""}{company.regionName ?? "Région non renseignée"}
          {company.aliases.length > 0 && ` · aussi connue sous : ${company.aliases.map((a) => a.aliasName).join(", ")}`}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {company.sectors.map((s) => <Badge key={s.id} tone="neutral">{s.sector.name}</Badge>)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Participations" value={String(participations.length)} />
        <MiniStat label="Marchés gagnés" value={String(wins)} />
        <MiniStat label="Taux de réussite" value={`${successRate}%`} />
        <MiniStat label="Montant total attribué" value={formatFcfa(totalAwarded)} />
      </div>

      <Card>
        <CardHeader><CardTitle>Profil concurrentiel</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Row label="Montant moyen attribué" value={formatFcfa(avgAwarded)} />
          <Row label="Organismes clients" value={String(organismes.size)} />
          <Row label="Régions actives" value={String(regions.size) || "—"} />
          <Row label="Marchés perdus / disqualifiés" value={String(losses)} />
        </CardBody>
      </Card>

      {rejectionCounts.size > 0 && (
        <ChartCard title="Causes d'échec" period="historique disponible" source="Résultats officiels" height={220}>
          <SimpleDonutChart data={[...rejectionCounts.entries()].map(([name, value]) => ({ name, value }))} nameKey="name" valueKey="value" />
        </ChartCard>
      )}

      <Card>
        <CardHeader><CardTitle>Historique des marchés</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          {participations.length === 0 ? <StateNotice kind="empty" title="Aucune participation enregistrée" /> : (
            participations.map((p) => {
              const m = marketById.get(p.marketId);
              if (!m) return null;
              return (
                <Link key={p.id} href={`/marches/${m.id}`} className="flex items-center justify-between rounded-md border border-line p-2.5 text-sm hover:border-brand">
                  <span className="truncate text-ink">{m.title}</span>
                  <Badge tone={p.role === "WINNER" ? "success" : p.role === "DISQUALIFIED" ? "critical" : "neutral"}>{roleLabel(p.role)}</Badge>
                </Link>
              );
            })
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Concurrents fréquents</CardTitle></CardHeader>
        <CardBody className="flex flex-wrap gap-1.5">
          {competitors.length === 0 ? <StateNotice kind="empty" title="Aucun concurrent identifié" /> : competitors.map((c) => (
            <Link key={c.id} href={`/entreprises/${c.id}`}><Badge tone="neutral">{c.canonicalName}</Badge></Link>
          ))}
        </CardBody>
      </Card>

      {company.references.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Références</CardTitle></CardHeader>
          <CardBody className="space-y-1.5 text-sm text-ink-muted">
            {company.references.map((r) => <p key={r.id}>{r.marketTitle} — {r.clientName} ({r.year}) · {formatFcfa(r.amount?.toString())}</p>)}
          </CardBody>
        </Card>
      )}

      <p className="text-[11px] text-ink-faint">
        Fiche publique construite à partir des publications officielles. Elle ne constitue pas une preuve de favoritisme ou d&apos;irrégularité (section 13).
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-paper p-3">
      <p className="text-[11px] text-ink-faint">{label}</p>
      <p className="text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-ink-faint">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
function roleLabel(role: string) {
  return { BIDDER: "Soumissionnaire", WINNER: "Attributaire", LOSER: "Non retenu", DISQUALIFIED: "Disqualifié" }[role] ?? role;
}
