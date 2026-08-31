import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { AccountTabs } from "@/components/domain/AccountTabs";
import { changePasswordAction } from "@/app/(app)/compte/actions";
import { ShieldCheck } from "lucide-react";

export default function SecuritePage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <AccountTabs />
      <Card>
        <CardHeader><CardTitle>Changer le mot de passe</CardTitle></CardHeader>
        <CardBody>
          <form action={changePasswordAction} className="space-y-3">
            <input name="currentPassword" type="password" required placeholder="Mot de passe actuel" className="input" />
            <input name="newPassword" type="password" required minLength={8} placeholder="Nouveau mot de passe" className="input" />
            <button type="submit" className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white">Mettre à jour</button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Authentification à deux facteurs</CardTitle></CardHeader>
        <CardBody className="flex items-center gap-2 text-sm text-ink-muted">
          <ShieldCheck className="h-4 w-4 text-ink-faint" />
          Recommandée pour les comptes Owner/Admin — activable prochainement.
        </CardBody>
      </Card>
    </div>
  );
}
