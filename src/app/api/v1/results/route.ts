import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api/guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireApiSession();
  if (error) return error;
  const take = Math.min(Number(req.nextUrl.searchParams.get("pageSize") ?? "20"), 100);
  const results = await prisma.result.findMany({
    include: { market: { include: { contractingAuthority: true } }, winnerCompany: true },
    orderBy: { resultAt: "desc" },
    take,
  });
  return NextResponse.json({ data: results });
}
