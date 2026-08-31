"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { WatchlistType } from "@prisma/client";

export async function createWatchlistAction(formData: FormData) {
  const { tenant } = await requireTenantContext();
  const type = formData.get("type") as WatchlistType;
  const keyword = String(formData.get("keyword") ?? "").trim();
  if (!keyword) return;
  await prisma.watchlist.create({ data: { tenantId: tenant.id, type, keyword } });
  revalidatePath("/veille/watchlists");
}

export async function deleteWatchlistAction(id: string) {
  const { tenant } = await requireTenantContext();
  await prisma.watchlist.deleteMany({ where: { id, tenantId: tenant.id } });
  revalidatePath("/veille/watchlists");
}

export async function markAlertReadAction(id: string) {
  const { tenant } = await requireTenantContext();
  await prisma.alert.updateMany({ where: { id, tenantId: tenant.id }, data: { readAt: new Date() } });
  revalidatePath("/veille/alertes");
}

export async function markAllAlertsReadAction() {
  const { tenant } = await requireTenantContext();
  await prisma.alert.updateMany({ where: { tenantId: tenant.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/veille/alertes");
}
