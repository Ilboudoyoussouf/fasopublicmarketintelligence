import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { UrgencyBadge } from "@/components/ui/UrgencyBadge";
import { formatFcfa, formatDate } from "@/lib/utils";
import { MARKET_STATUS_LABEL, MARKET_STATUS_TONE, PROCEDURE_TYPE_LABEL } from "@/lib/labels";
import type { Market, ContractingAuthority, Sector, Region } from "@prisma/client";

type MarketRowData = Market & {
  contractingAuthority: ContractingAuthority;
  sector: Sector | null;
  region: Region | null;
};

export function MarketRow({ market, score }: { market: MarketRowData; score?: number }) {
  return (
    <Link href={`/marches/${market.id}`} className="group block rounded-[var(--radius-md)] border border-line bg-paper p-3.5 transition-colors duration-150 hover:bg-surface-elevated">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={MARKET_STATUS_TONE[market.status]}>{MARKET_STATUS_LABEL[market.status]}</Badge>
            {market.sector && <Badge tone="neutral">{market.sector.name}</Badge>}
            <UrgencyBadge deadline={market.submissionDeadline} />
          </div>
          <p className="truncate text-sm font-medium text-ink group-hover:text-brand">{market.title}</p>
          <p className="mt-0.5 truncate text-xs text-ink-muted">
            {market.contractingAuthority.name} · {PROCEDURE_TYPE_LABEL[market.procedureType]}
            {market.region ? ` · ${market.region.name}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="num text-sm font-semibold text-ink">{formatFcfa(market.amountEstimatedExclTax?.toString())}</p>
          <p className="text-[11px] text-ink-faint">échéance {formatDate(market.submissionDeadline)}</p>
          {score !== undefined && <p className="num mt-1 text-xs font-semibold text-brand">Score {Math.round(score)}/100</p>}
        </div>
      </div>
    </Link>
  );
}
