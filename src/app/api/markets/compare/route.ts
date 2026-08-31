import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantContextOrNull } from "@/lib/session";

export async function GET(req: NextRequest) {
  const ctx = await getTenantContextOrNull();
  if (!ctx) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const { tenant } = ctx;
  const ids = (req.nextUrl.searchParams.get("ids") ?? "").split(",").filter(Boolean).slice(0, 4);
  if (ids.length === 0) return NextResponse.json({ markets: [], scores: [] });

  const [markets, scores] = await Promise.all([
    prisma.market.findMany({ where: { id: { in: ids } }, include: { contractingAuthority: true, sector: true, requirements: true, reservations: true } }),
    prisma.score.findMany({ where: { tenantId: tenant.id, marketId: { in: ids } } }),
  ]);

  return NextResponse.json({ markets, scores });
}
