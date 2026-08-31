import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { AccountTabs } from "@/components/domain/AccountTabs";
import { Check, Minus } from "lucide-react";

const ROLES = ["Owner", "Admin", "Analyste", "Collaborateur", "Lecture seule"];
const CAPABILITIES = [
  { label: "Consulter les marchés et analyses", allowed: [true, true, true, true, true] },
  { label: "Suivre / créer des watchlists", allowed: [true, true, true, true, false] },
  { label: "Modifier le profil entreprise", allowed: [true, true, true, false, false] },
  { label: "Gérer l'équipe et les rôles", allowed: [true, true, false, false, false] },
  { label: "Gérer l'abonnement et la facturation", allowed: [true, false, false, false, false] },
];

export default function RolesPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <AccountTabs />
      <Card>
        <CardHeader><CardTitle>Rôles et permissions</CardTitle></CardHeader>
        <CardBody className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left text-xs text-ink-faint"></th>
                {ROLES.map((r) => <th key={r} className="p-2 text-center text-xs font-medium text-ink-muted">{r}</th>)}
              </tr>
            </thead>
            <tbody>
              {CAPABILITIES.map((c) => (
                <tr key={c.label} className="border-t border-line">
                  <td className="p-2 text-xs text-ink-muted">{c.label}</td>
                  {c.allowed.map((a, i) => (
                    <td key={i} className="p-2 text-center">
                      {a ? <Check className="mx-auto h-4 w-4 text-success" /> : <Minus className="mx-auto h-4 w-4 text-ink-faint" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
