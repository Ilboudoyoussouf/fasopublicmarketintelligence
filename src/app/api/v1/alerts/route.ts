import { NextResponse } from "next/server";
import { requireApiTenant } from "@/lib/api/guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { ctx, error } = await requireApiTenant();
  if (error) return error;
  const alerts = await prisma.alert.findMany({ where: { tenantId: ctx!.tenant.id }, orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ data: alerts });
}
