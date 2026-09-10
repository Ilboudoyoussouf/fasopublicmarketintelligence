import { prisma } from "@/lib/prisma";
import { MarketStatus, type Prisma, SectorGroup } from "@prisma/client";

export type MarketFilters = {
  q?: string;
  groupe?: SectorGroup;
  sectorId?: string;
  region?: string;
  organisme?: string;
  procedure?: string;
  statut?: MarketStatus;
  montantMin?: number;
  montantMax?: number;
  reserve?: boolean;
  tri?: "recent" | "montant_desc" | "echeance_asc";
};

export function buildMarketWhere(filters: MarketFilters): Prisma.MarketWhereInput {
  const where: Prisma.MarketWhereInput = {};
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q } },
      { reference: { contains: filters.q } },
      { keywords: { array_contains: filters.q.toLowerCase() } },
    ];
  }
  if (filters.groupe) where.sector = { group: filters.groupe };
  if (filters.sectorId) where.sectorId = filters.sectorId;
  if (filters.region) where.region = { name: filters.region };
  if (filters.organisme) where.contractingAuthorityId = filters.organisme;
  if (filters.procedure) where.procedureType = filters.procedure as never;
  if (filters.statut) where.status = filters.statut;
  if (filters.montantMin || filters.montantMax) {
    where.amountEstimatedExclTax = {
      ...(filters.montantMin ? { gte: filters.montantMin } : {}),
      ...(filters.montantMax ? { lte: filters.montantMax } : {}),
    };
  }
  if (filters.reserve) where.reservations = { some: {} };
  return where;
}

export function buildMarketOrderBy(tri?: MarketFilters["tri"]): Prisma.MarketOrderByWithRelationInput {
  if (tri === "montant_desc") return { amountEstimatedExclTax: "desc" };
  if (tri === "echeance_asc") return { submissionDeadline: "asc" };
  return { publishedAt: "desc" };
}

export const marketListInclude = {
  contractingAuthority: true,
  sector: true,
  region: true,
} satisfies Prisma.MarketInclude;

export async function listMarkets(filters: MarketFilters, opts: { take?: number; skip?: number } = {}) {
  const [items, total] = await Promise.all([
    prisma.market.findMany({
      where: buildMarketWhere(filters),
      include: marketListInclude,
      orderBy: buildMarketOrderBy(filters.tri),
      take: opts.take ?? 20,
      skip: opts.skip ?? 0,
    }),
    prisma.market.count({ where: buildMarketWhere(filters) }),
  ]);
  return { items, total };
}
