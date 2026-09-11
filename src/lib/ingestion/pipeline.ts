// Orchestrateur du pipeline d'ingestion (section 40, 94) :
// Sources → Crawler → Stockage brut → OCR/extraction → Segmentation →
// Classification → Extraction structurée → Validation → Base transactionnelle.
import { prisma } from "@/lib/prisma";
import { createDgcmefConnector } from "@/lib/ingestion/connectors/dgcmef";
import type { SourceConnector } from "@/lib/ingestion/connector";
import { getRawStorage } from "@/lib/ingestion/storage";
import { extractPdfText } from "@/lib/ingestion/extract-text";
import { segmentAndClassify } from "@/lib/ingestion/parser";
import { extractNoticesWithGemini, extractQuotidienWithGemini, isGeminiConfigured, reviseNotices, type GeminiNotice } from "@/lib/ingestion/gemini-extractor";
import { findMatchingMarket, registerBlockOrDetectDuplicate, jaccardSimilarity } from "@/lib/ingestion/dedupe";
import {
  ExtractionJobStage, ExtractionJobStatus, DataQualityStatus,
  PublicationKind, MarketStatus, ProcedureType, PublicationType,
  RequirementType, RequiredDocType, OrganizationType, SectorGroup,
} from "@prisma/client";

function getConnectorFor(sourceName: string, baseUrl: string): SourceConnector {
  if (sourceName.toUpperCase() === "DGCMEF") return createDgcmefConnector(baseUrl);
  throw new Error(`Aucun connecteur enregistré pour la source « ${sourceName} ».`);
}

