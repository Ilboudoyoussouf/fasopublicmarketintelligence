import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTenantContextOrNull } from "@/lib/session";

// API interne sécurisée (section 47) — authentification par session pour le
// MVP. L'accès par clé API dédiée (plan Enterprise) est une extension
// prévue de cette même façade sans changer les endpoints.
export async function requireApiSession() {
  const session = await auth();
  if (!session?.user) return { session: null, error: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  return { session, error: null };
}

export async function requireApiTenant() {
  const ctx = await getTenantContextOrNull();
  if (!ctx) return { ctx: null, error: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  return { ctx, error: null };
}
