import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { createSectorAction } from "@/app/admin/actions";
import { SECTOR_GROUP_LABEL } from "@/lib/labels";

export default async function AdminTaxonomiesPage() {
  const sectors = await prisma.sector.findMany({ orderBy: [{ group: "asc" }, { name: "asc" }], include: { _count: { select: { markets: true } } } });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Taxonomies</h1>
        <p className="text-sm text-ink-muted">Secteurs, sous-secteurs, procédures, statuts, motifs de rejet, types de documents (section 91).</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Ajouter un secteur</CardTitle></CardHeader>
        <CardBody>
          <form action={createSectorAction} className="flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted">Famille</label>
              <select name="group" className="input w-56">
                {Object.entries(SECTOR_GROUP_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-ink-muted">Nom</label>
              <input name="name" required className="input" />
            </div>
            <button type="submit" className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white">Ajouter</button>
          </form>
        </CardBody>
      </Card>

      {(["FOURNITURES_SERVICES", "TRAVAUX", "PRESTATIONS_INTELLECTUELLES"] as const).map((group) => (
        <Card key={group}>
          <CardHeader><CardTitle>{SECTOR_GROUP_LABEL[group]}</CardTitle></CardHeader>
          <CardBody className="flex flex-wrap gap-1.5">
            {sectors.filter((s) => s.group === group).map((s) => (
              <Badge key={s.id} tone="neutral">{s.name} ({s._count.markets})</Badge>
            ))}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