const AUTHORITY_TYPE_RULES: [RegExp, OrganizationType][] = [
  [/^minist[èe]re/i, OrganizationType.MINISTERE],
  [/^commune\s+(?:de|d[’'])/i, OrganizationType.COMMUNE],
  [/^r[ée]gion/i, OrganizationType.REGION],
  [/^province/i, OrganizationType.PROVINCE],
  [/projet/i, OrganizationType.PROJET],
];

function guessAuthorityType(name: string): OrganizationType {
  for (const [re, type] of AUTHORITY_TYPE_RULES) if (re.test(name)) return type;
  return OrganizationType.AUTRE;
}

// Le référentiel d'autorités contractantes (section 3, taxonomie) n'est pas
// exhaustif par construction — des centaines d'organismes publient au
// Burkina Faso. Plutôt que d'abandonner silencieusement un marché faute
// d'autorité déjà connue (perte de donnée réelle contraire à la section 94),
// on la crée à la volée à partir du nom extrait tel qu'il apparaît dans le
// quotidien (verbatim, pas de reformatage qui introduirait une supposition).
async function resolveOrCreateAuthority(authorityGuess: string, explicitType?: OrganizationType) {
  const name = authorityGuess.slice(0, 190); // VARCHAR(191)
  const existing = await prisma.contractingAuthority.findFirst({ where: { name: { contains: authorityGuess.slice(0, 30) } } });
  if (existing) return existing;

  const country = await prisma.country.findFirstOrThrow();
  try {
    return await prisma.contractingAuthority.create({ data: { countryId: country.id, name, type: explicitType ?? guessAuthorityType(name) } });
  } catch {
    // Conflit d'unicité (countryId, name) : une création concurrente a eu lieu entre-temps.
    return prisma.contractingAuthority.findFirst({ where: { countryId: country.id, name } });
  }
}

async function resolveOrCreateRegion(regionName: string | null) {
  if (!regionName) return null;
  const name = regionName.slice(0, 190);
  const existing = await prisma.region.findFirst({ where: { name: { contains: name.slice(0, 20) } } });
  if (existing) return existing;
  const country = await prisma.country.findFirstOrThrow();
  try {
    return await prisma.region.create({ data: { countryId: country.id, name } });
  } catch {
    return prisma.region.findFirst({ where: { countryId: country.id, name } });
  }
}

const SECTOR_GROUP_LABELS: Record<SectorGroup, string> = {
  [SectorGroup.FOURNITURES_SERVICES]: "Fournitures et services courants",
  [SectorGroup.TRAVAUX]: "Travaux",
  [SectorGroup.PRESTATIONS_INTELLECTUELLES]: "Prestations intellectuelles",
};

// Gemini ne renseigne que la catégorie large (section "Fournitures et
// Services courants" / "Travaux" / "Prestations Intellectuelles", lue en
// tête de chaque avis) — jamais un sous-secteur précis, qui exigerait une
// taxonomie métier fine hors de portée d'une extraction document par
// document. On rattache donc à un secteur générique par catégorie plutôt
// que d'inventer une classification plus précise que ce que le texte permet
// réellement de déterminer.
async function resolveOrCreateSector(group: SectorGroup | null) {
  if (!group) return null;
  const name = SECTOR_GROUP_LABELS[group];
  const existing = await prisma.sector.findFirst({ where: { group, name } });
  if (existing) return existing;
  try {
    return await prisma.sector.create({ data: { group, name } });
  } catch {
    return prisma.sector.findFirst({ where: { group, name } });
  }
}

async function resolveOrCreateCompany(companyName: string | null) {
  if (!companyName) return null;
  const canonicalName = companyName.slice(0, 190);
  const existing = await prisma.company.findFirst({ where: { canonicalName: { contains: canonicalName.slice(0, 20) } } });
  if (existing) return existing;
  const country = await prisma.country.findFirstOrThrow();
  try {
    return await prisma.company.create({ data: { countryId: country.id, canonicalName } });
  } catch {
    return prisma.company.findFirst({ where: { countryId: country.id, canonicalName } });
  }
}

async function runJob<T>(documentId: string, stage: ExtractionJobStage, fn: () => Promise<T>): Promise<T> {
  const job = await prisma.extractionJob.create({ data: { documentId, stage, status: ExtractionJobStatus.RUNNING, attempts: 1, startedAt: new Date() } });
  try {
    const result = await fn();
    await prisma.extractionJob.update({ where: { id: job.id }, data: { status: ExtractionJobStatus.SUCCEEDED, finishedAt: new Date() } });
    return result;
  } catch (err) {
    await prisma.extractionJob.update({
      where: { id: job.id },
      // Tronqué à la longueur de colonne (VARCHAR(191)) : sans ça, un message
      // d'erreur verbeux (ex. détail de validation Gemini) fait échouer cette
      // écriture elle-même, masquant la vraie cause derrière une erreur Prisma
      // secondaire sans rapport (constaté en pratique).
      data: { status: ExtractionJobStatus.FAILED, finishedAt: new Date(), errorMessage: (err instanceof Error ? err.message : String(err)).slice(0, 190) },
    });
    throw err;
  }
}

/** Découvre et enregistre les nouvelles publications d'une source (idempotent). */
export async function discoverSource(sourceId: string) {
  const source = await prisma.source.findUniqueOrThrow({ where: { id: sourceId } });
  const connector = getConnectorFor(source.name, source.baseUrl);
  const discovered = await connector.discover();

  const createdDocumentIds: string[] = [];

  for (const pub of discovered) {
    const publication = await prisma.publication.upsert({
      where: { sourceId_numero_kind: { sourceId: source.id, numero: pub.numero, kind: PublicationKind.QUOTIDIEN_MARCHES } },
      update: {},
      create: {
        sourceId: source.id,
        kind: PublicationKind.QUOTIDIEN_MARCHES,
        numero: pub.numero,
        isDoubleIssue: pub.isDoubleIssue,
        publishedAt: pub.publishedAt,
        title: pub.title,
      },
    });

    for (const doc of pub.documents) {
      const existing = await prisma.document.findUnique({ where: { url: doc.url } });
      if (existing) continue;
      const created = await prisma.document.create({
        data: {
          publicationId: publication.id,
          filename: doc.filename,
          url: doc.url,
          isPrincipal: doc.isPrincipal,
          isBis: doc.isBis,
          extractionStatus: "PENDING",
        },
      });
      createdDocumentIds.push(created.id);
    }
  }

  await prisma.source.update({ where: { id: source.id }, data: { lastCrawledAt: new Date() } });
  return { publicationsScanned: discovered.length, newDocuments: createdDocumentIds.length, documentIds: createdDocumentIds };
}

// Un résultat provisoire, une attribution, un rectificatif, une annulation,
// une reprise, un réexamen ou une décision de recours ne sont jamais un
// nouvel appel à la concurrence : ce sont des mises à jour d'un marché déjà
// publié (souvent un tableau de résultats, pas un avis). Sans marché
// existant auquel les rattacher (cas fréquent : le marché d'origine a été
// publié dans un quotidien antérieur à ceux déjà ingérés), il ne faut
// jamais en fabriquer un nouveau — cela créerait une fausse opportunité à
// partir d'un contenu qui n'en est pas une.
// Le formalisme des quotidiens DGCMEF varie énormément d'un organisme à
// l'autre (confirmé sur 4 quotidiens réels distincts) : une part du corps
// heuristique (parser.ts) capte correctement les champs présents sans que
// cela garantisse la justesse sémantique du titre (fragments de tableaux de
// résultats mal bornés). Le seuil d'auto-approbation est donc volontairement
// élevé — priorité donnée à « vraies données vérifiables » sur
// l'automatisation : en dessous, la fiche part en validation humaine
// (section 45) plutôt que de s'afficher comme fiable sans l'être.
const AUTO_APPROVE_CONFIDENCE_THRESHOLD = 0.8;

const FRESH_CALL_TYPES = new Set<string>([
  "AVIS_APPEL_OFFRES", "DEMANDE_PRIX", "DEMANDE_COTATION", "APPEL_OFFRES_OUVERT",
  "APPEL_OFFRES_ACCELERE", "MANIFESTATION_INTERET", "DEMANDE_PROPOSITIONS",
]);

const PROCEDURE_MAP: Record<string, ProcedureType> = {
  APPEL_OFFRES_OUVERT: ProcedureType.APPEL_OFFRES_OUVERT,
  APPEL_OFFRES_OUVERT_ACCELERE: ProcedureType.APPEL_OFFRES_OUVERT_ACCELERE,
  DEMANDE_PRIX: ProcedureType.DEMANDE_PRIX,
  DEMANDE_COTATION: ProcedureType.DEMANDE_COTATION,
  MANIFESTATION_INTERET: ProcedureType.MANIFESTATION_INTERET,
  DEMANDE_PROPOSITIONS: ProcedureType.DEMANDE_PROPOSITIONS,
  DEMANDE_PROPOSITIONS_ALLEGEE: ProcedureType.DEMANDE_PROPOSITIONS_ALLEGEE,
};

const AUTHORITY_TYPE_MAP: Record<string, OrganizationType> = {
  MINISTERE: OrganizationType.MINISTERE,
  INSTITUTION: OrganizationType.INSTITUTION,
  EPE: OrganizationType.EPE,
  REGION: OrganizationType.REGION,
  PROVINCE: OrganizationType.PROVINCE,
  COMMUNE: OrganizationType.COMMUNE,
  PROJET: OrganizationType.PROJET,
  AUTRE: OrganizationType.AUTRE,
};

// Statut du marché après un contenu de suivi (résultat/attribution/
// rectificatif/annulation/reprise/réexamen/recours) — dérivé du type de
// publication et, pour un résultat, du texte de décision ("infructueux" =
// aucune offre retenue, jamais un marché "attribué").
function statusAfterFollowUp(publicationType: string, decision: string | null): MarketStatus | null {
  const decisionLower = (decision ?? "").toLowerCase();
  switch (publicationType) {
    case "RESULTAT_PROVISOIRE":
    case "ATTRIBUTION":
      return /infructueux|sans suite|d[ée]clar[ée]e? infructueuse/.test(decisionLower) ? MarketStatus.CLOTURE : MarketStatus.ATTRIBUE;
    case "RECTIFICATIF":
      return MarketStatus.RECTIFIE;
    case "ANNULATION":
      return MarketStatus.ANNULE;
    case "REPRISE":
      return MarketStatus.REPRIS;
    case "REEXAMEN":
      return MarketStatus.EN_REEXAMEN;
    case "DECISION_RECOURS":
      return MarketStatus.EN_RECOURS;
    default:
      return null;
  }
}

async function findMarketForGeminiNotice(notice: GeminiNotice) {
  const candidateRefs = [notice.relatedReference, notice.reference].filter((r): r is string => Boolean(r));
  for (const ref of candidateRefs) {
    const market = await prisma.market.findFirst({ where: { reference: ref } });
    if (market) return market;
  }
  if (!notice.title) return null;

  const recentMarkets = await prisma.market.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 90 * 86_400_000) } },
    select: { id: true, title: true },
    take: 500,
  });
  for (const m of recentMarkets) {
    if (jaccardSimilarity(notice.title, m.title) >= 0.55) {
      return prisma.market.findUnique({ where: { id: m.id } });
    }
  }
  return null;
}

