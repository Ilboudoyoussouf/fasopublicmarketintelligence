import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";
import { ScoreBlock } from "@/components/ui/ScoreBlock";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatFcfa, formatDate } from "@/lib/utils";
import { StateNotice } from "@/components/ui/StateNotice";
import { PartyPopper } from "lucide-react";

export default async function PremiereRecommandationPage() {
  const session = await auth();
  if (!session?.user || !session.activeTenantId) redirect("/onboarding/bienvenue");

  const recommendations = await prisma.recommendation.findMany({
    where: { tenantId: session.activeTenantId },
    orderBy: { rank: "asc" },
    include: { market: { include: { contractingAuthority: true, sector: true } } },
  });
  const scores = await prisma.score.findMany({ where: { tenantId: session.activeTenantId } });
  const scoreByMarket = new Map(scores.map((s) => [s.marketId, s]));

  return (
    <div>
      <div className="mb-6 flex flex-col items-center text-center">
        <PartyPopper className="mb-2 h-7 w-7 text-brand" />
        <h1 className="text-lg font-semibold text-ink">Votre profil est prêt</h1>
        <p className="mt-1 text-sm text-ink-muted">Voici vos premières opportunités recommandées, calculées à partir de votre profil.</p>
      </div>

      {recommendations.length === 0 ? (
        <StateNotice kind="empty" title="Aucune opportunité active pour le moment" description="Revenez bientôt : de nouvelles publications sont surveillées chaque jour." />
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => {
            const score = scoreByMarket.get(rec.marketId);
            return (
              <Card key={rec.id}>
                <CardBody className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge tone="brand">#{rec.rank} recommandé</Badge>
                      <p className="mt-1 font-medium text-ink">{rec.market.title}</p>
                      <p className="text-xs text-ink-muted">{rec.market.contractingAuthority.name} · {formatFcfa(rec.market.amountEstimatedExclTax?.toString())} · échéance {formatDate(rec.market.submissionDeadline)}</p>
                    </div>
                  </div>
                  {score && <ScoreBlock pertinence={score.pertinence} eligibilite={score.eligibilite} attractivite={score.attractivite} global={score.global} compact />}
                  <Link href={`/marches/${rec.market.id}`} className="text-xs font-medium text-brand hover:underline">Voir la fiche complète →</Link>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <Link href="/dashboard">
          <Button variant="primary">Accéder à mon dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
