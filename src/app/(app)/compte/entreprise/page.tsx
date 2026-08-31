import { requireTenantContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { updateTenantProfileAction } from "@/app/(app)/compte/actions";
import { AccountTabs } from "@/components/domain/AccountTabs";
import { ScoreRow } from "@/components/ui/ScoreBlock";
import Link from "next/link";

export default async function EntrepriseProfilPage() {
  const { tenant } = await requireTenantContext();
  const [sectors, licenses, references, documents] = await Promise.all([
    prisma.tenantSector.count({ where: { tenantId: tenant.id } }),
    prisma.tenantLicense.count({ where: { tenantId: tenant.id } }),
    prisma.tenantReference.count({ where: { tenantId: tenant.id } }),
    prisma.tenantDocument.count({ where: { tenantId: tenant.id, status: "VALID" } }),
  ]);

  const completude = {
    secteurs: sectors > 0 ? 100 : 0,
    agréments: licenses > 0 ? 80 : 0,
    références: references > 0 ? 90 : 0,
    documents: Math.min(documents * 25, 100),
    capacités: tenant.revenueBand ? 85 : 30,
  };
  const overall = Math.round(Object.values(completude).reduce((a, b) => a + b, 0) / Object.keys(completude).length);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <AccountTabs />

      <Card>
        <CardHeader><CardTitle>Profil complétude : {overall}%</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          {Object.entries(completude).map(([label, value]) => <ScoreRow key={label} label={capitalize(label)} value={value} />)}
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Informations générales</CardTitle></CardHeader>
        <CardBody>
          <form action={updateTenantProfileAction} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted">Raison sociale</label>
              <input name="name" defaultValue={tenant.name} className="input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Taille</label>
                <input name="size" defaultValue={tenant.size ?? ""} className="input" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Région du siège</label>
                <input name="regionName" defaultValue={tenant.regionName ?? ""} className="input" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Chiffre d&apos;affaires</label>
                <input name="revenueBand" defaultValue={tenant.revenueBand ?? ""} className="input" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Années d&apos;expérience</label>
                <input name="experienceYears" type="number" defaultValue={tenant.experienceYears ?? 0} className="input" />
              </div>
            </div>
            <button type="submit" className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white">Enregistrer</button>
          </form>
        </CardBody>
      </Card>

      <Link href="/compte/entreprise/documents" className="block text-sm text-brand hover:underline">Gérer les documents de l&apos;entreprise →</Link>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
