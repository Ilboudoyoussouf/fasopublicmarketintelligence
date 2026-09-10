// Déduplication (section 46) — un même marché peut apparaître dans
// plusieurs publications (avis initial, rectificatif republié en entier,
// reprise). Clés de rapprochement : référence, objet, organisme, dates,
// montants, similarité textuelle.
import { prisma } from "@/lib/prisma";
import type { ExtractedNoticeCandidate } from "@/lib/ingestion/parser";
import crypto from "crypto";

export function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(normalize(a).split(" "));
  const setB = new Set(normalize(b).split(" "));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const w of setA) if (setB.has(w)) intersection++;
  const union = setA.size + setB.size - intersection;
  return intersection / union;
}

/**
 * Hash de bloc — section 1.3 de l'analyse structurelle : un encart
 * publicitaire ou un résultat peut être republié à l'identique d'un
 * numéro à l'autre (SONATUR dans les n°4484 et n°4485, synthèse AGETIB
 * reprise du n°4484 au n°4485). Le hash porte sur le texte normalisé pour
 * survivre aux variations d'espacement et de casse.
 */
export function computeBlockHash(rawBlock: string): string {
  return crypto.createHash("sha256").update(normalize(rawBlock)).digest("hex");
}

/**
 * Enregistre le hash d'un bloc s'il est nouveau. Retourne `isRepublished:
 * true` si ce bloc exact a déjà été vu dans un autre document — auquel cas
 * l'appelant ne doit pas créer un nouvel enregistrement mais journaliser la
 * reprise (jamais de perte silencieuse, jamais de doublon).
 */
export async function registerBlockOrDetectDuplicate(rawBlock: string, documentId: string): Promise<{ isRepublished: boolean; firstSeenDocumentId?: string }> {
  const hash = computeBlockHash(rawBlock);
  const existing = await prisma.blockHash.findUnique({ where: { hash } });
  if (existing) {
    return { isRepublished: existing.documentId !== documentId, firstSeenDocumentId: existing.documentId };
  }
  await prisma.blockHash.create({ data: { hash, documentId } }).catch(() => {
    // course possible entre deux jobs concurrents sur le même bloc : ignorer, le hash existe déjà.
  });
  return { isRepublished: false };
}

export async function findMatchingMarket(candidate: ExtractedNoticeCandidate) {
  if (candidate.reference) {
    const byReference = await prisma.market.findFirst({ where: { reference: candidate.reference } });
    if (byReference) return byReference;
  }

  if (!candidate.title) return null;

  // Fenêtre de recherche restreinte (mêmes 90 derniers jours) pour éviter
  // de comparer à l'ensemble de la base.
  const recentMarkets = await prisma.market.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 90 * 86_400_000) } },
    select: { id: true, title: true, reference: true, amountEstimatedExclTax: true },
    take: 500,
  });

  for (const m of recentMarkets) {
    const similarity = jaccardSimilarity(candidate.title, m.title);
    const sameAmount = candidate.amountExclTax && m.amountEstimatedExclTax
      ? Math.abs(Number(m.amountEstimatedExclTax) - candidate.amountExclTax) / candidate.amountExclTax < 0.02
      : false;
    if (similarity >= 0.6 || (similarity >= 0.4 && sameAmount)) {
      return prisma.market.findUnique({ where: { id: m.id } });
    }
  }
  return null;
}
