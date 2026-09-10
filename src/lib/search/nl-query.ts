// Recherche en langage naturel → filtres structurés (sections 27, 88).
// Heuristique déterministe (regex + dictionnaires) : pas d'IA nécessaire
// pour cette étape, ce qui la rend disponible même sans clé API configurée.
import { prisma } from "@/lib/prisma";
import { marketListInclude } from "@/lib/queries/markets";

export type ParsedQuery = {
  amountMin?: number;
  region?: string;
  sectorKeyword?: string;
  organismeKeyword?: string;
  companyKeyword?: string;
  freeText: string;
};

const REGION_NAMES = ["ouagadougou", "bobo-dioulasso", "centre", "hauts-bassins", "centre-est", "sahel"];
const SECTOR_KEYWORDS = ["informatique", "réseau", "btp", "route", "santé", "médical", "agriculture", "audit", "logiciel", "hydraulique", "véhicule"];

export function parseNaturalLanguageQuery(input: string): ParsedQuery {
  const text = input.toLowerCase();
  const result: ParsedQuery = { freeText: input };

  const amountMatch = text.match(/plus de\s+(\d+(?:[.,]\d+)?)\s*(million|millions|m\b)/);
  if (amountMatch) {
    result.amountMin = parseFloat(amountMatch[1].replace(",", ".")) * 1_000_000;
  }

  for (const region of REGION_NAMES) {
    if (text.includes(region)) {
      result.region = region === "ouagadougou" ? "Centre" : region === "bobo-dioulasso" ? "Hauts-Bassins" : region;
      break;
    }
  }

  for (const kw of SECTOR_KEYWORDS) {
    if (text.includes(kw)) {
      result.sectorKeyword = kw;
      break;
    }
  }

  const orgMatch = text.match(/(?:minist[eè]re|commune|epe)\s+(?:de[s]?\s+|d['’])?([a-zàâäéèêëîïôöùûüç\s]+)/);
  if (orgMatch) result.organismeKeyword = orgMatch[0].trim();

  const companyMatch = text.match(/(?:entreprise|soci[ée]t[ée])\s+([a-zàâäéèêëîïôöùûüç0-9\s]+)/);
  if (companyMatch) result.companyKeyword = companyMatch[1].trim();

  return result;
}

export async function runGlobalSearch(query: string) {
  const parsed = parseNaturalLanguageQuery(query);

  const marketWhere = {
    AND: [
      parsed.amountMin ? { amountEstimatedExclTax: { gte: parsed.amountMin } } : {},
      parsed.region ? { region: { name: parsed.region } } : {},
      parsed.sectorKeyword ? { OR: [{ title: { contains: parsed.sectorKeyword } }, { keywords: { array_contains: parsed.sectorKeyword } }, { sector: { name: { contains: parsed.sectorKeyword } } }] } : {},
      parsed.organismeKeyword ? { contractingAuthority: { name: { contains: parsed.organismeKeyword } } } : {},
      !parsed.amountMin && !parsed.region && !parsed.sectorKeyword && !parsed.organismeKeyword
        ? { OR: [{ title: { contains: query } }, { description: { contains: query } }] }
        : {},
    ],
  };

  const [markets, companies, authorities] = await Promise.all([
    prisma.market.findMany({ where: marketWhere, include: marketListInclude, take: 20, orderBy: { publishedAt: "desc" } }),
    parsed.companyKeyword
      ? prisma.company.findMany({ where: { canonicalName: { contains: parsed.companyKeyword } }, take: 10 })
      : prisma.company.findMany({ where: { canonicalName: { contains: query } }, take: 5 }),
    prisma.contractingAuthority.findMany({ where: { name: { contains: query } }, take: 5 }),
  ]);

  return { parsed, markets, companies, authorities };
}
