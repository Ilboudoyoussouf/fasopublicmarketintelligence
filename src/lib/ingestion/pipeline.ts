// Orchestrateur du pipeline d'ingestion (section 40, 94) :
// Sources → Crawler → Stockage brut → OCR/extraction → Segmentation →
// Classification → Extraction structurée → Validation → Base transactionnelle.
import { prisma } from "@/lib/prisma";
import { createDgcmefConnector } from "@/lib/ingestion/connectors/dgcmef";
import type { SourceConnector } from "@/lib/ingestion/connector";
import { getRawStorage } from "@/lib/ingestion/storage";
import { extractPdfText } from "@/lib/ingestion/extract-text";
import { segmentAndClassify } from "@/lib/ingestion/parser";
import { findMatchingMarket } from "@/lib/ingestion/dedupe";
import {
  ExtractionJobStage, ExtractionJobStatus, DataQualityStatus,
  PublicationKind, MarketStatus, ProcedureType, PublicationType,
} from "@prisma/client";

function getConnectorFor(sourceName: string, baseUrl: string): SourceConnector {
  if (sourceName.toUpperCase() === "DGCMEF") return createDgcmefConnector(baseUrl);
  throw new Error(`Aucun connecteur enregistré pour la source « ${sourceName} ».`);
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

  await runJob(documentId, ExtractionJobStage.EXTRACT, async () => {
    for (const candidate of candidates) {
      if (!candidate.title) continue;

      const existingMarket = await findMatchingMarket(candidate);
      const authority = candidate.authorityGuess
        ? await prisma.contractingAuthority.findFirst({ where: { name: { contains: candidate.authorityGuess.slice(0, 30), mode: "insensitive" } } })
        : null;

      if (existingMarket) {
        await prisma.marketEvent.create({
          data: { marketId: existingMarket.id, type: "MARKET_UPDATED", occurredAt: document.publication.publishedAt, sourceDocumentId: documentId, description: `Nouvelle mention détectée dans le quotidien n°${document.publication.numero}.` },
        });
        updatedMarkets++;
        continue;
      }

      if (!authority) continue; // sans organisme résolu, la donnée part en file de validation plutôt que de créer un enregistrement incomplet

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

      for (const [field, confidence] of [["amountEstimatedExclTax", candidate.amountExclTax !== null], ["submissionDeadline", candidate.submissionDeadline !== null], ["reference", candidate.reference !== null]] as [string, boolean][]) {
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

  return { status: "ok" as const, candidatesFound: candidates.length, createdMarkets, updatedMarkets };
}

export async function runFullIngestion(sourceId: string) {
  const { documentIds, ...discoverStats } = await discoverSource(sourceId);
  const results = [];
  for (const id of documentIds) {
    results.push({ documentId: id, ...(await processDocument(id)) });
  }
  return { ...discoverStats, results };
}
