import { cn } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/Card";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Sparkline } from "@/components/charts/Charts";

// Une carte doit répondre à une question, avec période et source — section 56.
// Format KPI de la charte graphique (§10) : valeur, variation, période de
// comparaison, tendance, contexte.
export function StatCard({
  label,
  value,
  period,
  delta,
  deltaLabel,
  source,
  sparkline,
  className,
}: {
  label: string;
  value: string;
  period?: string;
  delta?: number; // positif = favorable (vert), négatif = attention
  deltaLabel?: string;
  source?: string;
  sparkline?: number[];
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardBody className="space-y-1.5 p-3 sm:p-4">
        <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">{label}</p>
        <p className="num text-xl font-bold tracking-tight text-ink break-words sm:text-2xl">{value}</p>
        <div className="flex items-center gap-2 text-xs">
          {delta !== undefined && (
            <span className={cn("num inline-flex items-center gap-0.5 font-medium", delta >= 0 ? "text-success" : "text-critical")}>
              {delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {delta >= 0 ? "+" : ""}
              {delta}%
            </span>
          )}
          {deltaLabel ? <span className="text-ink-faint">{deltaLabel}</span> : null}
        </div>
        {sparkline && sparkline.length > 1 && <Sparkline data={sparkline} />}
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
