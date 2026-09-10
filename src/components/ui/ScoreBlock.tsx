import { cn } from "@/lib/utils";

function scoreTone(value: number) {
  if (value >= 75) return "text-success";
  if (value >= 50) return "text-warning";
  return "text-critical";
}

function scoreBarTone(value: number) {
  if (value >= 75) return "bg-success";
  if (value >= 50) return "bg-warning";
  return "bg-critical";
}

// Étiquette qualitative — le score doit toujours se lire d'un coup d'œil, jamais comme un simple nombre (§13).
export function scoreLabel(value: number) {
  if (value >= 75) return "Très favorable";
  if (value >= 50) return "Favorable";
  if (value >= 25) return "Peu favorable";
  return "Défavorable";
}

export function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-muted">{label}</span>
        <span className={cn("font-semibold", scoreTone(value))}>{Math.round(value)}/100</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div className={cn("h-full rounded-full", scoreBarTone(value))} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

// Trois scores distincts + score global — section 18. Toujours explicable (section 86).
export function ScoreBlock({
  pertinence,
  eligibilite,
  attractivite,
  global,
  factors,
  compact = false,
}: {
  pertinence: number;
  eligibilite: number;
  attractivite: number;
  global: number;
  factors?: Record<string, unknown> | null;
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-end justify-between">
          <span className="text-xs font-medium text-ink-muted">Score global</span>
          <span className={cn("text-2xl font-bold leading-none", scoreTone(global))}>{Math.round(global)}<span className="text-sm font-normal text-ink-faint">/100</span></span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-line">
          <div className={cn("h-full rounded-full", scoreBarTone(global))} style={{ width: `${Math.max(0, Math.min(100, global))}%` }} />
        </div>
        <p className={cn("text-xs font-semibold", scoreTone(global))}>{scoreLabel(global)}</p>
      </div>
      <div className="space-y-2">
        <ScoreRow label="Pertinence" value={pertinence} />
        <ScoreRow label="Éligibilité" value={eligibilite} />
        <ScoreRow label="Attractivité" value={attractivite} />
      </div>
      {!compact && factors && Object.keys(factors).length > 0 && (
        <details className="rounded-md bg-paper-sunken px-3 py-2 text-xs text-ink-muted">
          <summary className="cursor-pointer font-medium text-ink">Pourquoi ce score ?</summary>
          <ul className="mt-2 space-y-1">
            {Object.entries(factors).map(([k, v]) => (
              <li key={k}>
                <span className="text-ink-faint">{k} : </span>
                {String(v)}
              </li>
            ))}
          </ul>
        </details>
      )}
      <p className="text-[11px] text-ink-faint">Score indicatif — ne constitue ni une décision administrative ni une garantie d&apos;éligibilité (section 63).</p>
    </div>
  );
}
