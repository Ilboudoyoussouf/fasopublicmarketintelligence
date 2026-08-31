"use client";

import { useTransition } from "react";
import { updateMemberRoleAction } from "@/app/(app)/compte/actions";
import type { TenantRole } from "@prisma/client";

const ROLE_LABEL: Record<TenantRole, string> = { OWNER: "Owner", ADMIN: "Admin", ANALYST: "Analyste", COLLABORATOR: "Collaborateur", READONLY: "Lecture seule" };

export function RoleSelect({ memberId, role }: { memberId: string; role: TenantRole }) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      defaultValue={role}
      disabled={pending}
      onChange={(e) => startTransition(() => updateMemberRoleAction(memberId, e.target.value as TenantRole))}
      className="input w-36"
    >
      {Object.entries(ROLE_LABEL).filter(([v]) => v !== "OWNER").map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
