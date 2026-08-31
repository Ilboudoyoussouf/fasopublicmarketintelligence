import { prisma } from "@/lib/prisma";
import { StateNotice } from "@/components/ui/StateNotice";
import { formatDateTime } from "@/lib/utils";

export default async function AdminAuditPage() {
  const logs = await prisma.auditLog.findMany({ orderBy: { occurredAt: "desc" }, take: 100, include: { actorUser: true, tenant: true } });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-ink">Audit logs</h1>
      {logs.length === 0 ? <StateNotice kind="empty" title="Aucun log" /> : (
        <div className="overflow-x-auto rounded-lg border border-line bg-paper">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-line text-left text-xs text-ink-faint">
              <th className="p-2.5">Date</th><th className="p-2.5">Action</th><th className="p-2.5">Entité</th><th className="p-2.5">Acteur</th><th className="p-2.5">Organisation</th>
            </tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-line last:border-0">
                  <td className="p-2.5 text-xs text-ink-faint">{formatDateTime(l.occurredAt)}</td>
                  <td className="p-2.5 text-xs text-ink">{l.action}</td>
                  <td className="p-2.5 text-xs text-ink-muted">{l.entityType}</td>
                  <td className="p-2.5 text-xs text-ink-muted">{l.actorUser?.fullName ?? "Système"}</td>
                  <td className="p-2.5 text-xs text-ink-muted">{l.tenant?.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
