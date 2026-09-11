import { requirePlatformAdmin } from "@/lib/session";
import Link from "next/link";
import { ADMIN_NAV } from "@/lib/nav";
import { ShieldCheck } from "lucide-react";
import { AdminNavLink } from "@/components/domain/AdminNavLink";
import { AdminMobileNav } from "@/components/nav/AdminMobileNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden h-full min-h-0 w-60 shrink-0 flex-col overflow-hidden border-r border-line bg-paper lg:flex">
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-4">
          <ShieldCheck className="h-5 w-5 text-brand" />
          <span className="text-sm font-semibold text-ink">Administration</span>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {ADMIN_NAV.map((item) => <AdminNavLink key={item.href} href={item.href} label={item.label} />)}
        </nav>
        <div className="shrink-0 border-t border-line p-3">
          <Link href="/dashboard" className="text-xs text-ink-muted hover:text-brand">← Retour à l&apos;application</Link>
        </div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AdminMobileNav />
        <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
