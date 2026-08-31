import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api/guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireApiSession();
  if (error) return error;

  const [marketCount, resultCount, companyCount, totalValue] = await Promise.all([
    prisma.market.count(),
    prisma.result.count(),
    prisma.company.count(),
    prisma.market.aggregate({ _sum: { amountEstimatedExclTax: true } }),
  ]);

  return NextResponse.json({
    data: {
      marketCount,
      resultCount,
      companyCount,
      totalEstimatedValue: totalValue._sum.amountEstimatedExclTax,
      updatedAt: new Date().toISOString(),
    },
  });
}