// Enregistre un résultat/attribution sur un marché déjà connu — un par lot
// quand le marché en comporte, sinon un résultat global. Sans ce passage,
// un contenu de suivi ne faisait que journaliser un événement générique
// (MarketEvent) sans jamais renseigner qui a gagné, pour quel montant :
// des champs pourtant demandés ("tous les champs de marché doivent être
// remplis").
async function recordFollowUpResult(market: { id: string }, notice: GeminiNotice, documentId: string, publishedAt: Date) {
  const resultAt = notice.resultAt ?? publishedAt;
  const lotsWithOutcome = notice.lots.filter((l) => l.awardedAmount !== null || l.winnerCompanyName !== null);

  if (lotsWithOutcome.length > 0) {
    for (const lot of lotsWithOutcome) {
      const winner = await resolveOrCreateCompany(lot.winnerCompanyName);
      const marketLot = await prisma.marketLot.findFirst({ where: { marketId: market.id, numero: lot.numero } });
      await prisma.result.create({
        data: {
          marketId: market.id,
          lotId: marketLot?.id,
          winnerCompanyId: winner?.id,
          awardedAmount: lot.awardedAmount,
          decision: notice.decision,
          resultAt,
          sourceDocumentId: documentId,
        },
      });
      if (marketLot && winner) {
        await prisma.marketLot.update({ where: { id: marketLot.id }, data: { attributaireCompanyId: winner.id } });
      }
    }
  } else if (notice.winnerCompanyName || notice.awardedAmount !== null || notice.decision) {
    const winner = await resolveOrCreateCompany(notice.winnerCompanyName);
    await prisma.result.create({
      data: {
        marketId: market.id,
        winnerCompanyId: winner?.id,
        awardedAmount: notice.awardedAmount,
        numberOfBids: notice.numberOfBids,
        decision: notice.decision,
        resultAt,
        sourceDocumentId: documentId,
      },
    });
  }

  const status = statusAfterFollowUp(notice.publicationType, notice.decision);
  if (status) {
    await prisma.market.update({
      where: { id: market.id },
      data: { status, amountAwarded: notice.awardedAmount ?? undefined, resultAt },
    });
  }
}

/** Traite un document déjà découvert : téléchargement → extraction → classification → structuration → validation. */
export async function processDocument(documentId: string) {
  const document = await prisma.document.findUniqueOrThrow({ where: { id: documentId }, include: { publication: { include: { source: true } } } });
  const connector = getConnectorFor(document.publication.source.name, document.publication.source.baseUrl);

  let buffer: Buffer;
  try {
    await runJob(documentId, ExtractionJobStage.DOWNLOAD, async () => {
      buffer = await connector.download({ filename: document.filename, url: document.url, isPrincipal: document.isPrincipal, isBis: document.isBis });
      const stored = await getRawStorage().save(document.filename, buffer);
      await prisma.document.update({ where: { id: documentId }, data: { fileHash: stored.hash, sizeBytes: stored.sizeBytes, downloadedAt: new Date(), extractionStatus: "DOWNLOADED" } });
    });
  } catch {
    // Le document reste PENDING pour une reprise ultérieure — aucune perte silencieuse (section 94).
    return { status: "download_failed" as const };
  }

  return processDocumentBuffer(documentId, buffer!);
}

