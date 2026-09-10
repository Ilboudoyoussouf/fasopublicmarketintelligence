"use client";

import { Search, Bell, HelpCircle, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOutAction, switchTenantAction } from "@/app/(app)/actions";
import { cn } from "@/lib/utils";

export function Topbar({
  userName,
  planLabel,
  unreadAlerts,
  tenants,
  activeTenantId,
}: {
  userName: string;
  planLabel: string;
  unreadAlerts: number;
  tenants: { id: string; name: string; role: string }[];
  activeTenantId: string | null;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [tenantMenuOpen, setTenantMenuOpen] = useState(false);
  const activeTenant = tenants.find((t) => t.id === activeTenantId);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-paper px-4">
      <form
        className="relative flex-1 max-w-xl"
        onSubmit={(e) => {
          e.preventDefault();
          const q = new FormData(e.currentTarget).get("q");
          if (q) router.push(`/recherche?q=${encodeURIComponent(String(q))}`);
        }}
      >
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          name="q"
          placeholder="Rechercher : « marchés informatiques à Ouagadougou de plus de 20 millions »"
          className="w-full rounded-md border border-line bg-paper-sunken py-1.5 pl-8 pr-3 text-sm placeholder:text-ink-faint focus:border-brand focus:outline-none"
        />
      </form>

      {tenants.length > 1 && (
        <div className="relative">
          <button type="button" onClick={() => setTenantMenuOpen((v) => !v)} className="flex items-center gap-1 rounded-md border border-line px-2 py-1.5 text-xs text-ink-muted hover:bg-surface-elevated">
            {activeTenant?.name ?? "Organisation"}
            <ChevronDown className="h-3 w-3" />
          </button>
          {tenantMenuOpen && (
            <div className="absolute right-0 z-40 mt-1 w-56 rounded-md border border-line bg-paper py-1 shadow-lg">
              {tenants.map((t) => (
                <button
                  key={t.id}
                  onClick={async () => {
                    await switchTenantAction(t.id);
                    setTenantMenuOpen(false);
                    router.refresh();
                  }}
                  className={cn("block w-full px-3 py-1.5 text-left text-xs hover:bg-surface-elevated", t.id === activeTenantId && "font-semibold text-brand")}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Link href="/veille/alertes" className="relative rounded-md p-2 text-ink-muted hover:bg-surface-elevated" aria-label="Notifications">
        <Bell className="h-4.5 w-4.5" />
        {unreadAlerts > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[10px] font-medium text-white">
            {unreadAlerts > 9 ? "9+" : unreadAlerts}
          </span>
        )}
      </Link>

      <Link href="/aide" className="rounded-md p-2 text-ink-muted hover:bg-surface-elevated" aria-label="Aide">
        <HelpCircle className="h-4.5 w-4.5" />
      </Link>

      <div className="relative">
        <button type="button" onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-surface-elevated">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
            {userName.slice(0, 1).toUpperCase()}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-medium text-ink leading-tight">{userName}</p>
            <p className="text-[11px] text-ink-faint leading-tight">{planLabel}</p>
          </div>
        </button>
        {menuOpen && (
          <div className="absolute right-0 z-40 mt-1 w-48 rounded-md border border-line bg-paper py-1 shadow-lg">
            <Link href="/compte/profil" className="block px-3 py-1.5 text-xs text-ink-muted hover:bg-surface-elevated">Profil utilisateur</Link>
            <Link href="/compte/abonnement" className="block px-3 py-1.5 text-xs text-ink-muted hover:bg-surface-elevated">Abonnement</Link>
            <Link href="/compte/securite" className="block px-3 py-1.5 text-xs text-ink-muted hover:bg-surface-elevated">Sécurité</Link>
            <button onClick={() => signOutAction()} className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-xs text-critical hover:bg-critical-soft">
              <LogOut className="h-3.5 w-3.5" /> Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
