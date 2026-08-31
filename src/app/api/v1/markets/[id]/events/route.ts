import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api/guard";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiSession();
  if (error) return error;
  const { id } = await params;
  const events = await prisma.marketEvent.findMany({ where: { marketId: id }, orderBy: { occurredAt: "asc" } });
  return NextResponse.json({ data: events });
}
