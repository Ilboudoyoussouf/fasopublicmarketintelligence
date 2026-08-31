import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  return session;
}

/** Session + tenant actif chargé depuis la base (pour lire plan, secteurs, etc.) */
export async function requireTenantContext() {
  const session = await requireSession();
  if (!session.activeTenantId) redirect("/onboarding/bienvenue");

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.activeTenantId },
    include: { subscription: true },
  });
  if (!tenant) redirect("/onboarding/bienvenue");

  const membership = session.tenants.find((t) => t.id === tenant.id);

  return { session, tenant, role: membership?.role ?? "READONLY" };
}

/** Variante pour les route handlers (API) : ne redirige jamais, renvoie null si non authentifié. */
export async function getTenantContextOrNull() {
  const session = await auth();
  if (!session?.user || !session.activeTenantId) return null;
  const tenant = await prisma.tenant.findUnique({ where: { id: session.activeTenantId } });
  if (!tenant) return null;
  const membership = session.tenants.find((t) => t.id === tenant.id);
  return { session, tenant, role: membership?.role ?? "READONLY" };
}

export async function requirePlatformAdmin() {
  const session = await requireSession();
  if (!session.user.isPlatformAdmin) redirect("/dashboard");
  return session;
}
