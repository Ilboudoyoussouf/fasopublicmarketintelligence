"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function Pagination({ total, page, pageSize }: { total: number; page: number; pageSize: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (pageCount <= 1) return null;

  function go(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-between text-xs text-ink-muted">
      <span>Page {page} sur {pageCount}</span>
      <div className="flex gap-2">
        <Button size="sm" disabled={page <= 1} onClick={() => go(page - 1)}>Précédent</Button>
        <Button size="sm" disabled={page >= pageCount} onClick={() => go(page + 1)}>Suivant</Button>
      </div>
    </div>
  );
}
