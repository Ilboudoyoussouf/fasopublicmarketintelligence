"use server";

import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { DataQualityStatus } from "@prisma/client";
import { runFullIngestion } from "@/lib/ingestion/pipeline";

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
