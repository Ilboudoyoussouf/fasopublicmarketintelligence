import { NextRequest, NextResponse } from "next/server";
import { requireApiTenant } from "@/lib/api/guard";
import { prisma } from "@/lib/prisma";
import { computeScoresForTenant } from "@/lib/scoring/engine";
import { z } from "zod";

const schema = z.object({
  size: z.string().optional(),
  regionName: z.string().optional(),
  revenueBand: z.string().optional(),
  experienceYears: z.number().optional(),
  targetCategories: z.array(z.string()).optional(),
});

export async function GET() {
  const { ctx, error } = await requireApiTenant();
  if (error) return error;
  return NextResponse.json({ data: ctx!.tenant });
}

export async function POST(req: NextRequest) {
  const { ctx, error } = await requireApiTenant();
  if (error) return error;

  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "invalid_body", issues: body.error.issues }, { status: 400 });

  const tenant = await prisma.tenant.update({ where: { id: ctx!.tenant.id }, data: body.data });
  await computeScoresForTenant(tenant.id);

  return NextResponse.json({ data: tenant });
}
