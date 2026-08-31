"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACCOUNT_NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function AccountTabs() {
  const pathname = usePathname();
  return (
    <div className="flex flex-wrap gap-1.5 border-b border-line pb-3">
      {ACCOUNT_NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium",
            pathname === item.href ? "bg-brand text-white" : "bg-paper-sunken text-ink-muted hover:text-ink",
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
