import { cn } from "@/lib/utils";
import { daysUntil } from "@/lib/utils";

// Échelle d'urgence temporelle — section 12.2 : « Le temps restant est
// l'information la plus importante de l'écran. » Échelle dédiée aux
// échéances de dépôt, jamais réutilisée pour un autre usage.
export function UrgencyBadge({ deadline, className }: { deadline: Date | string | null | undefined; className?: string }) {
  const days = daysUntil(deadline);
  if (days === null) return null;

  let cls = "urgency-far";
  let label: string;
  if (days < 0) {
    cls = "urgency-j1";
    label = "Échéance dépassée";
  } else if (days <= 1) {
    cls = "urgency-j1";
    label = days === 0 ? "Dépôt aujourd'hui" : "J-1";
  } else if (days <= 3) {
    cls = "urgency-j3";
    label = `J-${days}`;
  } else if (days <= 7) {
    cls = "urgency-j7";
    label = `J-${days}`;
  } else if (days <= 15) {
    cls = "urgency-j15";
    label = `J-${days}`;
  } else {
    return <span className={cn("text-xs text-ink-faint", className)}>J-{days}</span>;
  }

  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums", cls, className)}>
      {label}
    </span>
  );
}
