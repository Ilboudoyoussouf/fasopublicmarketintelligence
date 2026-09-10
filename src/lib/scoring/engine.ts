// Moteur de scoring & matching — sections 18, 19, 73 du cahier des charges.
// Le score est versionné (ScoreConfig), pondéré et toujours explicable :
// chaque score est accompagné des facteurs qui l'ont produit.
import { prisma } from "@/lib/prisma";
import { MarketStatus, MatchVerdict, RequirementType, type Prisma } from "@prisma/client";

const OPEN_STATUSES: MarketStatus[] = [
  MarketStatus.PUBLIE,
  MarketStatus.RECTIFIE,
  MarketStatus.REPRIS,
  MarketStatus.EN_EVALUATION,
];

type Weights = {
  pertinence: { secteur: number; objet: number; localisation: number; calendrier: number };
  eligibilite: { agrement: number; experience: number; capacite: number; documents: number; autres: number };
  attractivite: { montant: number; concurrence: number; delai: number; historique: number; risque: number };
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function overlapScore(a: string[], b: string[]) {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b.map(normalize));
  const hits = a.filter((x) => setB.has(normalize(x))).length;
  return Math.round((hits / a.length) * 100);
}

export async function getActiveScoreConfig() {
  const config = await prisma.scoreConfig.findFirst({ where: { isActive: true }, orderBy: { effectiveFrom: "desc" } });
  if (!config) throw new Error("Aucune configuration de scoring active (voir /admin/scoring).");
  return config;
}

async function loadTenantProfile(tenantId: string) {
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    include: {
      sectors: { include: { sector: true } },
      licenses: true,
      zones: true,
      documents: true,
      references: true,
    },
  });
  return tenant;
}

type TenantProfile = Awaited<ReturnType<typeof loadTenantProfile>>;

function scorePertinence(market: MarketForScoring, tenant: TenantProfile, w: Weights["pertinence"]) {
  const factors: Record<string, string> = {};

  const tenantSectorIds = new Set(tenant.sectors.map((s) => s.sectorId));
  let secteur = 20;
  if (market.sectorId && tenantSectorIds.has(market.sectorId)) {
    secteur = 100;
    factors.secteur = "Correspondance directe avec un secteur suivi";
  } else if (market.sector && tenant.sectors.some((s) => s.sector.group === market.sector!.group)) {
    secteur = 55;
    factors.secteur = "Même famille de secteur (" + market.sector.group + ")";
  } else {
    factors.secteur = "Aucune correspondance de secteur";
  }

  const objet = overlapScore(
    asStringArray(tenant.targetCategories),
    [market.title, market.description ?? "", ...asStringArray(market.keywords)].join(" ").split(/\s+/),
  );
  factors.objet = `${objet}% de correspondance mots-clés / objet`;

  let localisation = 60;
  if (tenant.zones.length > 0) {
    const zoneNames = tenant.zones.map((z) => normalize(z.regionName));
    localisation = market.region && zoneNames.includes(normalize(market.region.name)) ? 100 : 25;
  }
  factors.localisation = tenant.zones.length > 0 ? (localisation === 100 ? "Dans une zone d'intervention suivie" : "Hors zones d'intervention déclarées") : "Aucune zone déclarée — national par défaut";

  let calendrier = 50;
  if (market.submissionDeadline) {
    const days = Math.ceil((market.submissionDeadline.getTime() - Date.now()) / 86_400_000);
    calendrier = days < 0 ? 0 : days < 3 ? 30 : days < 7 ? 65 : 100;
    factors.calendrier = days < 0 ? "Échéance dépassée" : `${days} jour(s) avant l'échéance`;
  } else {
    factors.calendrier = "Échéance non renseignée";
  }

  const score = secteur * w.secteur + objet * w.objet + localisation * w.localisation + calendrier * w.calendrier;
  return { score, factors };
}

function scoreEligibilite(market: MarketForScoring, tenant: TenantProfile, w: Weights["eligibilite"]) {
  const factors: Record<string, string> = {};

  const needsAgrement = market.requirements.some((r) => r.type === RequirementType.AGREMENT);
  const hasValidLicense = tenant.licenses.some((l) => !l.expirationDate || l.expirationDate > new Date());
  const agrement = !needsAgrement ? 100 : hasValidLicense ? 100 : 35;
  factors.agrement = !needsAgrement ? "Aucun agrément exigé" : hasValidLicense ? "Agrément valide dans votre profil" : "Agrément requis manquant ou expiré — à vérifier";

  const needsExperience = market.requirements.some((r) => r.type === RequirementType.EXPERIENCE_GENERALE || r.type === RequirementType.EXPERIENCE_SPECIFIQUE);
  const years = tenant.experienceYears ?? 0;
  const experience = !needsExperience ? 100 : years >= 5 ? 100 : years >= 2 ? 65 : 30;
  factors.experience = !needsExperience ? "Aucune expérience minimale exigée" : `${years} an(s) d'expérience déclarés`;

  const needsCa = market.requirements.some((r) => r.type === RequirementType.CHIFFRE_AFFAIRES);
  const capacite = !needsCa ? 100 : tenant.revenueBand ? 75 : 45;
  factors.capacite = !needsCa ? "Aucun seuil de chiffre d'affaires exigé" : tenant.revenueBand ? "Chiffre d'affaires renseigné — à confronter au seuil exact" : "Chiffre d'affaires non renseigné dans le profil";

  const requiredDocTypes = new Set(market.requiredDocuments.map((d) => d.docType));
  let documents = 70;
  if (requiredDocTypes.size > 0) {
    const validTypes = new Set(tenant.documents.filter((d) => d.status === "VALID").map((d) => d.docType));
    const covered = [...requiredDocTypes].filter((t) => validTypes.has(t)).length;
    documents = Math.round((covered / requiredDocTypes.size) * 100);
  }
  factors.documents = requiredDocTypes.size > 0 ? `${documents}% des pièces requises disponibles et valides` : "Liste des pièces requises non encore extraite";

  const reservedPme = market.reservations.some((r) => r.category === "PME");
  const isPme = (tenant.size ?? "").toLowerCase().includes("pme");
  const autres = !reservedPme ? 80 : isPme ? 100 : 0;
  factors.autres = reservedPme ? (isPme ? "Marché réservé PME — profil éligible" : "Marché réservé PME — profil non déclaré PME") : "Pas de condition de réservation particulière";

  const score = agrement * w.agrement + experience * w.experience + capacite * w.capacite + documents * w.documents + autres * w.autres;
  return { score, factors, blocked: reservedPme && !isPme };
}

