import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api/guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireApiSession();
  if (error) return error;
  const plans = await prisma.ppmPlan.findMany({ include: { contractingAuthority: true, items: true }, orderBy: { exercice: "desc" } });
  return NextResponse.json({ data: plans });
}
