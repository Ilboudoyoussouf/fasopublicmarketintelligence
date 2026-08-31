import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StateNotice } from "@/components/ui/StateNotice";
import { ORG_TYPE_LABEL } from "@/lib/labels";
import type { OrganizationType } from "@prisma/client";

export default async function OrganismesPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const sp = await searchParams;
  const type = sp.type as OrganizationType | undefined;

  const authorities = await prisma.contractingAuthority.findMany({
    where: type ? { type } : undefined,
    include: { _count: { select: { markets: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Organismes</h1>
        <p className="text-sm text-ink-muted">{authorities.length} organisme(s){type ? ` — ${ORG_TYPE_LABEL[type]}` : ""}</p>
      </div>

      {authorities.length === 0 ? <StateNotice kind="empty" title="Aucun organisme trouvé" /> : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {authorities.map((a) => (
            <Link key={a.id} href={`/organismes/${a.id}`} className="rounded-lg border border-line bg-paper p-3.5 hover:border-brand">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-ink">{a.name}</p>
                <Badge tone="neutral">{ORG_TYPE_LABEL[a.type]}</Badge>
              </div>
              <p className="mt-1 text-xs text-ink-muted">{a._count.markets} marché(s) publié(s) · {a.regionName ?? "—"}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
