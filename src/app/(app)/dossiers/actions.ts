"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function toggleChecklistItemAction(itemId: string, folderId: string) {
  await requireTenantContext();
  const item = await prisma.checklistItem.findUnique({ where: { id: itemId } });
  if (!item) return;
  await prisma.checklistItem.update({ where: { id: itemId }, data: { done: !item.done } });
  revalidatePath(`/dossiers/${folderId}`);
}

export async function updateFolderNotesAction(folderId: string, formData: FormData) {
  const { tenant } = await requireTenantContext();
  await prisma.submissionFolder.updateMany({ where: { id: folderId, tenantId: tenant.id }, data: { notes: String(formData.get("notes") ?? "") } });
  revalidatePath(`/dossiers/${folderId}`);
}
