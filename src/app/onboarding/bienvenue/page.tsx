import { prisma } from "@/lib/prisma";
import { OnboardingWizard } from "./OnboardingWizard";

export default async function OnboardingBienvenuePage() {
  const [sectors, regions] = await Promise.all([
    prisma.sector.findMany({ orderBy: [{ group: "asc" }, { name: "asc" }] }),
    prisma.region.findMany({ where: { country: { code: "BF" } }, orderBy: { name: "asc" } }),
  ]);

  return <OnboardingWizard sectors={sectors} regions={regions} />;
}
