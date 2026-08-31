import { NextRequest, NextResponse } from "next/server";
import { requireApiTenant } from "@/lib/api/guard";
import { getOpportunities, type OpportunityView } from "@/lib/queries/opportunities";

export async function GET(req: NextRequest) {
  const { ctx, error } = await requireApiTenant();
  if (error) return error;
  const vue = (req.nextUrl.searchParams.get("vue") as OpportunityView) ?? "recommandees";
  const items = await getOpportunities(ctx!.tenant.id, vue);
  return NextResponse.json({ data: items });
}
