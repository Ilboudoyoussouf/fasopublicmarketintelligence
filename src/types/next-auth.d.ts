import type { SessionTenant } from "@/lib/auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      isPlatformAdmin: boolean;
    };
    tenants: SessionTenant[];
    activeTenantId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    isPlatformAdmin?: boolean;
    tenants?: SessionTenant[];
    activeTenantId?: string;
  }
}
