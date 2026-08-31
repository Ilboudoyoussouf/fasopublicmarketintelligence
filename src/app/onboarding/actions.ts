"use server";

import { prisma } from "@/lib/prisma";
import { auth, unstable_update } from "@/lib/auth";
import { computeScoresForTenant } from "@/lib/scoring/engine";
import { redirect } from "next/navigation";
import { RequiredDocType, TenantRole } from "@prisma/client";

export type OnboardingPayload = {
  companyName: string;
  size: string;
  sectorIds: string[];
  regionName: string;
  zoneRegionNames: string[];
  revenueBand: string;
  experienceYears: number;
  licenses: { label: string; expirationDate?: string }[];
  references: { marketTitle: string; clientName?: string; year?: number; amount?: number }[];
  targetCategories: string[];
  budgetMin?: number;
  budgetMax?: number;
  alertChannels: string[];
  alertFrequency: "QUOTIDIEN" | "HEBDOMADAIRE";
};

export async function completeOnboardingAction(payload: OnboardingPayload) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const country = await prisma.country.findUniqueOrThrow({ where: { code: "BF" } });

  const tenant = await prisma.tenant.create({
    data: {
      countryId: country.id,
      name: payload.companyName,
      size: payload.size,
      regionName: payload.regionName,
      revenueBand: payload.revenueBand,
      experienceYears: payload.experienceYears,
      targetCategories: payload.targetCategories,
      preferences: {
        budgetMin: payload.budgetMin ?? null,
        budgetMax: payload.budgetMax ?? null,
        canauxAlerte: payload.alertChannels,
        frequenceBriefing: payload.alertFrequency,
      },
    },
  });

  await prisma.tenantMember.create({ data: { tenantId: tenant.id, userId: session.user.id, role: TenantRole.OWNER, joinedAt: new Date() } });

  for (const sectorId of payload.sectorIds) {
    await prisma.tenantSector.create({ data: { tenantId: tenant.id, sectorId } });
  }
  for (const zone of payload.zoneRegionNames) {
    await prisma.tenantZone.create({ data: { tenantId: tenant.id, regionName: zone } });
  }
  for (const license of payload.licenses.filter((l) => l.label.trim())) {
    await prisma.tenantLicense.create({ data: { tenantId: tenant.id, label: license.label, expirationDate: license.expirationDate ? new Date(license.expirationDate) : null } });
  }
  for (const ref of payload.references.filter((r) => r.marketTitle.trim())) {
    await prisma.tenantReference.create({ data: { tenantId: tenant.id, marketTitle: ref.marketTitle, clientName: ref.clientName, year: ref.year, amount: ref.amount } });
  }
  // Bibliothèque de pièces par défaut, à compléter (section 10).
  for (const docType of [RequiredDocType.RCCM, RequiredDocType.IFU, RequiredDocType.ATTESTATION_FISCALE, RequiredDocType.ATTESTATION_SOCIALE] as const) {
    await prisma.tenantDocument.create({ data: { tenantId: tenant.id, docType, status: "UNVERIFIED" } });
  }

  await prisma.subscription.create({
    data: { tenantId: tenant.id, plan: "FREE", status: "TRIAL", currentPeriodEnd: new Date(Date.now() + 14 * 86_400_000) },
  });

  await prisma.auditLog.create({ data: { tenantId: tenant.id, actorUserId: session.user.id, action: "TENANT_CREATED", entityType: "Tenant", entityId: tenant.id, after: { name: tenant.name } } });

  await computeScoresForTenant(tenant.id);

  await unstable_update({ activeTenantId: tenant.id });

  redirect("/onboarding/premiere-recommandation");
}
