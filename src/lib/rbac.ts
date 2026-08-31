// RBAC — section 49 : Owner > Admin > Analyste > Collaborateur > Lecture seule
export type Role = "OWNER" | "ADMIN" | "ANALYST" | "COLLABORATOR" | "READONLY";

const LEVEL: Record<Role, number> = {
  OWNER: 4,
  ADMIN: 3,
  ANALYST: 2,
  COLLABORATOR: 1,
  READONLY: 0,
};

/** true si `role` a au moins le niveau requis par `minimum` */
export function hasAtLeast(role: string, minimum: Role): boolean {
  const level = LEVEL[role as Role] ?? 0;
  return level >= LEVEL[minimum];
}

export const canManageTeam = (role: string) => hasAtLeast(role, "ADMIN");
export const canManageBilling = (role: string) => hasAtLeast(role, "OWNER");
export const canEditProfile = (role: string) => hasAtLeast(role, "ANALYST");
export const canWrite = (role: string) => hasAtLeast(role, "COLLABORATOR");
