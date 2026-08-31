import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StateNotice } from "@/components/ui/StateNotice";
import { formatFcfa, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const VIEWS = { recents: "Résultats récents", rectifies: "Rectifiés", reexamens: "Réexamens", recours: "Recours" } as const;
type View = keyof typeof VIEWS;

export default async function ResultatsPage({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const sp = await searchParams;
  const vue = (sp.vue as View) ?? "recents";

  const results = vue === "rectifies"
    ? await prisma.result.findMany({ where: { isCorrected: true }, include: { market: { include: { contractingAuthority: true } }, winnerCompany: true }, orderBy: { resultAt: "desc" }, take: 30 })
    : await prisma.result.findMany({ include: { market: { include: { contractingAuthority: true } }, winnerCompany: true }, orderBy: { resultAt: "desc" }, take: 30 });

  const reviews = vue === "reexamens" ? await prisma.review.findMany({ include: { market: true }, orderBy: { requestedAt: "desc" } }) : [];
  const appeals = vue === "recours" ? await prisma.appeal.findMany({ include: { market: true, requesterCompany: true, decisions: true }, orderBy: { filedAt: "desc" } }) : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Résultats</h1>
        <p className="text-sm text-ink-muted">Résultats provisoires, définitifs, rectifiés, réexamens et recours.</p>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-line pb-3">
        {(Object.keys(VIEWS) as View[]).map((v) => (
          <Link key={v} href={`/resultats?vue=${v}`} className={cn("rounded-full px-3 py-1.5 text-xs font-medium", v === vue ? "bg-brand text-white" : "bg-paper-sunken text-ink-muted hover:text-ink")}>
            {VIEWS[v]}
          </Link>
        ))}
      </div>

      {vue === "reexamens" ? (
        reviews.length === 0 ? <StateNotice kind="empty" title="Aucun réexamen enregistré" /> : (
          <div className="space-y-2">
            {reviews.map((r) => (
              <Card key={r.id}><CardBody>
                <Link href={`/marches/${r.marketId}`} className="text-sm font-medium text-ink hover:text-brand">{r.market.title}</Link>
                <p className="mt-1 text-xs text-ink-muted">Demandé le {formatDate(r.requestedAt)} · {r.outcome ?? "en cours"}</p>
              </CardBody></Card>
            ))}
          </div>
        )
      ) : vue === "recours" ? (
        appeals.length === 0 ? <StateNotice kind="empty" title="Aucun recours enregistré" /> : (
          <div className="space-y-2">
            {appeals.map((a) => (
              <Card key={a.id}><CardBody>
                <Link href={`/marches/${a.marketId}`} className="text-sm font-medium text-ink hover:text-brand">{a.market.title}</Link>
                <p className="mt-1 text-xs text-ink-muted">{a.object} — requérant : {a.requesterCompany?.canonicalName ?? "—"} · déposé le {formatDate(a.filedAt)}</p>
                {a.decisions.map((d) => <p key={d.id} className="mt-1 text-xs text-ink">Décision : {d.decision}</p>)}
              </CardBody></Card>
            ))}
          </div>
        )
      ) : results.length === 0 ? (
        <StateNotice kind="empty" title="Aucun résultat disponible" />
      ) : (
        <div className="space-y-2">
          {results.map((r) => (
            <Link key={r.id} href={`/resultats/${r.id}`} className="block rounded-lg border border-line bg-paper p-3.5 hover:border-brand">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">{r.market.title}</p>
                  <p className="text-xs text-ink-muted">{r.market.contractingAuthority.name} · {r.numberOfBids ?? "?"} pli(s)</p>
                </div>
                <div className="text-right">
                  {r.isCorrected && <Badge tone="warning">Rectifié</Badge>}
                  <p className="mt-1 text-sm font-semibold text-ink">{formatFcfa(r.awardedAmount?.toString())}</p>
                  {r.winnerCompany && <p className="text-[11px] text-success">{r.winnerCompany.canonicalName}</p>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
