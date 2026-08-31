import { cn } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/Card";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

// Une carte doit répondre à une question, avec période et source — section 56.
export function StatCard({
  label,
  value,
  period,
  delta,
  deltaLabel,
  source,
  className,
}: {
  label: string;
  value: string;
  period?: string;
  delta?: number; // positif = favorable (vert), négatif = attention
  deltaLabel?: string;
  source?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardBody className="space-y-1.5">
        <p className="text-xs font-medium text-ink-muted">{label}</p>
        <p className="text-2xl font-semibold tracking-tight text-ink">{value}</p>
        <div className="flex items-center gap-2 text-xs">
          {delta !== undefined && (
            <span className={cn("inline-flex items-center gap-0.5 font-medium", delta >= 0 ? "text-success" : "text-critical")}>
              {delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {delta >= 0 ? "+" : ""}
              {delta}%
            </span>
          )}
          {deltaLabel ? <span className="text-ink-faint">{deltaLabel}</span> : null}
        </div>
        {(period || source) && (
          <p className="pt-1 text-[11px] text-ink-faint">
            {period}
            {period && source ? " · " : ""}
            {source}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