// Étapes communes à un document déjà téléchargé (via un connecteur, section
// 40, ou via un dépôt manuel, section « import manuel ») : extraction du
// texte → segmentation/classification → structuration → validation. Séparée
// de processDocument() pour être réutilisable par ingestUploadedPdf() sans
// dupliquer la logique de création des marchés (section 94 : jamais deux
// chemins de vérité pour la même donnée).
// Crée les marchés (et enregistre les résultats de suivi) à partir d'une
// extraction Gemini — pendant enrichi de la boucle EXTRACT ci-dessous, mais
// avec les champs supplémentaires que seule une lecture sémantique du PDF
// permet de remplir de façon fiable (secteur, région, financement,
// calendrier complet, lauréat et montant attribué).
async function processGeminiNotices(
  notices: GeminiNotice[],
  document: { id: string; publicationId: string; publication: { publishedAt: Date; numero: string } },
  documentId: string,
) {
  let createdMarkets = 0;
  let updatedMarkets = 0;
  let skippedUnmatchedUpdates = 0;

  for (const notice of notices) {
    if (!notice.title) continue;

    const existingMarket = await findMarketForGeminiNotice(notice);

    if (existingMarket) {
      if (!notice.isFreshCall) {
        await recordFollowUpResult(existingMarket, notice, documentId, document.publication.publishedAt);
      }
      await prisma.marketEvent.create({
        data: {
          marketId: existingMarket.id,
          type: "MARKET_UPDATED",
          occurredAt: document.publication.publishedAt,
          sourceDocumentId: documentId,
          description: `Nouvelle mention détectée dans le quotidien n°${document.publication.numero} (extraction Gemini).`,
        },
      });
      updatedMarkets++;
      continue;
    }

    if (!notice.isFreshCall) {
      skippedUnmatchedUpdates++;
      continue;
    }

    const authority = notice.authorityName
      ? await resolveOrCreateAuthority(notice.authorityName, AUTHORITY_TYPE_MAP[notice.authorityType] ?? OrganizationType.AUTRE)
      : null;
    if (!authority) continue; // aucune autorité identifiable — pas de marché incomplet créé

    const [sector, region] = await Promise.all([
      resolveOrCreateSector(notice.sectorGroup as SectorGroup | null),
      resolveOrCreateRegion(notice.regionName),
    ]);

    const market = await prisma.market.create({
      data: {
        reference: notice.reference,
        title: notice.title,
        publicationType: notice.publicationType as PublicationType,
        procedureType: notice.procedureType ? (PROCEDURE_MAP[notice.procedureType] ?? ProcedureType.AUTRE) : ProcedureType.AUTRE,
        status: MarketStatus.PUBLIE,
        contractingAuthorityId: authority.id,
        sectorId: sector?.id,
        regionId: region?.id,
        siteDetail: notice.siteDetail,
        keywords: notice.keywords,
        financingSource: notice.financingSource ?? undefined,
        financingDetail: notice.financingDetail,
        amountEstimatedExclTax: notice.amountEstimatedExclTax,
        amountEstimatedInclTax: notice.amountEstimatedInclTax,
        currency: notice.currency,
        submissionDeadline: notice.submissionDeadline,
        withdrawalDeadline: notice.withdrawalDeadline,
        submissionTime: notice.submissionTime,
        openingAt: notice.openingAt,
        bidValidityDays: typeof notice.bidValidityDays === "number" ? Math.round(notice.bidValidityDays) : null,
        executionDelayDays: typeof notice.executionDelayDays === "number" ? Math.round(notice.executionDelayDays) : null,
        publishedAt: document.publication.publishedAt,
        sourcePublicationId: document.publicationId,
        sourceDocumentId: documentId,
      },
    });

    await prisma.notice.create({
      data: {
        marketId: market.id, publicationId: document.publicationId, documentId,
        publicationType: market.publicationType, publishedAt: document.publication.publishedAt,
        rawExcerpt: notice.rawExcerpt || null,
      },
    });
    await prisma.marketEvent.create({ data: { marketId: market.id, type: "MARKET_CREATED", occurredAt: document.publication.publishedAt, sourceDocumentId: documentId } });

    if (notice.requirements.length > 0) {
      await prisma.requirement.createMany({
        data: notice.requirements.map((r) => ({
          marketId: market.id,
          type: r.type as RequirementType,
          rawText: r.rawText,
          thresholdValue: r.thresholdValue,
          thresholdUnit: r.thresholdUnit,
          confidence: notice.confidence,
        })),
      });
    }
    if (notice.requiredDocuments.length > 0) {
      await prisma.marketRequiredDocument.createMany({
        data: notice.requiredDocuments.map((d) => ({
          marketId: market.id,
          docType: d.docType as RequiredDocType,
          mandatory: d.mandatory,
          rawText: d.rawText,
        })),
      });
    }
    if (notice.lots.length > 0) {
      await prisma.marketLot.createMany({
        data: notice.lots.map((l) => ({
          marketId: market.id,
          numero: l.numero,
          objet: l.objet,
          description: l.description,
          montant: l.montant,
          quantite: l.quantite,
          unite: l.unite,
        })),
      });
    }

    for (const [field, hasValue] of [
      ["amountEstimatedExclTax", notice.amountEstimatedExclTax !== null],
      ["submissionDeadline", notice.submissionDeadline !== null],
      ["reference", notice.reference !== null],
      ["requirements", notice.requirements.length > 0],
      ["requiredDocuments", notice.requiredDocuments.length > 0],
    ] as [string, boolean][]) {
      await prisma.dataQualityCheck.create({
        data: {
          entityType: "Market", entityId: market.id, field,
          status: notice.confidence >= AUTO_APPROVE_CONFIDENCE_THRESHOLD ? DataQualityStatus.EXTRAIT_AUTOMATIQUEMENT : DataQualityStatus.INCERTAIN,
          confidence: hasValue ? notice.confidence : 0.2,
          extractionMethod: "gemini",
        },
      });
    }
    createdMarkets++;
  }

  return { createdMarkets, updatedMarkets, skippedUnmatchedUpdates };
}

