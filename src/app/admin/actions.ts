"use server";

import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { DataQualityStatus } from "@prisma/client";
import { runFullIngestion, ingestUploadedPdf, discoverAndAnalyzeSource, commitAnalyzedDocument } from "@/lib/ingestion/pipeline";
import { clearDemoMarkets } from "@/lib/admin/clear-demo-data";

export async function clearDemoDataAction() {
  await requirePlatformAdmin();
  const result = await clearDemoMarkets();
  revalidatePath("/marches");
  revalidatePath("/dashboard");
  revalidatePath("/opportunites");
  revalidatePath("/admin/sources");
  return result;
}

export async function togglePlatformAdminAction(userId: string) {
  await requirePlatformAdmin();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  await prisma.user.update({ where: { id: userId }, data: { isPlatformAdmin: !user.isPlatformAdmin } });
  revalidatePath("/admin/utilisateurs");
}

export async function triggerIngestionAction(sourceId: string) {
  await requirePlatformAdmin();
  try {
    const result = await runFullIngestion(sourceId);
    revalidatePath("/admin/importations");
    revalidatePath("/admin/jobs");
    revalidatePath("/admin/sources");
    return { ok: true as const, ...result };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function uploadQuotidienAction(formData: FormData) {
  await requirePlatformAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "Aucun fichier PDF reçu." };
  }
  const sourceId = String(formData.get("sourceId") ?? "").trim();
  const numero = String(formData.get("numero") ?? "").trim();
  const publishedAtRaw = String(formData.get("publishedAt") ?? "").trim();
  if (!sourceId || !numero || !publishedAtRaw) {
    return { ok: false as const, error: "Source, numéro et date de publication sont requis." };
  }
  const publishedAt = new Date(publishedAtRaw);
  if (Number.isNaN(publishedAt.getTime())) {
    return { ok: false as const, error: "Date de publication invalide." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await ingestUploadedPdf({ sourceId, filename: file.name, buffer, publicationNumero: numero, publishedAt });
    revalidatePath("/marches");
    revalidatePath("/dashboard");
    revalidatePath("/opportunites");
    revalidatePath("/admin/sources");
    revalidatePath("/admin/importations");
    revalidatePath("/admin/jobs");
    revalidatePath("/admin/validation");
    return { ok: true as const, ...result };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
  }
}

// Téléchargement automatique + extraction Gemini SANS écriture en base —
// l'aperçu (section admin/sources) laisse un humain valider avant que quoi
// que ce soit ne soit ajouté à la plateforme.
export async function analyzeSourceAction(sourceId: string) {
  await requirePlatformAdmin();
  try {
    const result = await discoverAndAnalyzeSource(sourceId);
    revalidatePath("/admin/sources");
    revalidatePath("/admin/importations");
    revalidatePath("/admin/jobs");
    return { ok: true as const, ...result };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
  }
}

// Ajoute à la base les marchés d'un aperçu déjà validé par un humain —
// `notices` provient de analyzeSourceAction, éventuellement filtré côté
// client (décoché certains avis) ; revalidé server-side avant écriture
// (reviseNotices, dans pipeline.ts) quoi qu'il en soit.
export async function commitAnalyzedDocumentAction(documentId: string, notices: unknown[]) {
  await requirePlatformAdmin();
  try {
    const result = await commitAnalyzedDocument(documentId, notices);
    revalidatePath("/marches");
    revalidatePath("/dashboard");
    revalidatePath("/opportunites");
    revalidatePath("/admin/sources");
    revalidatePath("/admin/importations");
    revalidatePath("/admin/jobs");
    revalidatePath("/admin/validation");
    return { ok: true as const, ...result };
  } catch (err) {
    return { ok: false as const, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function toggleSourceActiveAction(sourceId: string) {
  await requirePlatformAdmin();
  const source = await prisma.source.findUniqueOrThrow({ where: { id: sourceId } });
  await prisma.source.update({ where: { id: sourceId }, data: { isActive: !source.isActive } });
  revalidatePath("/admin/sources");
}

export async function validateDataQualityAction(checkId: string, status: DataQualityStatus) {
  const session = await requirePlatformAdmin();
  await prisma.dataQualityCheck.update({ where: { id: checkId }, data: { status, validatedById: session.user.id, validatedAt: new Date() } });
  revalidatePath("/admin/validation");
  revalidatePath("/admin/qualite");
}

export async function createSectorAction(formData: FormData) {
  await requirePlatformAdmin();
  const group = formData.get("group") as never;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await prisma.sector.create({ data: { group, name } });
  revalidatePath("/admin/taxonomies");
}

export async function activateScoreConfigAction(formData: FormData) {
  await requirePlatformAdmin();
  const version = String(formData.get("version") ?? "").trim();
  const weightsRaw = String(formData.get("weights") ?? "{}");
  let weights: unknown;
  try {
    weights = JSON.parse(weightsRaw);
  } catch {
    throw new Error("JSON de pondération invalide");
  }
  await prisma.scoreConfig.updateMany({ data: { isActive: false }, where: { isActive: true } });
  await prisma.scoreConfig.upsert({
    where: { version },
    update: { weights: weights as never, isActive: true },
    create: { version, weights: weights as never, isActive: true },
  });
  revalidatePath("/admin/scoring");
}
