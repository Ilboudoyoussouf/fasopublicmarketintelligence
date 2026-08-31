import { prisma } from "@/lib/prisma";
import { SECTOR_GROUP_LABEL, REJECTION_REASON_LABEL, FINANCING_SOURCE_LABEL } from "@/lib/labels";

async function monthlySeries() {
  const markets = await prisma.market.findMany({ select: { publishedAt: true, amountEstimatedExclTax: true } });
  const byMonth = new Map<string, { count: number; value: number }>();
  for (const m of markets) {
    if (!m.publishedAt) continue;
    const key = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(m.publishedAt);
    const prev = byMonth.get(key) ?? { count: 0, value: 0 };
    byMonth.set(key, { count: prev.count + 1, value: prev.value + Number(m.amountEstimatedExclTax ?? 0) });
  }
  return [...byMonth.entries()].map(([mois, v]) => ({ mois, nombre: v.count, valeur: Math.round(v.value / 1_000_000) }));
}

export async function getVolumesData() {
  const [total, byStatus, series] = await Promise.all([
    prisma.market.count(),
    prisma.market.groupBy({ by: ["status"], _count: { _all: true } }),
    monthlySeries(),
  ]);
  return { total, byStatus: byStatus.map((s) => ({ name: s.status, count: s._count._all })), series };
}

export async function getMontantsData() {
  const agg = await prisma.market.aggregate({ _sum: { amountEstimatedExclTax: true }, _avg: { amountEstimatedExclTax: true }, _count: { _all: true } });
  const series = await monthlySeries();
  const byGroup = await prisma.market.groupBy({ by: ["sectorId"], _sum: { amountEstimatedExclTax: true }, where: { sectorId: { not: null } } });
  const sectors = await prisma.sector.findMany({ where: { id: { in: byGroup.map((b) => b.sectorId!) } } });
  const sectorById = new Map(sectors.map((s) => [s.id, s.name]));
  return {
    total: Number(agg._sum.amountEstimatedExclTax ?? 0),
    average: Number(agg._avg.amountEstimatedExclTax ?? 0),
    count: agg._count._all,
    series,
    byGroup: byGroup.map((b) => ({ name: sectorById.get(b.sectorId!) ?? "—", size: Number(b._sum.amountEstimatedExclTax ?? 0) })),
  };
}

export async function getSecteursData() {
  const groups = await prisma.market.groupBy({ by: ["sectorId"], _count: { _all: true }, where: { sectorId: { not: null } } });
  const sectors = await prisma.sector.findMany({ where: { id: { in: groups.map((g) => g.sectorId!) } } });
  const sectorById = new Map(sectors.map((s) => [s.id, s]));
  const byGroupLabel = new Map<string, number>();
  for (const g of groups) {
    const sector = sectorById.get(g.sectorId!);
    if (!sector) continue;
    byGroupLabel.set(SECTOR_GROUP_LABEL[sector.group], (byGroupLabel.get(SECTOR_GROUP_LABEL[sector.group]) ?? 0) + g._count._all);
  }
  return {
    bySector: groups.map((g) => ({ name: sectorById.get(g.sectorId!)?.name ?? "—", count: g._count._all })).sort((a, b) => b.count - a.count).slice(0, 10),
    byGroup: [...byGroupLabel.entries()].map(([name, value]) => ({ name, value })),
  };
}

export async function getGeographieData() {
  const groups = await prisma.market.groupBy({ by: ["regionId"], _count: { _all: true }, _sum: { amountEstimatedExclTax: true }, where: { regionId: { not: null } } });
  const regions = await prisma.region.findMany({ where: { id: { in: groups.map((g) => g.regionId!) } } });
  const regionById = new Map(regions.map((r) => [r.id, r.name]));
  return groups.map((g) => ({ name: regionById.get(g.regionId!) ?? "—", count: g._count._all, valeur: Math.round(Number(g._sum.amountEstimatedExclTax ?? 0) / 1_000_000) }));
}