function scoreAttractivite(market: MarketForScoring, tenant: TenantProfile, w: Weights["attractivite"]) {
  const factors: Record<string, string> = {};

  const amount = Number(market.amountEstimatedExclTax ?? 0);
  const montant = amount <= 0 ? 50 : amount < 3_000_000 ? 40 : amount < 250_000_000 ? 85 : 65;
  factors.montant = amount > 0 ? `Montant estimé ${Math.round(amount).toLocaleString("fr-FR")} FCFA` : "Montant non communiqué";

  const concurrence = 70; // sans historique de dépôt suffisant, valeur neutre documentée
  factors.concurrence = "Estimation neutre — historique de participants insuffisant pour ce secteur";

  const delai = market.executionDelayDays ? (market.executionDelayDays <= 180 ? 85 : 60) : 70;
  factors.delai = market.executionDelayDays ? `${market.executionDelayDays} jours d'exécution prévus` : "Délai d'exécution non communiqué";

  const relevantRefs = tenant.references.length;
  const historique = Math.min(60 + relevantRefs * 15, 100);
  factors.historique = `${relevantRefs} référence(s) déclarée(s) dans votre profil`;

  const risque = market.status === MarketStatus.RECTIFIE ? 55 : 80;
  factors.risque = market.status === MarketStatus.RECTIFIE ? "Marché déjà rectifié — suivre les évolutions" : "Aucun signal de risque particulier détecté";

  const score = montant * w.montant + concurrence * w.concurrence + delai * w.delai + historique * w.historique + risque * w.risque;
  return { score, factors };
}

function verdictFromEligibilite(eligibilite: number, blocked: boolean): MatchVerdict {
  if (blocked) return MatchVerdict.INCOMPATIBLE;
  if (eligibilite >= 75) return MatchVerdict.COMPATIBLE;
  if (eligibilite >= 50) return MatchVerdict.PROBABLEMENT_COMPATIBLE;
  if (eligibilite >= 30) return MatchVerdict.A_VERIFIER;
  return MatchVerdict.INCOMPATIBLE;
}

const marketInclude = {
  sector: true,
  region: true,
  requirements: true,
  requiredDocuments: true,
  reservations: true,
} satisfies Prisma.MarketInclude;

type MarketForScoring = Prisma.MarketGetPayload<{ include: typeof marketInclude }>;

export async function computeScoresForTenant(tenantId: string, opts: { marketIds?: string[]; topRecommendations?: number } = {}) {
  const config = await getActiveScoreConfig();
  const weights = config.weights as unknown as Weights;
  const tenant = await loadTenantProfile(tenantId);

  const markets = await prisma.market.findMany({
    where: {
      status: { in: OPEN_STATUSES },
      ...(opts.marketIds ? { id: { in: opts.marketIds } } : {}),
    },
    include: marketInclude,
  });

  const results: { marketId: string; global: number }[] = [];

  for (const market of markets) {
    const p = scorePertinence(market, tenant, weights.pertinence);
    const e = scoreEligibilite(market, tenant, weights.eligibilite);
    const a = scoreAttractivite(market, tenant, weights.attractivite);
    const global = Math.round(p.score * 0.4 + e.score * 0.35 + a.score * 0.25);

    await prisma.score.upsert({
      where: { tenantId_marketId_scoreVersion: { tenantId, marketId: market.id, scoreVersion: config.version } },
      update: { pertinence: p.score, eligibilite: e.score, attractivite: a.score, global, factors: { ...p.factors, ...e.factors, ...a.factors } },
      create: {
        tenantId, marketId: market.id, scoreVersion: config.version,
        pertinence: p.score, eligibilite: e.score, attractivite: a.score, global,
        factors: { ...p.factors, ...e.factors, ...a.factors },
      },
    });

    const verdict = verdictFromEligibilite(e.score, e.blocked);
    await prisma.matchResult.upsert({
      where: { tenantId_marketId: { tenantId, marketId: market.id } },
      update: { verdict, reasons: { pertinence: p.score, eligibilite: e.score, attractivite: a.score } },
      create: { tenantId, marketId: market.id, verdict, reasons: { pertinence: p.score, eligibilite: e.score, attractivite: a.score } },
    });

    results.push({ marketId: market.id, global });
  }

  results.sort((x, y) => y.global - x.global);
  const top = results.slice(0, opts.topRecommendations ?? 5);
  await prisma.recommendation.deleteMany({ where: { tenantId } });
  for (const [idx, r] of top.entries()) {
    await prisma.recommendation.create({
      data: { tenantId, marketId: r.marketId, rank: idx + 1, reason: { global: r.global } },
    });
  }

  return results;
}
