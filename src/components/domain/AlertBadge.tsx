import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { AlertPriority, AlertType } from "@prisma/client";

const TONE: Record<AlertPriority, BadgeTone> = {
  CRITIQUE: "critical",
  IMPORTANTE: "warning",
  NORMALE: "info",
  INFORMATION: "neutral",
};

const DOT: Record<AlertPriority, string> = {
  CRITIQUE: "bg-critical",
  IMPORTANTE: "bg-warning",
  NORMALE: "bg-info",
  INFORMATION: "bg-ink-faint",
};

export const PRIORITY_LABEL: Record<AlertPriority, string> = {
  CRITIQUE: "Critique",
  IMPORTANTE: "Importante",
  NORMALE: "Normale",
  INFORMATION: "Information",
};

export const ALERT_TYPE_LABEL: Record<AlertType, string> = {
  NEW_MATCHING_MARKET: "Nouveau marché correspondant",
  DEADLINE_APPROACHING: "Échéance proche",
  CORRECTION: "Rectification",
  CANCELLATION: "Annulation",
  RESULT: "Résultat",
  AWARD: "Attribution",
  APPEAL: "Recours",
  REVIEW: "Réexamen",
  PPM_MATCH: "Correspondance PPM",
  DOCUMENT_EXPIRING: "Document expirant",
  NEW_TREND: "Nouvelle tendance",
};

export function alertPriorityTone(priority: AlertPriority) {
  return DOT[priority];
}

export function AlertPriorityBadge({ priority }: { priority: AlertPriority }) {
  return <Badge tone={TONE[priority]}>{PRIORITY_LABEL[priority]}</Badge>;
}
