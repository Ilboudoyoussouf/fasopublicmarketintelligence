import { requireTenantContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/nav/Sidebar";
import { Topbar } from "@/components/nav/Topbar";
import { MobileNav } from "@/components/nav/MobileNav";
import { PLAN_LABEL } from "@/lib/plans";
import { ComplianceFooter } from "@/components/domain/ComplianceFooter";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { session, tenant } = await requireTenantContext();

  const unreadAlerts = await prisma.alert.count({ where: { tenantId: tenant.id, readAt: null } });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isPlatformAdmin={session.user.isPlatformAdmin} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Topbar
          userName={session.user.name ?? session.user.email ?? "Utilisateur"}
          planLabel={PLAN_LABEL[tenant.subscription?.plan ?? "FREE"]}
          unreadAlerts={unreadAlerts}
          tenants={session.tenants}
          activeTenantId={session.activeTenantId}
        />
        {/* Seule cette zone défile : le header et la sidebar restent statiques. */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <main className="px-4 py-5 pb-20 lg:px-6 lg:pb-6">{children}</main>
          <ComplianceFooter />
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
