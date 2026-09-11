"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";
import { ICONS } from "@/components/nav/icon-map";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";

export function Sidebar({ isPlatformAdmin }: { isPlatformAdmin: boolean }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <aside className="hidden h-full min-h-0 w-64 shrink-0 flex-col overflow-hidden border-r border-line bg-bg-secondary lg:flex">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-brand text-xs font-bold text-white">FP</div>
        <span className="text-sm font-semibold text-ink">FASO Market Intel</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV.map((group) => {
          const Icon = ICONS[group.icon];
          const isCollapsed = collapsed[group.label];
          const groupActive = group.items.some((i) => pathname.startsWith(i.href.split("?")[0]));
          return (
            <div key={group.label} className="mb-1">
              <button
                type="button"
                onClick={() => setCollapsed((c) => ({ ...c, [group.label]: !c[group.label] }))}
                className={cn(
                  "flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-sm font-medium",
                  groupActive ? "text-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                {Icon ? <Icon className={cn("h-4 w-4", groupActive ? "text-brand" : undefined)} /> : null}
                <span className="flex-1">{group.label}</span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isCollapsed && "-rotate-90")} />
              </button>
              {!isCollapsed && (
                <ul className="ml-6 mt-0.5 space-y-0.5 border-l border-line pl-3">
                  {group.items.map((item) => {
                    const active = pathname === item.href.split("?")[0] || (pathname.startsWith(item.href.split("?")[0]) && item.href.split("?")[0] !== "/dashboard");
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "block rounded-[var(--radius-sm)] border-l-2 px-2 py-1 text-[13px] transition-colors duration-150",
                            active
                              ? "border-brand bg-surface-elevated font-medium text-ink"
                              : "border-transparent text-ink-muted hover:bg-surface-elevated hover:text-ink",
                          )}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
        {isPlatformAdmin && (
          <Link
            href="/admin"
            className="mt-3 flex items-center gap-2 rounded-[var(--radius-sm)] bg-surface-elevated px-2 py-1.5 text-sm font-medium text-ink-muted hover:text-ink"
          >
            <ShieldCheck className="h-4 w-4" />
            Administration SaaS
          </Link>
        )}
      </nav>
    </aside>
  );
}
