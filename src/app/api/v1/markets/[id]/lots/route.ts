import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api/guard";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiSession();
  if (error) return error;
  const { id } = await params;
  const lots = await prisma.marketLot.findMany({ where: { marketId: id }, include: { attributaire: true } });
  return NextResponse.json({ data: lots });
}
