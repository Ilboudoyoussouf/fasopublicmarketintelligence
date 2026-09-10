"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Target, Gavel, Sparkles, Menu } from "lucide-react";
import { useState } from "react";
import { NAV } from "@/lib/nav";

const PRIMARY = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Opportunités", href: "/opportunites", icon: Target },
  { label: "Marchés", href: "/marches", icon: Gavel },
  { label: "IA", href: "/ia", icon: Sparkles },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-center justify-around border-t border-line bg-paper lg:hidden">
        {PRIMARY.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-0.5 text-[10px]", active ? "text-brand" : "text-ink-faint")}>
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        <button type="button" onClick={() => setOpen(true)} className="flex flex-col items-center gap-0.5 text-[10px] text-ink-faint">
          <Menu className="h-5 w-5" />
          Plus
        </button>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/30 lg:hidden" onClick={() => setOpen(false)}>
          <div className="max-h-[75vh] w-full overflow-y-auto rounded-t-xl bg-paper p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 h-1 w-10 rounded-full bg-line mx-auto" />
            {NAV.map((group) => (
              <div key={group.label} className="mb-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">{group.label}</p>
                <ul className="grid grid-cols-2 gap-1">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} onClick={() => setOpen(false)} className="block rounded-md px-2 py-1.5 text-sm text-ink-muted hover:bg-surface-elevated">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
