import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api/guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireApiSession();
  if (error) return error;
  const type = req.nextUrl.searchParams.get("type");
  const authorities = await prisma.contractingAuthority.findMany({
    where: type ? { type: type as never } : undefined,
    include: { _count: { select: { markets: true } } },
    orderBy: { name: "asc" },
    take: 100,
  });
  return NextResponse.json({ data: authorities });
}
