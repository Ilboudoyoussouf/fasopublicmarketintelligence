"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AdminNavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link href={href} className={cn("block rounded-md px-2 py-1.5 text-[13px]", active ? "bg-brand-soft font-medium text-brand" : "text-ink-muted hover:bg-surface-elevated hover:text-ink")}>
      {label}
    </Link>
  );
}
