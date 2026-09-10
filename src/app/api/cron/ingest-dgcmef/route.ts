import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runFullIngestion } from "@/lib/ingestion/pipeline";

export const maxDuration = 300; // 5 min — le crawl + l'extraction de plusieurs PDF peuvent prendre du temps

/**
 * Robot d'ingestion quotidien — section 3 : « La source DGCMEF doit être
 * surveillée automatiquement. » Déclenché par le cron Vercel défini dans
 * vercel.json (une fois par jour). Peut aussi être appelé manuellement
 * depuis /admin/sources (bouton « Lancer une importation ») ou en CLI
 * (`npm run ingest`) — les trois chemins passent par le même pipeline.
 *
 * Sécurisé par CRON_SECRET : Vercel ajoute automatiquement l'en-tête
 * `Authorization: Bearer <CRON_SECRET>` sur les invocations programmées
 * dès que cette variable d'environnement est définie sur le projet.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const sources = await prisma.source.findMany({ where: { isActive: true } });
  const results: { source: string; ok: boolean; publicationsScanned?: number; newDocuments?: number; republishedBlocks?: number; error?: string }[] = [];

  for (const source of sources) {
    try {
      const result = await runFullIngestion(source.id);
      const republishedBlocks = result.results.reduce((sum, r) => sum + ("republishedBlocks" in r ? (r.republishedBlocks ?? 0) : 0), 0);
      results.push({ source: source.name, ok: true, publicationsScanned: result.publicationsScanned, newDocuments: result.newDocuments, republishedBlocks });
      await prisma.auditLog.create({
        data: { action: "CRON_INGESTION", entityType: "Source", entityId: source.id, after: { publicationsScanned: result.publicationsScanned, newDocuments: result.newDocuments } },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ source: source.name, ok: false, error: message });
      await prisma.auditLog.create({ data: { action: "CRON_INGESTION_FAILED", entityType: "Source", entityId: source.id, after: { error: message } } });
    }
  }

  return NextResponse.json({ ranAt: new Date().toISOString(), results });
}
