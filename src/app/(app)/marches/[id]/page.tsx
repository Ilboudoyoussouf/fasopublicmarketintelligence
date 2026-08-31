import { notFound } from "next/navigation";
import { requireTenantContext } from "@/lib/session";
import { getMarketDetail } from "@/lib/queries/market-detail";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScoreBlock } from "@/components/ui/ScoreBlock";
import { SourceTag } from "@/components/ui/SourceTag";
import { StateNotice } from "@/components/ui/StateNotice";
import { MarketCtaBar } from "@/components/domain/MarketCtaBar";
import { formatFcfa, formatDate, formatDateTime, daysUntil } from "@/lib/utils";
import {
  MARKET_STATUS_LABEL, MARKET_STATUS_TONE, PROCEDURE_TYPE_LABEL, PUBLICATION_TYPE_LABEL,
  REQUIREMENT_TYPE_LABEL, REQUIRED_DOC_LABEL, RESERVATION_CATEGORY_LABEL, FINANCING_SOURCE_LABEL,
} from "@/lib/labels";
import { WatchlistType } from "@prisma/client";
import Link from "next/link";
import { AlertTriangle, CalendarDays, MapPin } from "lucide-react";

export default async function MarcheDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenant } = await requireTenantContext();
  const detail = await getMarketDetail(id);
  if (!detail) notFound();
  const { market, priceStats, competitors } = detail;

  const [score, isWatched] = await Promise.all([
    prisma.score.findFirst({ where: { tenantId: tenant.id, marketId: market.id } }),
    prisma.watchlistTarget.findFirst({ where: { marketId: market.id, watchlist: { tenantId: tenant.id, type: WatchlistType.MARKET } } }),
  ]);

  const days = daysUntil(market.submissionDeadline);
  const primarySourceDoc = market.notices[0]?.document;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* En-tête */}
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <Badge tone={MARKET_STATUS_TONE[market.status]}>{MARKET_STATUS_LABEL[market.status]}</Badge>
          <Badge tone="neutral">{PROCEDURE_TYPE_LABEL[market.procedureType]}</Badge>
          {market.sector && <Badge tone="neutral">{market.sector.name}</Badge>}
          {market.reservations.map((r) => (
            <Badge key={r.id} tone="brand">{RESERVATION_CATEGORY_LABEL[r.category]}</Badge>
          ))}
        </div>
        <h1 className="text-lg font-semibold text-ink">{market.title}</h1>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {market.contractingAuthority.name}{market.region ? ` · ${market.region.name}` : ""}</span>
          <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Échéance {formatDate(market.submissionDeadline)}{days !== null && days >= 0 ? ` (${days} j)` : ""}</span>
          <span className="font-medium text-ink">{formatFcfa(market.amountEstimatedExclTax?.toString())}</span>
        </div>
      </div>

      <MarketCtaBar marketId={market.id} isWatched={!!isWatched} sourceUrl={primarySourceDoc?.url} />

      {days !== null && days >= 0 && days <= 3 && (
        <div className="flex items-center gap-2 rounded-md border border-critical/30 bg-critical-soft px-3 py-2 text-xs text-critical">
          <AlertTriangle className="h-4 w-4 shrink-0" /> Échéance très proche — dépôt attendu avant le {formatDateTime(market.submissionDeadline)}.
        </div>
      )}

      {/* Score + pourquoi cette opportunité */}
      {score && (
        <Card>
          <CardHeader><CardTitle>Pourquoi cette opportunité ?</CardTitle></CardHeader>
          <CardBody>
            <ScoreBlock pertinence={score.pertinence} eligibilite={score.eligibilite} attractivite={score.attractivite} global={score.global} factors={score.factors as Record<string, unknown>} />
          </CardBody>
        </Card>
      )}

      {/* Résumé en langage simple */}
      <Card>
        <CardHeader><CardTitle>Résumé en langage simple</CardTitle></CardHeader>
        <CardBody>
          <p className="text-sm text-ink-muted">{market.description || "Aucune description détaillée n'a encore été extraite pour ce marché."}</p>
        </CardBody>
      </Card>

      {/* Exigences */}
      <Card>
        <CardHeader><CardTitle>Exigences</CardTitle></CardHeader>
        <CardBody>
          {market.requirements.length === 0 ? (
            <StateNotice kind="empty" title="Exigences non encore extraites" />
          ) : (
            <ul className="space-y-2">
              {market.requirements.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-ink-muted">{REQUIREMENT_TYPE_LABEL[r.type]} — {r.rawText}</span>
                  <Badge tone={r.confidence >= 0.8 ? "success" : "warning"}>{Math.round(r.confidence * 100)}%</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* Documents requis */}
      <Card>
        <CardHeader><CardTitle>Documents requis</CardTitle></CardHeader>
        <CardBody>
          {market.requiredDocuments.length === 0 ? (
            <StateNotice kind="empty" title="Liste des pièces non encore extraite" />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {market.requiredDocuments.map((d) => (
                <Badge key={d.id} tone={d.mandatory ? "brand" : "neutral"}>{REQUIRED_DOC_LABEL[d.docType]}{!d.mandatory ? " (optionnel)" : ""}</Badge>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Lots */}
      {market.lots.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Lots ({market.lots.length})</CardTitle></CardHeader>
          <CardBody className="space-y-2">
            {market.lots.map((lot) => (
              <div key={lot.id} className="rounded-md border border-line p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink">{lot.numero} — {lot.objet}</p>
                  <span className="text-sm text-ink">{formatFcfa(lot.montant?.toString())}</span>
                </div>
                {lot.attributaire && <p className="mt-1 text-xs text-success">Attribué à {lot.attributaire.canonicalName}</p>}
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Calendrier */}
      <Card>
        <CardHeader><CardTitle>Calendrier</CardTitle></CardHeader>
        <CardBody>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <CalRow label="Publication" value={formatDate(market.publishedAt)} />
            <CalRow label="Retrait du dossier" value={formatDate(market.withdrawalDeadline)} />
            <CalRow label="Date limite" value={formatDate(market.submissionDeadline)} />
            <CalRow label="Ouverture" value={formatDate(market.openingAt)} />
            <CalRow label="Validité de l'offre" value={market.bidValidityDays ? `${market.bidValidityDays} jours` : "—"} />
            <CalRow label="Délai d'exécution" value={market.executionDelayDays ? `${market.executionDelayDays} jours` : "—"} />
            <CalRow label="Résultat" value={formatDate(market.resultAt)} />
          </dl>
        </CardBody>
      </Card>

      {/* Analyse historique / prix */}
      <Card>
        <CardHeader><CardTitle>Analyse historique &amp; prix du secteur</CardTitle></CardHeader>
        <CardBody>
          {!priceStats || priceStats._count._all === 0 ? (
            <StateNotice kind="empty" title="Historique insuffisant" description="Pas assez de résultats attribués dans ce secteur pour une analyse statistique." />
          ) : (
            <div className="grid grid-cols-3 gap-3 text-sm">
              <CalRow label="Moyenne attribuée" value={formatFcfa(priceStats._avg.amountAwarded?.toString())} />
              <CalRow label="Minimum" value={formatFcfa(priceStats._min.amountAwarded?.toString())} />
              <CalRow label="Maximum" value={formatFcfa(priceStats._max.amountAwarded?.toString())} />
            </div>
          )}
          <p className="mt-2 text-[11px] text-ink-faint">Estimation statistique — ne constitue pas un prix officiel (section 34).</p>
        </CardBody>
      </Card>

      {/* Concurrence */}
      <Card>
        <CardHeader><CardTitle>Concurrence habituelle du secteur</CardTitle></CardHeader>
        <CardBody>
          {competitors.length === 0 ? (
            <StateNotice kind="empty" title="Aucun historique de concurrence disponible" />
          ) : (
            <ul className="space-y-1.5">
              {competitors.map((c) => c.company && (
                <li key={c.company.id} className="flex items-center justify-between text-sm">
                  <Link href={`/entreprises/${c.company.id}`} className="text-ink hover:text-brand">{c.company.canonicalName}</Link>
                  <span className="text-ink-muted">{c.count} participation(s)</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* Financement */}
      {market.fundings.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Financement</CardTitle></CardHeader>
          <CardBody className="space-y-1 text-sm text-ink-muted">
            {market.fundings.map((f) => (
              <p key={f.id}>{FINANCING_SOURCE_LABEL[f.source]}{f.donor ? ` — ${f.donor.name}` : ""}{f.project ? ` — Projet : ${f.project.name}` : ""}</p>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Risques */}
      <Card>
        <CardHeader><CardTitle>Risques</CardTitle></CardHeader>
        <CardBody className="space-y-1.5 text-sm text-ink-muted">
          {market.corrections.length > 0 && <p>⚠ Ce marché a été rectifié {market.corrections.length} fois — vérifiez la dernière version avant de soumissionner.</p>}
          {market.appeals.length > 0 && <p>⚠ {market.appeals.length} recours enregistré(s) sur ce marché.</p>}
          {market.corrections.length === 0 && market.appeals.length === 0 && <p>Aucun signal de risque particulier détecté à ce stade.</p>}
        </CardBody>
      </Card>

      {/* Événements et rectifications */}
      <Card>
        <CardHeader><CardTitle>Événements et rectifications</CardTitle></CardHeader>
        <CardBody>
          {market.events.length === 0 ? (
            <StateNotice kind="empty" title="Aucun événement enregistré" />
          ) : (
            <ol className="space-y-3 border-l border-line pl-4">
              {market.events.map((e) => (
                <li key={e.id} className="relative text-sm">
                  <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-brand" />
                  <p className="font-medium text-ink">{eventLabel(e.type)}</p>
                  <p className="text-xs text-ink-faint">{formatDateTime(e.occurredAt)}{e.description ? ` — ${e.description}` : ""}</p>
                </li>
              ))}
            </ol>
          )}
          {market.corrections.map((c) => (
            <div key={c.id} className="mt-3 rounded-md bg-warning-soft p-3 text-xs text-ink">
              <p className="font-medium">Rectification — {c.fieldChanged}</p>
              <p className="mt-1 text-ink-muted">Avant : {c.beforeValue} → Après : {c.afterValue}</p>
              {c.consequence && <p className="mt-1 text-ink-muted">Conséquence : {c.consequence}</p>}
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Document officiel + source */}
      <Card>
        <CardHeader><CardTitle>Document officiel</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          {market.notices.length === 0 ? (
            <StateNotice kind="not-available" title="Document source non disponible" />
          ) : (
            market.notices.map((n) => (
              <div key={n.id} className="flex items-center justify-between rounded-md border border-line p-2.5 text-sm">
                <span>{PUBLICATION_TYPE_LABEL[n.publicationType]} — {formatDate(n.publishedAt)}</span>
                <SourceTag numero={n.publication.numero} page={n.pageNumber} documentId={n.documentId} publishedAt={n.publishedAt} />
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function CalRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-ink-faint">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}

function eventLabel(type: string) {
  const map: Record<string, string> = {
    MARKET_CREATED: "Publication de l'avis initial",
    MARKET_UPDATED: "Mise à jour du marché",
    MARKET_CORRECTED: "Rectificatif publié",
    MARKET_CANCELLED: "Marché annulé",
    MARKET_REPUBLISHED: "Marché repris",
    MARKET_EXTENDED: "Délai prolongé",
    BID_SUBMITTED: "Offres déposées",
    BID_EVALUATED: "Évaluation des offres",
    RESULT_PUBLISHED: "Résultat publié",
    RESULT_CORRECTED: "Résultat rectifié",
    APPEAL_FILED: "Recours déposé",
    APPEAL_DECIDED: "Décision sur recours",
    REVIEW_REQUESTED: "Réexamen demandé",
    REVIEW_COMPLETED: "Réexamen achevé",
    AWARD_PUBLISHED: "Attribution publiée",
  };
  return map[type] ?? type;
}
