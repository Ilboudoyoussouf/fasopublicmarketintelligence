"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ADMIN_NAV } from "@/lib/nav";
import { Menu, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-paper px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand" />
          <span className="text-sm font-semibold text-ink">Administration</span>
        </div>
        <button type="button" onClick={() => setOpen(true)} aria-label="Menu d'administration" className="rounded-[var(--radius-sm)] p-2 text-ink-muted hover:bg-surface-elevated">
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 lg:hidden" onClick={() => setOpen(false)}>
          <div className="h-full w-72 max-w-[85vw] overflow-y-auto bg-paper p-3" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-ink">Administration</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="rounded-[var(--radius-sm)] p-1.5 text-ink-muted hover:bg-surface-elevated">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="space-y-0.5">
              {ADMIN_NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-[var(--radius-sm)] border-l-2 px-2.5 py-2 text-sm",
                      active ? "border-brand bg-surface-elevated font-medium text-ink" : "border-transparent text-ink-muted hover:bg-surface-elevated hover:text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 border-t border-line pt-3">
              <Link href="/dashboard" onClick={() => setOpen(false)} className="block px-2.5 text-xs text-ink-muted hover:text-brand">← Retour à l&apos;application</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