async function processDocumentBuffer(documentId: string, buffer: Buffer) {
  const document = await prisma.document.findUniqueOrThrow({ where: { id: documentId }, include: { publication: true } });

  let fullText = "";
  await runJob(documentId, ExtractionJobStage.PARSE, async () => {
    const result = await extractPdfText(buffer);
    if (result.method === "failed") {
      await prisma.document.update({ where: { id: documentId }, data: { extractionStatus: "FAILED" } });
      throw new Error("Extraction de texte impossible (PDF illisible et OCR indisponible).");
    }
    for (const page of result.pages) {
      await prisma.documentPage.upsert({
        where: { documentId_pageNumber: { documentId, pageNumber: page.pageNumber } },
        update: { rawText: page.text, ocrConfidence: page.confidence },
        create: { documentId, pageNumber: page.pageNumber, rawText: page.text, ocrConfidence: page.confidence },
      });
    }
    fullText = result.pages.map((p) => p.text).join("\n");
    await prisma.document.update({ where: { id: documentId }, data: { extractionStatus: result.method === "ocr" ? "OCR_DONE" : "PARSED" } });
  }).catch(() => null);

  if (!fullText) return { status: "extraction_failed" as const };

  // Gemini (lecture native du PDF — mise en page, tableaux) est la voie
  // principale quand une clé est configurée ; le parseur regex reste le
  // repli automatique en cas d'échec (clé absente, réseau, quota, réponse
  // non conforme) — jamais de document non traité (section 94).
  async function tryGeminiExtraction(): Promise<GeminiNotice[] | null> {
    if (!isGeminiConfigured()) return null;
    try {
      return await runJob(documentId, ExtractionJobStage.CLASSIFY, async () => {
        const notices = await extractNoticesWithGemini(buffer);
        await prisma.document.update({ where: { id: documentId }, data: { extractionStatus: "CLASSIFIED" } });
        return notices;
      });
    } catch (err) {
      console.error(`[ingestion] Extraction Gemini échouée pour ${document.filename}, repli sur le parseur regex :`, err instanceof Error ? err.message : err);
      return null;
    }
  }
  const geminiNotices = await tryGeminiExtraction();

  if (geminiNotices) {
    const result = await runJob(documentId, ExtractionJobStage.EXTRACT, () => processGeminiNotices(geminiNotices, document, documentId));
    await runJob(documentId, ExtractionJobStage.VALIDATE, async () => {
      const lowConfidence = geminiNotices.some((n) => n.confidence < AUTO_APPROVE_CONFIDENCE_THRESHOLD);
      await prisma.document.update({ where: { id: documentId }, data: { extractionStatus: lowConfidence ? "EXTRACTED" : "VALIDATED" } });
    });
    return {
      status: "ok" as const,
      candidatesFound: geminiNotices.length,
      extractionMethod: "gemini" as const,
      republishedBlocks: 0,
      ...result,
    };
  }

  let candidates: ReturnType<typeof segmentAndClassify> = [];
  await runJob(documentId, ExtractionJobStage.CLASSIFY, async () => {
    candidates = segmentAndClassify(fullText);
    await prisma.document.update({ where: { id: documentId }, data: { extractionStatus: "CLASSIFIED" } });
  });

  let createdMarkets = 0;
  let updatedMarkets = 0;
  let republishedBlocks = 0;
  let skippedUnmatchedUpdates = 0;

  await runJob(documentId, ExtractionJobStage.EXTRACT, async () => {
    for (const candidate of candidates) {
      if (!candidate.title) continue;

      // Déduplication par hash de bloc (section 1.3) : un encart publicitaire
      // ou un résultat identique republié dans un autre numéro n'est jamais
      // recréé — il est journalisé et ignoré.
      const dedupe = await registerBlockOrDetectDuplicate(candidate.rawBlock, documentId);
      if (dedupe.isRepublished) {
        republishedBlocks++;
        continue;
      }

      const existingMarket = await findMatchingMarket(candidate);

      if (existingMarket) {
        await prisma.marketEvent.create({
          data: { marketId: existingMarket.id, type: "MARKET_UPDATED", occurredAt: document.publication.publishedAt, sourceDocumentId: documentId, description: `Nouvelle mention détectée dans le quotidien n°${document.publication.numero}.` },
        });
        updatedMarkets++;
        continue;
      }

      if (!FRESH_CALL_TYPES.has(candidate.publicationTypeGuess)) {
        skippedUnmatchedUpdates++;
        continue;
      }

      const authority = candidate.authorityGuess ? await resolveOrCreateAuthority(candidate.authorityGuess) : null;
      if (!authority) continue; // aucune autorité n'a pu être devinée dans le texte (préambule absent) — pas de marché incomplet créé

      const market = await prisma.market.create({
        data: {
          reference: candidate.reference,
          title: candidate.title,
          publicationType: (candidate.publicationTypeGuess as PublicationType) ?? PublicationType.AVIS_APPEL_OFFRES,
          procedureType: candidate.procedureTypeGuess ? PROCEDURE_MAP[candidate.procedureTypeGuess] : ProcedureType.AUTRE,
          status: MarketStatus.PUBLIE,
          contractingAuthorityId: authority.id,
          amountEstimatedExclTax: candidate.amountExclTax,
          submissionDeadline: candidate.submissionDeadline,
          withdrawalDeadline: candidate.withdrawalDeadline,
          openingAt: candidate.openingAt,
          bidValidityDays: candidate.bidValidityDays,
          executionDelayDays: candidate.executionDelayDays,
          publishedAt: document.publication.publishedAt,
          sourcePublicationId: document.publicationId,
          sourceDocumentId: documentId,
        },
      });
      await prisma.notice.create({
        data: {
          marketId: market.id, publicationId: document.publicationId, documentId,
          publicationType: market.publicationType, publishedAt: document.publication.publishedAt,
          rawExcerpt: candidate.rawBlock.slice(0, 500),
        },
      });
      await prisma.marketEvent.create({ data: { marketId: market.id, type: "MARKET_CREATED", occurredAt: document.publication.publishedAt, sourceDocumentId: documentId } });

      // Exigences, documents requis et lots — extraits par le même passage
      // heuristique (parser.ts), jamais laissés de côté (l'utilisateur doit
      // voir « toutes les informations », pas seulement les champs de tête).
      if (candidate.requirements.length > 0) {
        await prisma.requirement.createMany({
          data: candidate.requirements.map((r) => ({
            marketId: market.id,
            type: r.type as RequirementType,
            rawText: r.rawText,
            thresholdValue: r.thresholdValue,
            thresholdUnit: r.thresholdUnit,
            confidence: r.confidence,
          })),
        });
      }
      if (candidate.requiredDocuments.length > 0) {
        await prisma.marketRequiredDocument.createMany({
          data: candidate.requiredDocuments.map((d) => ({
            marketId: market.id,
            docType: d.docType as RequiredDocType,
            mandatory: d.mandatory,
            rawText: d.rawText,
          })),
        });
      }
      if (candidate.lots.length > 0) {
        await prisma.marketLot.createMany({
          data: candidate.lots.map((l) => ({
            marketId: market.id,
            numero: l.numero,
            objet: l.objet,
            montant: l.montant,
          })),
        });
      }

      for (const [field, confidence] of [
        ["amountEstimatedExclTax", candidate.amountExclTax !== null],
        ["submissionDeadline", candidate.submissionDeadline !== null],
        ["reference", candidate.reference !== null],
        ["requirements", candidate.requirements.length > 0],
        ["requiredDocuments", candidate.requiredDocuments.length > 0],
      ] as [string, boolean][]) {
        await prisma.dataQualityCheck.create({
          data: {
            entityType: "Market", entityId: market.id, field,
            status: candidate.confidence >= AUTO_APPROVE_CONFIDENCE_THRESHOLD ? DataQualityStatus.EXTRAIT_AUTOMATIQUEMENT : DataQualityStatus.INCERTAIN,
            confidence: confidence ? candidate.confidence : 0.2,
            extractionMethod: "regex-heuristic",
          },
        });
      }
      createdMarkets++;
    }
  });

  await runJob(documentId, ExtractionJobStage.VALIDATE, async () => {
    const lowConfidence = candidates.some((c) => c.confidence < AUTO_APPROVE_CONFIDENCE_THRESHOLD);
    await prisma.document.update({ where: { id: documentId }, data: { extractionStatus: lowConfidence ? "EXTRACTED" : "VALIDATED" } });
  });

  if (republishedBlocks > 0) {
    console.log(`[ingestion] ${republishedBlocks} bloc(s) republié(s) détecté(s) et ignoré(s) dans ${document.filename} (déduplication par hash).`);
  }

  return { status: "ok" as const, candidatesFound: candidates.length, extractionMethod: "regex-heuristic" as const, createdMarkets, updatedMarkets, republishedBlocks, skippedUnmatchedUpdates };
}

