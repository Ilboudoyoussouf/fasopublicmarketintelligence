// Orchestrateur du pipeline d'ingestion (section 40, 94) :
// Sources → Crawler → Stockage brut → OCR/extraction → Segmentation →
// Classification → Extraction structurée → Validation → Base transactionnelle.
import { prisma } from "@/lib/prisma";
import { createDgcmefConnector } from "@/lib/ingestion/connectors/dgcmef";
import type { SourceConnector } from "@/lib/ingestion/connector";
import { getRawStorage } from "@/lib/ingestion/storage";
import { extractPdfText } from "@/lib/ingestion/extract-text";
import { segmentAndClassify } from "@/lib/ingestion/parser";
import { findMatchingMarket, registerBlockOrDetectDuplicate } from "@/lib/ingestion/dedupe";
import {
  ExtractionJobStage, ExtractionJobStatus, DataQualityStatus,
  PublicationKind, MarketStatus, ProcedureType, PublicationType,
  RequirementType, RequiredDocType, OrganizationType,
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
async function resolveOrCreateAuthority(authorityGuess: string) {
  const name = authorityGuess.slice(0, 190); // VARCHAR(191)
  const existing = await prisma.contractingAuthority.findFirst({ where: { name: { contains: authorityGuess.slice(0, 30) } } });
  if (existing) return existing;

  const country = await prisma.country.findFirstOrThrow();
  try {
    return await prisma.contractingAuthority.create({ data: { countryId: country.id, name, type: guessAuthorityType(name) } });
  } catch {
    // Conflit d'unicité (countryId, name) : une création concurrente a eu lieu entre-temps.
    return prisma.contractingAuthority.findFirst({ where: { countryId: country.id, name } });
  }
}

async function runJob(documentId: string, stage: ExtractionJobStage, fn: () => Promise<void>) {
  const job = await prisma.extractionJob.create({ data: { documentId, stage, status: ExtractionJobStatus.RUNNING, attempts: 1, startedAt: new Date() } });
  try {
    await fn();
    await prisma.extractionJob.update({ where: { id: job.id }, data: { status: ExtractionJobStatus.SUCCEEDED, finishedAt: new Date() } });
  } catch (err) {
    await prisma.extractionJob.update({
      where: { id: job.id },
      data: { status: ExtractionJobStatus.FAILED, finishedAt: new Date(), errorMessage: err instanceof Error ? err.message : String(err) },
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
            status: candidate.confidence >= 0.6 ? DataQualityStatus.EXTRAIT_AUTOMATIQUEMENT : DataQualityStatus.INCERTAIN,
            confidence: confidence ? candidate.confidence : 0.2,
            extractionMethod: "regex-heuristic",
          },
        });
      }
      createdMarkets++;
    }
  });

  await runJob(documentId, ExtractionJobStage.VALIDATE, async () => {
    const lowConfidence = candidates.some((c) => c.confidence < 0.6);
    await prisma.document.update({ where: { id: documentId }, data: { extractionStatus: lowConfidence ? "EXTRACTED" : "VALIDATED" } });
  });

  if (republishedBlocks > 0) {
    console.log(`[ingestion] ${republishedBlocks} bloc(s) republié(s) détecté(s) et ignoré(s) dans ${document.filename} (déduplication par hash).`);
  }

  return { status: "ok" as const, candidatesFound: candidates.length, createdMarkets, updatedMarkets, republishedBlocks, skippedUnmatchedUpdates };
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

/**
 * Dépôt manuel d'un quotidien PDF (section « import manuel ») : contourne le
 * téléchargement réseau (indisponible en sandbox, ou en attendant que le
 * connecteur DGCMEF soit confirmé fiable sur le site réel) en réutilisant
 * exactement le même passage extraction → classification → structuration →
 * validation que le robot automatique — aucune donnée créée par cette voie
 * n'est distinguable, dans le schéma, d'une donnée ingérée automatiquement.
 */
export async function ingestUploadedPdf(params: {
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

  const result = await processDocumentBuffer(document.id, buffer);
  return { documentId: document.id, publicationId: publication.id, ...result };
}
