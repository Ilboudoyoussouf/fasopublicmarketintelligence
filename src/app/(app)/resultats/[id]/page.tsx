import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SourceTag } from "@/components/ui/SourceTag";
import { formatFcfa, formatDate } from "@/lib/utils";
import { REJECTION_REASON_LABEL } from "@/lib/labels";
import { StateNotice } from "@/components/ui/StateNotice";

export default async function ResultatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await prisma.result.findUnique({
    where: { id },
    include: {
      market: { include: { contractingAuthority: true, sector: true } },
      winnerCompany: true,
      sourceDocument: { include: { publication: true } },
      lot: true,
    },
  });
  if (!result) notFound();

  const bids = await prisma.bid.findMany({ where: { marketId: result.marketId, lotId: result.lotId }, include: { company: true }, orderBy: { rank: "asc" } });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Link href={`/marches/${result.marketId}`} className="text-xs text-brand hover:underline">← {result.market.title}</Link>
        <h1 className="mt-1 text-lg font-semibold text-ink">Résultat{result.lot ? ` — Lot ${result.lot.numero}` : ""}</h1>
        <p className="text-sm text-ink-muted">{result.market.contractingAuthority.name} · {formatDate(result.resultAt)}</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Synthèse</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Row label="Nombre de plis" value={String(result.numberOfBids ?? "—")} />
          <Row label="Moyenne des offres" value={formatFcfa(result.meanAmount?.toString())} />
          <Row label="Seuil" value={formatFcfa(result.threshold?.toString())} />
          <Row label="Enveloppe prévisionnelle" value={formatFcfa(result.envelope?.toString())} />
          <Row label="Attributaire" value={result.winnerCompany?.canonicalName ?? "—"} />
          <Row label="Montant attribué" value={formatFcfa(result.awardedAmount?.toString())} />
        </CardBody>
      </Card>

      {result.decision && (
        <Card><CardHeader><CardTitle>Décision</CardTitle></CardHeader><CardBody><p className="text-sm text-ink-muted">{result.decision}</p></CardBody></Card>
      )}

      <Card>
        <CardHeader><CardTitle>Offres et conformité</CardTitle></CardHeader>
        <CardBody>
          {bids.length === 0 ? <StateNotice kind="empty" title="Détail des offres non disponible" /> : (
            <div className="space-y-2">
              {bids.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-md border border-line p-2.5 text-sm">
                  <div>
                    <Link href={`/entreprises/${b.companyId}`} className="font-medium text-ink hover:text-brand">{b.company.canonicalName}</Link>
                    {b.rank && <span className="ml-2 text-xs text-ink-faint">Rang {b.rank}</span>}
                  </div>
                  <div className="text-right">
                    <p>{formatFcfa(b.amountCorrected?.toString() ?? b.amountRead?.toString())}</p>
                    {b.conformity === false && b.rejectionReason && <Badge tone="critical">{REJECTION_REASON_LABEL[b.rejectionReason]}</Badge>}
                    {b.conformity === true && <Badge tone="success">Conforme</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {result.sourceDocument && (
        <Card>
          <CardHeader><CardTitle>Source</CardTitle></CardHeader>
          <CardBody><SourceTag numero={result.sourceDocument.publication.numero} documentId={result.sourceDocument.id} publishedAt={result.sourceDocument.publication.publishedAt} /></CardBody>
        </Card>
      )}
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
