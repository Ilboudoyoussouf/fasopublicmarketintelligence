import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type SessionTenant = { id: string; name: string; role: string };

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/connexion" },
  providers: [
    Credentials({
      name: "Identifiants",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          await prisma.loginEvent.create({ data: { userId: user.id, success: false } }).catch(() => {});
          return null;
        }
        await prisma.loginEvent.create({ data: { userId: user.id, success: true } }).catch(() => {});

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          isPlatformAdmin: user.isPlatformAdmin,
        } as { id: string; email: string; name: string; isPlatformAdmin: boolean };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.uid = user.id as string;
        token.isPlatformAdmin = (user as { isPlatformAdmin?: boolean }).isPlatformAdmin ?? false;
      }

      // (re)load tenant memberships whenever we sign in, or on demand
      if (user || trigger === "update") {
        const uid = (token.uid as string) ?? (user?.id as string);
        const memberships = await prisma.tenantMember.findMany({
          where: { userId: uid },
          include: { tenant: true },
          orderBy: { joinedAt: "asc" },
        });
        token.tenants = memberships.map((m) => ({ id: m.tenant.id, name: m.tenant.name, role: m.role })) as SessionTenant[];

        const requestedTenantId = (trigger === "update" ? (session as { activeTenantId?: string } | undefined)?.activeTenantId : undefined);
        const stillValid = requestedTenantId && memberships.some((m) => m.tenantId === requestedTenantId);
        token.activeTenantId = stillValid ? requestedTenantId : (token.activeTenantId as string | undefined) ?? memberships[0]?.tenantId;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.uid as string;
      session.user.isPlatformAdmin = Boolean(token.isPlatformAdmin);
      session.tenants = (token.tenants as SessionTenant[]) ?? [];
      session.activeTenantId = (token.activeTenantId as string | undefined) ?? null;
      return session;
    },
  },
});
