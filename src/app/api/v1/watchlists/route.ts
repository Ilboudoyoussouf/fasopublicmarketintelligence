import { NextRequest, NextResponse } from "next/server";
import { requireApiTenant } from "@/lib/api/guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["MARKET", "ORGANIZATION", "COMPANY", "SECTOR", "PROJECT", "REGION", "KEYWORD"]),
  keyword: z.string().optional(),
  marketId: z.string().optional(),
  companyId: z.string().optional(),
});

export async function GET() {
  const { ctx, error } = await requireApiTenant();
  if (error) return error;
  const watchlists = await prisma.watchlist.findMany({ where: { tenantId: ctx!.tenant.id }, include: { targets: true } });
  return NextResponse.json({ data: watchlists });
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireApiTenant();
  if (error) return error;

  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "invalid_body", issues: body.error.issues }, { status: 400 });

  const watchlist = await prisma.watchlist.create({
    data: { tenantId: ctx!.tenant.id, type: body.data.type, keyword: body.data.keyword },
  });
  if (body.data.marketId || body.data.companyId) {
    await prisma.watchlistTarget.create({ data: { watchlistId: watchlist.id, marketId: body.data.marketId, companyId: body.data.companyId } });
  }
  return NextResponse.json({ data: watchlist }, { status: 201 });
}
