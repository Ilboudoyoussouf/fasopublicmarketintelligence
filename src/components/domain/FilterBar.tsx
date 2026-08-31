"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

export type FilterField =
  | { type: "search"; name: string; placeholder: string }
  | { type: "select"; name: string; label: string; options: { value: string; label: string }[] };

export function FilterBar({ fields }: { fields: FilterField[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function setParam(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {fields.map((f) => {
        if (f.type === "search") {
          return (
            <input
              key={f.name}
              defaultValue={searchParams.get(f.name) ?? ""}
              placeholder={f.placeholder}
              onKeyDown={(e) => {
                if (e.key === "Enter") setParam(f.name, e.currentTarget.value);
              }}
              onBlur={(e) => setParam(f.name, e.currentTarget.value)}
              className="input max-w-xs"
            />
          );
        }
        return (
          <select key={f.name} defaultValue={searchParams.get(f.name) ?? ""} onChange={(e) => setParam(f.name, e.target.value)} className="input w-auto">
            <option value="">{f.label}</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        );
      })}
    </div>
  );
}
