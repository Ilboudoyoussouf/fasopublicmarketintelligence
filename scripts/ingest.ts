// CLI d'ingestion — exécutable en tâche planifiée (cron) ou manuellement :
//   npx tsx scripts/ingest.ts [nom-de-la-source]
// Sans accès réseau sortant vers la source (cas de cet environnement de
// développement), le téléchargement échoue proprement et les documents
// restent en file d'attente pour une reprise ultérieure (section 94).
import { PrismaClient } from "@prisma/client";
import { runFullIngestion } from "../src/lib/ingestion/pipeline";

const db = new PrismaClient();

async function main() {
  const sourceName = process.argv[2] ?? "DGCMEF";
  const source = await db.source.findFirst({ where: { name: sourceName } });
  if (!source) {
    console.error(`Source introuvable : ${sourceName}`);
    process.exit(1);
  }

  console.log(`→ Ingestion de la source ${source.name} (${source.baseUrl})`);
  const result = await runFullIngestion(source.id);
  console.log(`  Publications analysées : ${result.publicationsScanned}`);
  console.log(`  Nouveaux documents     : ${result.newDocuments}`);
  for (const r of result.results) {
    console.log(`  - ${r.documentId} → ${r.status}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
