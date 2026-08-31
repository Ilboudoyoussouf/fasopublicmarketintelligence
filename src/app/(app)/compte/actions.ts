"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/session";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { canManageTeam, canManageBilling, canEditProfile } from "@/lib/rbac";
import { getPaymentGateway } from "@/lib/payments/provider";
import { PaymentProvider, PlanTier, RequiredDocType, TenantRole } from "@prisma/client";
import { PLAN_PRICE_FCFA } from "@/lib/plans";

export async function updateUserProfileAction(formData: FormData) {
  const { session } = await requireTenantContext();
  await prisma.user.update({
    where: { id: session.user.id },
    data: { fullName: String(formData.get("fullName") ?? ""), phone: String(formData.get("phone") ?? "") || null },
  });
  revalidatePath("/compte/profil");
}

export async function updateTenantProfileAction(formData: FormData) {
  const { tenant, role } = await requireTenantContext();
  if (!canEditProfile(role)) throw new Error("Permission refusée");
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      name: String(formData.get("name") ?? tenant.name),
      size: String(formData.get("size") ?? "") || null,
      regionName: String(formData.get("regionName") ?? "") || null,
      revenueBand: String(formData.get("revenueBand") ?? "") || null,
      experienceYears: formData.get("experienceYears") ? Number(formData.get("experienceYears")) : null,
    },
  });
  revalidatePath("/compte/entreprise");
}

export async function inviteMemberAction(formData: FormData) {
  const { tenant, role } = await requireTenantContext();
  if (!canManageTeam(role)) throw new Error("Permission refusée");
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const memberRole = formData.get("role") as TenantRole;
  if (!email) return;

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);
    user = await prisma.user.create({ data: { email, fullName: email.split("@")[0], passwordHash } });
  }
  await prisma.tenantMember.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
    update: { role: memberRole },
    create: { tenantId: tenant.id, userId: user.id, role: memberRole },
  });
  revalidatePath("/compte/equipe");
}

export async function updateMemberRoleAction(memberId: string, newRole: TenantRole) {
  const { tenant, role } = await requireTenantContext();
  if (!canManageTeam(role)) throw new Error("Permission refusée");
  await prisma.tenantMember.updateMany({ where: { id: memberId, tenantId: tenant.id }, data: { role: newRole } });
  revalidatePath("/compte/equipe");
}

export async function removeMemberAction(memberId: string) {
  const { tenant, role } = await requireTenantContext();
  if (!canManageTeam(role)) throw new Error("Permission refusée");
  await prisma.tenantMember.deleteMany({ where: { id: memberId, tenantId: tenant.id, role: { not: "OWNER" } } });
  revalidatePath("/compte/equipe");
}

export async function changePlanAction(formData: FormData) {
  const { tenant, role } = await requireTenantContext();
  if (!canManageBilling(role)) throw new Error("Permission refusée");
  const plan = formData.get("plan") as PlanTier;
  const price = PLAN_PRICE_FCFA[plan];

  const subscription = await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: { plan, status: "ACTIVE", currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000) },
    create: { tenantId: tenant.id, plan, status: "ACTIVE", currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000) },
  });

  if (price && price > 0) {
    const gateway = getPaymentGateway();
    const intent = await gateway.charge({ amount: price, currency: "XOF", provider: PaymentProvider.MOBILE_MONEY });
    await prisma.payment.create({
      data: { subscriptionId: subscription.id, provider: PaymentProvider.MOBILE_MONEY, amount: price, status: intent.status === "SUCCEEDED" ? "SUCCEEDED" : "PENDING", externalRef: intent.externalRef, paidAt: new Date() },
    });
  }

  revalidatePath("/compte/abonnement");
  revalidatePath("/compte/facturation");
}

export async function updateNotificationPreferencesAction(formData: FormData) {
  const { tenant, role } = await requireTenantContext();
  if (!canEditProfile(role)) throw new Error("Permission refusée");
  const channels = formData.getAll("channels").map(String);
  const frequency = String(formData.get("frequency") ?? "QUOTIDIEN");
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { preferences: { ...(tenant.preferences as object), canauxAlerte: channels, frequenceBriefing: frequency } },
  });
  revalidatePath("/compte/notifications");
}

export async function changePasswordAction(formData: FormData) {
  const { session } = await requireTenantContext();
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  if (next.length < 8) throw new Error("8 caractères minimum");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const valid = await bcrypt.compare(current, user.passwordHash);
  if (!valid) throw new Error("Mot de passe actuel incorrect");

  const passwordHash = await bcrypt.hash(next, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  revalidatePath("/compte/securite");
}

export async function addTenantDocumentAction(formData: FormData) {
  const { tenant } = await requireTenantContext();
  const docType = formData.get("docType") as RequiredDocType;
  const label = String(formData.get("label") ?? "");
  const expirationDate = formData.get("expirationDate") ? new Date(String(formData.get("expirationDate"))) : null;
  const status = expirationDate && expirationDate < new Date() ? "EXPIRED" : expirationDate ? "VALID" : "UNVERIFIED";

  await prisma.tenantDocument.create({
    data: { tenantId: tenant.id, docType, label: label || null, expirationDate, status, lastVerifiedAt: new Date() },
  });
  revalidatePath("/compte/entreprise/documents");
}
