import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { StateNotice } from "@/components/ui/StateNotice";
import { cn } from "@/lib/utils";

const VIEWS = { toutes: "Toutes", attributaires: "Attributaires", concurrents: "Concurrents fréquents", emergentes: "Émergentes" } as const;
type View = keyof typeof VIEWS;

export default async function EntreprisesPage({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const sp = await searchParams;
  const vue = (sp.vue as View) ?? "toutes";

  const participations = await prisma.companyParticipation.groupBy({
    by: ["companyId"],
    _count: { _all: true },
    orderBy: { _count: { companyId: "desc" } },
    take: 50,
  });
  const wins = await prisma.companyParticipation.groupBy({ by: ["companyId"], where: { role: "WINNER" }, _count: { _all: true } });
  const winsByCompany = new Map(wins.map((w) => [w.companyId, w._count._all]));

  const companyIds = participations.map((p) => p.companyId);
  const companies = await prisma.company.findMany({ where: { id: { in: companyIds } } });
  const companyById = new Map(companies.map((c) => [c.id, c]));

  let rows = participations.map((p) => ({
    company: companyById.get(p.companyId),
    participations: p._count._all,
    wins: winsByCompany.get(p.companyId) ?? 0,
  })).filter((r) => r.company);

  if (vue === "attributaires") rows = rows.filter((r) => r.wins > 0);
  if (vue === "concurrents") rows = rows.filter((r) => r.participations >= 2);
  if (vue === "emergentes") rows = rows.filter((r) => r.participations <= 1);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Entreprises</h1>
        <p className="text-sm text-ink-muted">Fiches publiques construites à partir des publications officielles.</p>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-line pb-3">
        {(Object.keys(VIEWS) as View[]).map((v) => (
          <Link key={v} href={`/entreprises?vue=${v}`} className={cn("rounded-full px-3 py-1.5 text-xs font-medium", v === vue ? "bg-brand text-white" : "bg-paper-sunken text-ink-muted hover:text-ink")}>
            {VIEWS[v]}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? <StateNotice kind="empty" title="Aucune entreprise dans cette vue" /> : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {rows.map((r) => (
            <Link key={r.company!.id} href={`/entreprises/${r.company!.id}`}>
              <Card><CardBody>
                <p className="text-sm font-medium text-ink">{r.company!.canonicalName}</p>
                <p className="mt-1 text-xs text-ink-muted">{r.participations} participation(s) · {r.wins} marché(s) gagné(s) · {r.company!.regionName ?? "—"}</p>
              </CardBody></Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
