import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api/guard";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireApiSession();
  if (error) return error;
  const q = req.nextUrl.searchParams.get("q");
  const companies = await prisma.company.findMany({
    where: q ? { canonicalName: { contains: q } } : undefined,
    take: 50,
    orderBy: { canonicalName: "asc" },
  });
  return NextResponse.json({ data: companies });
}
