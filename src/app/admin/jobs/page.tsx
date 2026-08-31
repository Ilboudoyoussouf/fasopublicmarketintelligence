import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { StateNotice } from "@/components/ui/StateNotice";
import { formatDateTime } from "@/lib/utils";

export default async function AdminJobsPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const sp = await searchParams;
  const jobs = await prisma.extractionJob.findMany({
    where: sp.statut ? { status: sp.statut as never } : undefined,
    include: { document: { include: { publication: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const counts = await prisma.extractionJob.groupBy({ by: ["status"], _count: { _all: true } });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Jobs d&apos;extraction</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {counts.map((c) => <Badge key={c.status} tone={c.status === "FAILED" ? "critical" : c.status === "SUCCEEDED" ? "success" : "neutral"}>{c.status} ({c._count._all})</Badge>)}
        </div>
      </div>

      {jobs.length === 0 ? <StateNotice kind="empty" title="Aucun job" /> : (
        <div className="overflow-x-auto rounded-lg border border-line bg-paper">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-line text-left text-xs text-ink-faint">
              <th className="p-2.5">Document</th><th className="p-2.5">Étape</th><th className="p-2.5">Statut</th><th className="p-2.5">Tentatives</th><th className="p-2.5">Terminé</th>
            </tr></thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-b border-line last:border-0">
                  <td className="p-2.5 text-xs text-ink">{j.document.filename} (n°{j.document.publication.numero})</td>
                  <td className="p-2.5 text-xs text-ink-muted">{j.stage}</td>
                  <td className="p-2.5"><Badge tone={j.status === "FAILED" ? "critical" : j.status === "SUCCEEDED" ? "success" : "neutral"}>{j.status}</Badge></td>
                  <td className="p-2.5 text-xs text-ink-muted">{j.attempts}</td>
                  <td className="p-2.5 text-xs text-ink-faint">{formatDateTime(j.finishedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