export async function runFullIngestion(sourceId: string) {
  const { documentIds, ...discoverStats } = await discoverSource(sourceId);

  // Reprise sur échec (section 94) : un document qui n'a jamais atteint un
  // statut terminal (téléchargement interrompu, PDF pas encore extrait…)
  // reste sinon bloqué indéfiniment — seuls les documents nouvellement
  // découverts étaient retentés jusqu'ici. On le réintègre dans le lot à
  // traiter à chaque passage du robot, sans jamais le dupliquer.
  const stalled = await prisma.document.findMany({
    where: {
      publication: { sourceId },
      extractionStatus: { in: ["PENDING", "DOWNLOADED", "OCR_DONE", "PARSED", "CLASSIFIED"] },
      id: { notIn: documentIds },
    },
    select: { id: true },
  });

  const allDocumentIds = [...documentIds, ...stalled.map((d) => d.id)];
  const results = [];
  for (const id of allDocumentIds) {
    results.push({ documentId: id, ...(await processDocument(id)) });
  }
  return { ...discoverStats, retriedStalled: stalled.length, results };
}

// Crée la publication + le document pour un dépôt manuel de quotidien PDF
// (section « import manuel ») et enregistre le buffer dans le stockage brut
// — étape commune à analyzeUploadedPdf() (aperçu avant validation) et
// ingestExistingDocument() (repli sans aperçu sur le même document) : jamais
// deux façons de créer ces lignes, pour ne pas risquer un document dupliqué
// selon le chemin emprunté pour le même fichier.
async function createUploadedDocument(params: {
  sourceId: string;
  filename: string;
  buffer: Buffer;
  publicationNumero: string;
  publishedAt: Date;
}) {
  const { sourceId, filename, buffer, publicationNumero, publishedAt } = params;

  const publication = await prisma.publication.upsert({
    where: { sourceId_numero_kind: { sourceId, numero: publicationNumero, kind: PublicationKind.QUOTIDIEN_MARCHES } },
    update: {},
    create: {
      sourceId,
      kind: PublicationKind.QUOTIDIEN_MARCHES,
      numero: publicationNumero,
      isDoubleIssue: false,
      publishedAt,
      title: `Quotidien n°${publicationNumero}`,
    },
  });

  const document = await prisma.document.create({
    data: {
      publicationId: publication.id,
      filename,
      url: `manual-upload://${publication.id}/${Date.now()}-${filename}`,
      isPrincipal: true,
      isBis: false,
      extractionStatus: "PENDING",
    },
  });

  await runJob(document.id, ExtractionJobStage.DOWNLOAD, async () => {
    const stored = await getRawStorage().save(filename, buffer);
    await prisma.document.update({
      where: { id: document.id },
      data: { fileHash: stored.hash, sizeBytes: stored.sizeBytes, downloadedAt: new Date(), extractionStatus: "DOWNLOADED" },
    });
  });

  return { document, publication };
}

