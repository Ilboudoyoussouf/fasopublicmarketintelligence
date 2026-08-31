import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { activateScoreConfigAction } from "@/app/admin/actions";
import { formatDate } from "@/lib/utils";

export default async function AdminScoringPage() {
  const configs = await prisma.scoreConfig.findMany({ orderBy: { effectiveFrom: "desc" } });
  const active = configs.find((c) => c.isActive) ?? configs[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Scoring</h1>
        <p className="text-sm text-ink-muted">Poids et seuils du moteur de score — versionnés et auditables (section 73).</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Créer / activer une version</CardTitle></CardHeader>
        <CardBody>
          <form action={activateScoreConfigAction} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted">Version</label>
              <input name="version" required placeholder="ex. 1.1" className="input w-40" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted">Pondérations (JSON)</label>
              <textarea name="weights" rows={10} defaultValue={JSON.stringify(active?.weights ?? {}, null, 2)} className="input font-mono text-xs" />
            </div>
            <button type="submit" className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white">Activer cette version</button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Historique des versions</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          {configs.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-sm">
              <span className="text-ink">Version {c.version} — depuis le {formatDate(c.effectiveFrom)}</span>
              {c.isActive && <Badge tone="success">Active</Badge>}
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
