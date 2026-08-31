import { requireTenantContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AccountTabs } from "@/components/domain/AccountTabs";
import { inviteMemberAction, removeMemberAction } from "@/app/(app)/compte/actions";
import { canManageTeam } from "@/lib/rbac";
import { TenantRole } from "@prisma/client";
import { RoleSelect } from "@/components/domain/RoleSelect";

const ROLE_LABEL: Record<TenantRole, string> = { OWNER: "Owner", ADMIN: "Admin", ANALYST: "Analyste", COLLABORATOR: "Collaborateur", READONLY: "Lecture seule" };

export default async function EquipePage() {
  const { tenant, role } = await requireTenantContext();
  const members = await prisma.tenantMember.findMany({ where: { tenantId: tenant.id }, include: { user: true }, orderBy: { invitedAt: "asc" } });
  const canManage = canManageTeam(role);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <AccountTabs />

      {canManage && (
        <Card>
          <CardHeader><CardTitle>Inviter un collaborateur</CardTitle></CardHeader>
          <CardBody>
            <form action={inviteMemberAction} className="flex flex-wrap items-end gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-ink-muted">Email</label>
                <input name="email" type="email" required className="input" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">Rôle</label>
                <select name="role" className="input w-40">
                  {Object.entries(ROLE_LABEL).filter(([v]) => v !== "OWNER").map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <button type="submit" className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white">Inviter</button>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Membres ({members.length})</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-md border border-line p-2.5">
              <div>
                <p className="text-sm font-medium text-ink">{m.user.fullName}</p>
                <p className="text-xs text-ink-muted">{m.user.email}{!m.joinedAt ? " · invitation en attente" : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                {canManage && m.role !== "OWNER" ? (
                  <RoleSelect memberId={m.id} role={m.role} />
                ) : (
                  <Badge tone="neutral">{ROLE_LABEL[m.role]}</Badge>
                )}
                {canManage && m.role !== "OWNER" && (
                  <form action={removeMemberAction.bind(null, m.id)}>
                    <button type="submit" className="text-xs text-critical hover:underline">Retirer</button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