// Devine le numéro du quotidien à partir du nom de fichier (souvent fiable
// en pratique : "Quotidien_n_4485.pdf", "quotidien-4477.pdf"...) — une
// valeur provisoire pour pouvoir créer la publication AVANT l'appel Gemini
// (nécessaire pour rattacher le suivi ExtractionJob à un documentId réel
// pendant l'extraction), corrigée ensuite par reconcilePublicationMetadata()
// si Gemini lit un numéro différent sur la page de garde du PDF.
export function guessNumeroFromFilename(filename: string): string {
  const base = filename.replace(/\.pdf$/i, "");
  // Priorité au numéro qui suit le mot "quotidien" — de nombreux widgets de
  // dépôt préfixent le nom de fichier d'origine par un identifiant (hash,
  // horodatage), lui-même composé de chiffres, qu'une simple recherche du
  // premier groupe de chiffres capterait à tort (constaté en pratique avec
  // "a1b2c3d4-Quotidien_n_4483.pdf" → "a1b2" plutôt que "4483").
  const afterKeyword = base.match(/quotidien[^\d]*(\d{3,6}(?:[-_]\d{3,6})?)/i);
  if (afterKeyword) return afterKeyword[1].replace(/_/g, "-");
  // Sinon, le DERNIER groupe de chiffres du nom : plus proche de l'extension
  // donc plus probablement le numéro que ne l'est un préfixe généré
  // automatiquement, généralement placé en tête de fichier.
  const matches = [...base.matchAll(/\d{3,6}(?:[-_]\d{3,6})?/g)];
  if (matches.length > 0) return matches[matches.length - 1][0].replace(/_/g, "-");
  return `manuel-${Date.now()}`;
}

// Corrige, après extraction, le numéro/la date provisoires d'une publication
// créée pour un dépôt manuel par les valeurs réellement lues par Gemini sur
// la page de garde du document. Si ce numéro correspond à une publication
// déjà existante (même quotidien déposé sous un autre nom de fichier, ou
// second passage), le document y est rattaché et la publication provisoire
// (vide, tout juste créée, et sans autre document) est supprimée plutôt que
// de laisser deux publications pour un même quotidien.
async function reconcilePublicationMetadata(
  document: { id: string },
  provisionalPublication: { id: string; sourceId: string },
  provisionalNumero: string,
  finalNumero: string,
  finalDate: Date,
) {
  if (finalNumero === provisionalNumero) {
    await prisma.publication.update({ where: { id: provisionalPublication.id }, data: { publishedAt: finalDate, title: `Quotidien n°${finalNumero}` } });
    return;
  }
  const existing = await prisma.publication.findUnique({
    where: { sourceId_numero_kind: { sourceId: provisionalPublication.sourceId, numero: finalNumero, kind: PublicationKind.QUOTIDIEN_MARCHES } },
  });
  if (existing && existing.id !== provisionalPublication.id) {
    await prisma.document.update({ where: { id: document.id }, data: { publicationId: existing.id } });
    await prisma.publication.update({ where: { id: existing.id }, data: { publishedAt: finalDate } });
    await prisma.publication.delete({ where: { id: provisionalPublication.id } });
  } else {
    await prisma.publication.update({
      where: { id: provisionalPublication.id },
      data: { numero: finalNumero, publishedAt: finalDate, title: `Quotidien n°${finalNumero}` },
    });
  }
}

// Dépôt manuel avec aperçu avant validation (même principe que
// discoverAndAnalyzeSource/commitAnalyzedDocument, mais pour un fichier
// déposé à la main plutôt que découvert sur une source) : le document est
// créé et le fichier stocké, puis extrait avec Gemini SANS rien écrire en
// base — l'ajout effectif passe par commitAnalyzedDocument(), qui réutilise
// exactement la même fonction d'écriture que tous les autres chemins
// d'ingestion (processGeminiNotices).
//
// Ni le numéro du quotidien ni sa date de publication ne sont demandés à
// l'utilisateur : une valeur provisoire (déduite du nom de fichier / date du
// jour) sert uniquement à créer la publication, puis Gemini lit les
// véritables numéro et date sur la page de garde du PDF et les corrige.
export async function analyzeUploadedPdf(params: {
  sourceId: string;
  filename: string;
  buffer: Buffer;
}): Promise<DocumentAnalysis & { documentId: string; publicationNumero: string; publishedAt: Date }> {
  const provisionalNumero = guessNumeroFromFilename(params.filename);
  const provisionalDate = new Date();
  const { document, publication } = await createUploadedDocument({
    sourceId: params.sourceId,
    filename: params.filename,
    buffer: params.buffer,
    publicationNumero: provisionalNumero,
    publishedAt: provisionalDate,
  });

  if (!isGeminiConfigured()) {
    return { documentId: document.id, status: "gemini_not_configured", publicationNumero: provisionalNumero, publishedAt: provisionalDate };
  }

  try {
    const extraction = await runJob(document.id, ExtractionJobStage.CLASSIFY, async () => {
      const result = await extractQuotidienWithGemini(params.buffer);
      await prisma.document.update({ where: { id: document.id }, data: { extractionStatus: "CLASSIFIED" } });
      return result;
    });

    const finalNumero = extraction.publicationNumero ?? provisionalNumero;
    const finalDate = extraction.publicationDate ?? provisionalDate;
    await reconcilePublicationMetadata(document, publication, provisionalNumero, finalNumero, finalDate);

    return { documentId: document.id, status: "ok", notices: extraction.notices, publicationNumero: finalNumero, publishedAt: finalDate };
  } catch (err) {
    await prisma.document.update({ where: { id: document.id }, data: { extractionStatus: "FAILED" } });
    return {
      documentId: document.id,
      status: "extraction_failed",
      error: err instanceof Error ? err.message : String(err),
      publicationNumero: provisionalNumero,
      publishedAt: provisionalDate,
    };
  }
}