export async function getOrganismesData() {
  const groups = await prisma.market.groupBy({ by: ["contractingAuthorityId"], _count: { _all: true }, _sum: { amountEstimatedExclTax: true }, orderBy: { _count: { contractingAuthorityId: "desc" } }, take: 10 });
  const authorities = await prisma.contractingAuthority.findMany({ where: { id: { in: groups.map((g) => g.contractingAuthorityId) } } });
  const byId = new Map(authorities.map((a) => [a.id, a.name]));
  return groups.map((g) => ({ name: byId.get(g.contractingAuthorityId) ?? "—", count: g._count._all, valeur: Math.round(Number(g._sum.amountEstimatedExclTax ?? 0) / 1_000_000) }));
}

export async function getEntreprisesData() {
  const groups = await prisma.companyParticipation.groupBy({ by: ["companyId"], _count: { _all: true }, orderBy: { _count: { companyId: "desc" } }, take: 10 });
  const companies = await prisma.company.findMany({ where: { id: { in: groups.map((g) => g.companyId) } } });
  const byId = new Map(companies.map((c) => [c.id, c.canonicalName]));
  return groups.map((g) => ({ name: byId.get(g.companyId) ?? "—", count: g._count._all }));
}

export async function getConcurrenceData() {
  const wins = await prisma.companyParticipation.groupBy({ by: ["companyId"], where: { role: "WINNER" }, _count: { _all: true }, _sum: { amount: true }, orderBy: { _count: { companyId: "desc" } }, take: 10 });
  const companies = await prisma.company.findMany({ where: { id: { in: wins.map((w) => w.companyId) } } });
  const byId = new Map(companies.map((c) => [c.id, c.canonicalName]));
  return wins.map((w) => ({ name: byId.get(w.companyId) ?? "—", victoires: w._count._all, montant: Math.round(Number(w._sum.amount ?? 0) / 1_000_000) }));
}

export async function getPrixData() {
  const results = await prisma.result.findMany({ where: { awardedAmount: { not: null } }, include: { market: true } });
  const points = results.filter((r) => r.market.amountEstimatedExclTax).map((r) => ({
    estimation: Math.round(Number(r.market.amountEstimatedExclTax) / 1_000_000),
    attribue: Math.round(Number(r.awardedAmount) / 1_000_000),
  }));
  const amounts = results.map((r) => Number(r.awardedAmount)).sort((a, b) => a - b);
  const mean = amounts.length ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
  const median = amounts.length ? amounts[Math.floor(amounts.length / 2)] : 0;
  return { points, stats: { mean, median, min: amounts[0] ?? 0, max: amounts[amounts.length - 1] ?? 0, count: amounts.length } };
}

export async function getReussiteData() {
  const participations = await prisma.companyParticipation.groupBy({ by: ["companyId"], _count: { _all: true }, having: { companyId: { _count: { gte: 2 } } }, orderBy: { _count: { companyId: "desc" } }, take: 15 });
  const wins = await prisma.companyParticipation.groupBy({ by: ["companyId"], where: { role: "WINNER" }, _count: { _all: true } });
  const winMap = new Map(wins.map((w) => [w.companyId, w._count._all]));
  const companies = await prisma.company.findMany({ where: { id: { in: participations.map((p) => p.companyId) } } });
  const byId = new Map(companies.map((c) => [c.id, c.canonicalName]));
  return participations.map((p) => ({
    name: byId.get(p.companyId) ?? "—",
    taux: Math.round(((winMap.get(p.companyId) ?? 0) / p._count._all) * 100),
  })).sort((a, b) => b.taux - a.taux);
}

export async function getCausesEchecData() {
  const bids = await prisma.bid.findMany({ where: { conformity: false, rejectionReason: { not: null } } });
  const counts = new Map<string, number>();
  for (const b of bids) {
    if (!b.rejectionReason) continue;
    const label = REJECTION_REASON_LABEL[b.rejectionReason];
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()].map(([name, value]) => ({ name, value }));
}

export async function getFinancementsData() {
  const groups = await prisma.market.groupBy({ by: ["financingSource"], _count: { _all: true }, _sum: { amountEstimatedExclTax: true }, where: { financingSource: { not: null } } });
  return groups.map((g) => ({ name: FINANCING_SOURCE_LABEL[g.financingSource!], count: g._count._all, valeur: Math.round(Number(g._sum.amountEstimatedExclTax ?? 0) / 1_000_000) }));
}

export async function getTemporelleData() {
  return { series: await monthlySeries() };
}
