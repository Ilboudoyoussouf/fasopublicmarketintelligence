import { NextResponse } from "next/server";
import { requireApiTenant } from "@/lib/api/guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { ctx, error } = await requireApiTenant();
  if (error) return error;
  const recs = await prisma.recommendation.findMany({
    where: { tenantId: ctx!.tenant.id },
    orderBy: { rank: "asc" },
    include: { market: { include: { contractingAuthority: true } } },
  });
  return NextResponse.json({ data: recs });
}
