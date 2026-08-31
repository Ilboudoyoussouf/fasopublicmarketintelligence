import { requireTenantContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { formatFcfa } from "@/lib/utils";

export default async function BriefingHebdomadairePage() {
  const { tenant } = await requireTenantContext();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const weekNumber = getISOWeek(now);

  const [published, valueAgg, topRec, urgent, topWinner] = await Promise.all([
    prisma.market.count({ where: { publishedAt: { gte: weekAgo } } }),
    prisma.market.aggregate({ where: { publishedAt: { gte: weekAgo } }, _sum: { amountEstimatedExclTax: true } }),
    prisma.recommendation.findFirst({ where: { tenantId: tenant.id }, orderBy: { rank: "asc" }, include: { market: true } }),
    prisma.score.count({ where: { tenantId: tenant.id, market: { submissionDeadline: { lte: new Date(now.getTime() + 72 * 3600_000) } } } }),
    prisma.companyParticipation.groupBy({ by: ["companyId"], where: { role: "WINNER" }, _count: { _all: true }, orderBy: { _count: { companyId: "desc" } }, take: 1 }),
  ]);
  const winnerCompany = topWinner[0] ? await prisma.company.findUnique({ where: { id: topWinner[0].companyId } }) : null;
  const topScore = topRec ? await prisma.score.findFirst({ where: { tenantId: tenant.id, marketId: topRec.marketId } }) : null;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Briefing — Semaine {weekNumber}</h1>
        <p className="text-sm text-ink-muted">Synthèse de la commande publique pour {tenant.name}.</p>
      </div>

      <Card><CardBody className="space-y-2 text-sm">
        <p>Marchés publiés : <strong>{published}</strong></p>
        <p>Valeur estimée : <strong>{formatFcfa(valueAgg._sum.amountEstimatedExclTax?.toString())}</strong></p>
        {topRec && (
          <p>Top opportunité : <strong>{topRec.market.title}</strong>{topScore ? ` — score ${Math.round(topScore.global)}` : ""}</p>
        )}
        <p>Risque : <strong>{urgent}</strong> opportunité(s) avec une échéance &lt; 72h</p>
        {winnerCompany && <p>Concurrence : <strong>{winnerCompany.canonicalName}</strong> a remporté {topWinner[0]._count._all} marché(s) cette période</p>}
      </CardBody></Card>

      <p className="text-[11px] text-ink-faint">Toutes les données de ce briefing sont sourcées depuis les publications officielles DGCMEF.</p>
    </div>
  );
}

function getISOWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}
