import { requireTenantContext } from "@/lib/session";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { AccountTabs } from "@/components/domain/AccountTabs";
import { updateNotificationPreferencesAction } from "@/app/(app)/compte/actions";

export default async function NotificationsPage() {
  const { tenant } = await requireTenantContext();
  const prefs = (tenant.preferences as { canauxAlerte?: string[]; frequenceBriefing?: string } | null) ?? {};
  const channels = prefs.canauxAlerte ?? ["APP"];

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <AccountTabs />
      <Card>
        <CardHeader><CardTitle>Préférences de notifications</CardTitle></CardHeader>
        <CardBody>
          <form action={updateNotificationPreferencesAction} className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium text-ink-muted">Canaux d&apos;alerte</p>
              <div className="space-y-1.5">
                {[
                  { value: "APP", label: "Application" },
                  { value: "EMAIL", label: "Email" },
                  { value: "WHATSAPP", label: "WhatsApp" },
                  { value: "PUSH", label: "Notification push" },
                ].map((c) => (
                  <label key={c.value} className="flex items-center gap-2 text-sm text-ink">
                    <input type="checkbox" name="channels" value={c.value} defaultChecked={channels.includes(c.value)} />
                    {c.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted">Fréquence du briefing</label>
              <select name="frequency" defaultValue={prefs.frequenceBriefing ?? "QUOTIDIEN"} className="input">
                <option value="QUOTIDIEN">Quotidien</option>
                <option value="HEBDOMADAIRE">Hebdomadaire</option>
              </select>
            </div>
            <button type="submit" className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white">Enregistrer</button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