// Repli sans aperçu pour un document déjà créé par analyzeUploadedPdf() —
// utilisé quand l'aperçu Gemini a échoué (clé absente, quota, réponse non
// conforme) : réutilise le même document (jamais de doublon) et retombe sur
// le passage complet (Gemini si possible, sinon le parseur par règles), qui
// écrit directement en base comme le ferait le robot automatique.
export async function ingestExistingDocument(documentId: string, buffer: Buffer) {
  return processDocumentBuffer(documentId, buffer);
}

// ---------------------------------------------------------------------
// Workflow « analyser puis valider » (section admin/sources) : contrairement
// à runFullIngestion/ingestUploadedPdf qui écrivent les marchés
// immédiatement, ce parcours en deux temps télécharge et extrait avec
// Gemini SANS rien créer en base, pour un aperçu humain avant ajout — la
// création effective passe par commitAnalyzedDocument(), qui réutilise
// exactement la même fonction d'écriture (processGeminiNotices) que le
// robot automatique : aucune divergence possible entre les deux chemins.
// ---------------------------------------------------------------------

export type DocumentAnalysis =
  | { status: "ok"; notices: GeminiNotice[] }
  | { status: "gemini_not_configured" }
  | { status: "download_failed" }
  | { status: "extraction_failed"; error: string };

/** Télécharge un document déjà découvert et l'analyse avec Gemini, sans créer aucun marché. */
export async function analyzeDocument(documentId: string): Promise<DocumentAnalysis> {
  const document = await prisma.document.findUniqueOrThrow({ where: { id: documentId }, include: { publication: { include: { source: true } } } });
  const connector = getConnectorFor(document.publication.source.name, document.publication.source.baseUrl);

  let buffer: Buffer;
  try {
    buffer = await runJob(documentId, ExtractionJobStage.DOWNLOAD, async () => {
      const downloaded = await connector.download({ filename: document.filename, url: document.url, isPrincipal: document.isPrincipal, isBis: document.isBis });
      const stored = await getRawStorage().save(document.filename, downloaded);
      await prisma.document.update({ where: { id: documentId }, data: { fileHash: stored.hash, sizeBytes: stored.sizeBytes, downloadedAt: new Date(), extractionStatus: "DOWNLOADED" } });
      return downloaded;
    });
  } catch {
    // Le document reste PENDING pour une reprise ultérieure — aucune perte silencieuse (section 94).
    return { status: "download_failed" };
  }

  if (!isGeminiConfigured()) return { status: "gemini_not_configured" };

  try {
    const notices = await runJob(documentId, ExtractionJobStage.CLASSIFY, async () => {
      const result = await extractNoticesWithGemini(buffer);
      await prisma.document.update({ where: { id: documentId }, data: { extractionStatus: "CLASSIFIED" } });
      return result;
    });
    return { status: "ok", notices };
  } catch (err) {
    await prisma.document.update({ where: { id: documentId }, data: { extractionStatus: "FAILED" } });
    return { status: "extraction_failed", error: err instanceof Error ? err.message : String(err) };
  }
}

/** Découvre les nouveaux documents d'une source puis les analyse avec Gemini (sans écrire de marché). */
export async function discoverAndAnalyzeSource(sourceId: string) {
  const { documentIds, ...discoverStats } = await discoverSource(sourceId);

  const analyses: (DocumentAnalysis & { documentId: string; filename: string; publicationNumero: string; publishedAt: Date })[] = [];
  for (const documentId of documentIds) {
    const document = await prisma.document.findUniqueOrThrow({ where: { id: documentId }, include: { publication: true } });
    const analysis = await analyzeDocument(documentId);
    analyses.push({ documentId, filename: document.filename, publicationNumero: document.publication.numero, publishedAt: document.publication.publishedAt, ...analysis });
  }
  return { ...discoverStats, analyses };
}

/** Valide un aperçu (éventuellement filtré côté client) et crée les marchés correspondants. */
export async function commitAnalyzedDocument(documentId: string, notices: unknown[]) {
  const document = await prisma.document.findUniqueOrThrow({ where: { id: documentId }, include: { publication: true } });
  const revised = reviseNotices(notices);

  const result = await runJob(documentId, ExtractionJobStage.EXTRACT, () => processGeminiNotices(revised, document, documentId));
  await runJob(documentId, ExtractionJobStage.VALIDATE, async () => {
    const lowConfidence = revised.some((n) => n.confidence < AUTO_APPROVE_CONFIDENCE_THRESHOLD);
    await prisma.document.update({ where: { id: documentId }, data: { extractionStatus: lowConfidence ? "EXTRACTED" : "VALIDATED" } });
  });

  return { status: "ok" as const, candidatesFound: revised.length, ...result };
}
