import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api/guard";
import { listMarkets, type MarketFilters } from "@/lib/queries/markets";

export async function GET(req: NextRequest) {
  const { error } = await requireApiSession();
  if (error) return error;

  const sp = req.nextUrl.searchParams;
  const filters: MarketFilters = {
    q: sp.get("q") ?? undefined,
    region: sp.get("region") ?? undefined,
    organisme: sp.get("organisme") ?? undefined,
    statut: (sp.get("statut") as never) ?? undefined,
    montantMin: sp.get("montantMin") ? Number(sp.get("montantMin")) : undefined,
    montantMax: sp.get("montantMax") ? Number(sp.get("montantMax")) : undefined,
  };
  const page = Number(sp.get("page") ?? "1");
  const pageSize = Math.min(Number(sp.get("pageSize") ?? "20"), 100);

  const { items, total } = await listMarkets(filters, { take: pageSize, skip: (page - 1) * pageSize });
  return NextResponse.json({ data: items, page, pageSize, total });
}
