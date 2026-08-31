import { requireTenantContext } from "@/lib/session";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { AccountTabs } from "@/components/domain/AccountTabs";
import { Badge } from "@/components/ui/Badge";
import { changePlanAction } from "@/app/(app)/compte/actions";
import { PLAN_LABEL, PLAN_PRICE_FCFA, PLAN_FEATURES, type PlanFeature } from "@/lib/plans";
import { canManageBilling } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
import { Check } from "lucide-react";
import type { PlanTier } from "@prisma/client";

const FEATURE_LABEL: Record<PlanFeature, string> = {
  search: "Recherche & consultation", unlimited_alerts: "Alertes illimitées", matching: "Matching automatique",
  scoring: "Scores explicables", history: "Historique complet", team: "Équipe multi-utilisateurs",
  advanced_analytics: "Analyses avancées", competition: "Intelligence concurrentielle", exports: "Exports (CSV/Excel/PDF)",
  advanced_ai: "IA avancée", api: "Accès API", priority_support: "Support prioritaire", custom_reports: "Rapports personnalisés",
};

export default async function AbonnementPage() {
  const { tenant, role } = await requireTenantContext();
  const sub = tenant.subscription;
  const canManage = canManageBilling(role);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <AccountTabs />

      <Card>
        <CardHeader><CardTitle>Abonnement actuel</CardTitle></CardHeader>
        <CardBody className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-ink">{PLAN_LABEL[sub?.plan ?? "FREE"]}</p>
            <p className="text-xs text-ink-muted">
              Statut : {sub?.status ?? "—"}{sub?.currentPeriodEnd ? ` · renouvellement le ${formatDate(sub.currentPeriodEnd)}` : ""}
            </p>
          </div>
          <Badge tone={sub?.status === "ACTIVE" ? "success" : "warning"}>{sub?.status ?? "AUCUN"}</Badge>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(PLAN_LABEL) as PlanTier[]).map((plan) => (
          <Card key={plan} className={plan === sub?.plan ? "border-brand" : ""}>
            <CardBody className="flex h-full flex-col">
              <p className="text-sm font-semibold text-ink">{PLAN_LABEL[plan]}</p>
              <p className="mt-1 text-lg font-bold text-ink">
                {PLAN_PRICE_FCFA[plan] === null ? "Sur devis" : PLAN_PRICE_FCFA[plan] === 0 ? "Gratuit" : `${PLAN_PRICE_FCFA[plan]!.toLocaleString("fr-FR")} FCFA/mois`}
              </p>
              <ul className="mt-3 flex-1 space-y-1.5">
                {PLAN_FEATURES[plan].map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-ink-muted"><Check className="h-3 w-3 text-success" /> {FEATURE_LABEL[f]}</li>
                ))}
              </ul>
              {canManage && plan !== sub?.plan && (
                <form action={changePlanAction} className="mt-3">
                  <input type="hidden" name="plan" value={plan} />
                  <button type="submit" className="w-full rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white">Choisir ce plan</button>
                </form>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      <p className="text-[11px] text-ink-faint">Paiement simulé dans cet environnement de démonstration (mobile money / carte en production — architecture abstraite, section 51).</p>
    </div>
  );
}
