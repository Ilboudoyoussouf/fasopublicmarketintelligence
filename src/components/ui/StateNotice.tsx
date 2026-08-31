import { cn } from "@/lib/utils";
import {
  Inbox, AlertTriangle, Lock, Clock, Archive, WifiOff, History,
} from "lucide-react";
import type { ReactNode } from "react";

// États UI obligatoires — section 71 du cahier des charges.
export type NoticeKind =
  | "empty" | "error" | "no-permission" | "expired"
  | "archived" | "not-available" | "stale-data" | "partial-data";

const CONFIG: Record<NoticeKind, { icon: typeof Inbox; tone: string }> = {
  empty: { icon: Inbox, tone: "text-ink-faint" },
  error: { icon: AlertTriangle, tone: "text-critical" },
  "no-permission": { icon: Lock, tone: "text-ink-faint" },
  expired: { icon: Clock, tone: "text-warning" },
  archived: { icon: Archive, tone: "text-ink-faint" },
  "not-available": { icon: WifiOff, tone: "text-ink-faint" },
  "stale-data": { icon: History, tone: "text-warning" },
  "partial-data": { icon: AlertTriangle, tone: "text-warning" },
};

export function StateNotice({
  kind,
  title,
  description,
  action,
  className,
}: {
  kind: NoticeKind;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  const { icon: Icon, tone } = CONFIG[kind];
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line px-6 py-12 text-center", className)}>
      <Icon className={cn("h-6 w-6", tone)} strokeWidth={1.5} />
      <p className="text-sm font-medium text-ink">{title}</p>
      {description ? <p className="max-w-sm text-xs text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-line", className)} />;
}

export function SkeletonCard() {
  return (
    <div className="space-y-3 rounded-lg border border-line bg-paper p-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
