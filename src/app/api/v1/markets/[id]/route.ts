import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api/guard";
import { getMarketDetail } from "@/lib/queries/market-detail";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiSession();
  if (error) return error;

  const { id } = await params;
  const detail = await getMarketDetail(id);
  if (!detail) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ data: detail.market });
}
