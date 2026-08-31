import type { PlanTier } from "@prisma/client";

// Modèle d'abonnement — section 50 & 87.
export const PLAN_LABEL: Record<PlanTier, string> = {
  FREE: "Gratuit",
  PRO: "Pro",
  BUSINESS: "Business",
  ENTERPRISE: "Enterprise",
};

export const PLAN_PRICE_FCFA: Record<PlanTier, number | null> = {
  FREE: 0,
  PRO: 45_000,
  BUSINESS: 120_000,
  ENTERPRISE: null, // sur devis
};

export type PlanFeature =
  | "search" | "unlimited_alerts" | "matching" | "scoring" | "history"
  | "team" | "advanced_analytics" | "competition" | "exports" | "advanced_ai"
  | "api" | "priority_support" | "custom_reports";

export const PLAN_FEATURES: Record<PlanTier, PlanFeature[]> = {
  FREE: ["search"],
  PRO: ["search", "unlimited_alerts", "matching", "scoring", "history"],
  BUSINESS: ["search", "unlimited_alerts", "matching", "scoring", "history", "team", "advanced_analytics", "competition", "exports"],
  ENTERPRISE: ["search", "unlimited_alerts", "matching", "scoring", "history", "team", "advanced_analytics", "competition", "exports", "advanced_ai", "api", "priority_support", "custom_reports"],
};

export const FREE_ALERTS_PER_MONTH = 5;

export function planHasFeature(plan: PlanTier, feature: PlanFeature): boolean {
  return PLAN_FEATURES[plan].includes(feature);
}
