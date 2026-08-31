import { requireTenantContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Sun } from "lucide-react";

export default async function BriefingQuotidienPage() {
  const { tenant } = await requireTenantContext();
  const now = new Date();
  const ago24h = new Date(now.getTime() - 24 * 3600_000);
  const in48h = new Date(now.getTime() + 48 * 3600_000);

  const [priorityRecs, deadlines48h, corrections, newResults, matching, lastWeekMarkets, prevWeekMarkets] = await Promise.all([
    prisma.recommendation.findMany({ where: { tenantId: tenant.id }, orderBy: { rank: "asc" }, take: 3, include: { market: true } }),
    prisma.score.count({ where: { tenantId: tenant.id, market: { submissionDeadline: { gte: now, lte: in48h } } } }),
    prisma.correction.count({ where: { createdAt: { gte: ago24h } } }),
    prisma.result.count({ where: { resultAt: { gte: ago24h } } }),
    prisma.matchResult.count({ where: { tenantId: tenant.id, verdict: { in: ["COMPATIBLE", "PROBABLEMENT_COMPATIBLE"] } } }),
    prisma.market.count({ where: { publishedAt: { gte: new Date(now.getTime() - 7 * 86_400_000) } } }),
    prisma.market.count({ where: { publishedAt: { gte: new Date(now.getTime() - 14 * 86_400_000), lt: new Date(now.getTime() - 7 * 86_400_000) } } }),
  ]);

  const trend = prevWeekMarkets > 0 ? Math.round(((lastWeekMarkets - prevWeekMarkets) / prevWeekMarkets) * 100) : null;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center gap-2">
        <Sun className="h-6 w-6 text-warning" />
        <div>
          <h1 className="text-lg font-semibold text-ink">Bonjour, {tenant.name}</h1>
          <p className="text-sm text-ink-muted">{formatDate(now)}</p>
        </div>
      </div>

      <Card><CardBody className="space-y-2 text-sm">
        <p>🎯 <strong>{priorityRecs.length}</strong> opportunité(s) prioritaire(s)</p>
        <p>⏰ <strong>{deadlines48h}</strong> échéance(s) &lt; 48h</p>
        <p>✏️ <strong>{corrections}</strong> rectification(s) importante(s) (24h)</p>
        <p>📄 <strong>{newResults}</strong> nouveau(x) résultat(s)</p>
        <p>✅ <strong>{matching}</strong> marché(s) correspondant à votre profil</p>
      </CardBody></Card>

      {trend !== null && (
        <Card><CardBody>
          <p className="text-sm text-ink">Tendance : <span className={trend >= 0 ? "text-success" : "text-critical"}>{trend >= 0 ? "+" : ""}{trend}%</span> de publications dans les 7 derniers jours vs semaine précédente.</p>
        </CardBody></Card>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-ink">Vos priorités du jour</p>
        <div className="space-y-2">
          {priorityRecs.map((r) => (
            <Link key={r.id} href={`/marches/${r.marketId}`} className="block rounded-md border border-line bg-paper p-3 text-sm hover:border-brand">
              {r.market.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
