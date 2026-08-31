"use server";

import { signOut, unstable_update } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function signOutAction() {
  await signOut({ redirectTo: "/connexion" });
}

export async function switchTenantAction(tenantId: string) {
  await unstable_update({ activeTenantId: tenantId });
  redirect("/dashboard");
}
