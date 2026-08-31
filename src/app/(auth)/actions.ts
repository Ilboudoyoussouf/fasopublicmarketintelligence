"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { createActionToken, readActionToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/notifications/email";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

const registerSchema = z.object({
  fullName: z.string().min(2, "Nom complet requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function registerAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "Un compte existe déjà avec cet email." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({ data: { email, fullName: parsed.data.fullName, passwordHash } });

  const token = createActionToken("verify-email", email);
  const url = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/verification-email?token=${token}`;
  await sendEmail(email, "Vérifiez votre adresse email", `Cliquez pour vérifier votre compte : ${url}`);

  redirect(`/verification-email?sent=1&demoLink=${encodeURIComponent(url)}`);
}

export async function verifyEmailAction(token: string): Promise<ActionResult> {
  const payload = readActionToken(token, "verify-email");
  if (!payload) return { ok: false, error: "Lien invalide ou expiré." };
  await prisma.user.update({ where: { email: payload.email }, data: { emailVerifiedAt: new Date() } });
  return { ok: true };
}

const forgotSchema = z.object({ email: z.string().email() });

export async function requestPasswordResetAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = forgotSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { ok: false, error: "Email invalide" };
  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  // Ne pas révéler si le compte existe.
  if (user) {
    const token = createActionToken("reset-password", email, 30);
    const url = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/reinitialisation?token=${token}`;
    await sendEmail(email, "Réinitialisation de mot de passe", `Lien de réinitialisation : ${url}`);
    redirect(`/mot-de-passe-oublie?sent=1&demoLink=${encodeURIComponent(url)}`);
  }
  redirect(`/mot-de-passe-oublie?sent=1`);
}

const resetSchema = z.object({ token: z.string(), password: z.string().min(8, "8 caractères minimum") });

export async function resetPasswordAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = resetSchema.safeParse({ token: formData.get("token"), password: formData.get("password") });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  const payload = readActionToken(parsed.data.token, "reset-password");
  if (!payload) return { ok: false, error: "Lien invalide ou expiré." };
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.update({ where: { email: payload.email }, data: { passwordHash } });
  return { ok: true };
}

export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: (formData.get("callbackUrl") as string) || "/dashboard",
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Email ou mot de passe incorrect." };
    }
    throw error;
  }
}
