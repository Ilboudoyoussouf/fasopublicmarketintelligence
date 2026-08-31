import { requireTenantContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { updateUserProfileAction } from "@/app/(app)/compte/actions";
import { AccountTabs } from "@/components/domain/AccountTabs";

export default async function ProfilPage() {
  const { session } = await requireTenantContext();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <AccountTabs />
      <Card>
        <CardHeader><CardTitle>Profil utilisateur</CardTitle></CardHeader>
        <CardBody>
          <form action={updateUserProfileAction} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted">Nom complet</label>
              <input name="fullName" defaultValue={user.fullName} className="input" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted">Email</label>
              <input value={user.email} disabled className="input opacity-60" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted">Téléphone</label>
              <input name="phone" defaultValue={user.phone ?? ""} className="input" placeholder="+226 70 00 00 00" />
            </div>
            <button type="submit" className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white">Enregistrer</button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
