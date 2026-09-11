"use client";

import { useState, useTransition } from "react";
import { Search, Loader2 } from "lucide-react";
import { analyzeSourceAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { AnalyzedDocumentPreview } from "@/components/domain/AnalyzedDocumentPreview";
import { useAnalysisPolling } from "@/hooks/useAnalysisPolling";

type DiscoveredDocument = {
  documentId: string;
  filename: string;
  publicationNumero: string;
  publishedAt: Date;
  status: "processing" | "download_failed";
};

// L'extraction Gemini de chaque document découvert est lancée en
// arrière-plan côté serveur (voir useAnalysisPolling) — cette page ne garde
// jamais de requête ouverte le temps que Gemini réponde, ce qui peut prendre
// plusieurs minutes par document et dépasser largement ce que tolère le
// proxy inverse devant l'hébergement de production.
export function SourceAnalysisPanel({ sourceId }: { sourceId: string }) {
  const [analyzing, startAnalyzing] = useTransition();
  const [documents, setDocuments] = useState<DiscoveredDocument[] | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const { statuses, start } = useAnalysisPolling();

  function runAnalysis() {
    setAnalyzeError(null);
    startAnalyzing(async () => {
      try {
        const result = await analyzeSourceAction(sourceId);
        if (!result.ok) {
          setAnalyzeError(result.error);
          return;
        }
        setDocuments(result.analyses);
        for (const a of result.analyses) {
          if (a.status === "processing") start(a.documentId);
        }
      } catch (err) {
        // Une requête réseau interrompue (délai dépassé, coupure) rejette la
        // promesse au lieu de renvoyer { ok: false } — sans ce filet,
        // l'exception non gérée peut donner l'impression que la page a
        // disparu alors que la découverte a peut-être bien eu lieu côté serveur.
        setAnalyzeError(`La requête a échoué ou a pris trop de temps (${err instanceof Error ? err.message : String(err)}). Réessayez.`);
      }
    });
  }

  return (
    <div className="space-y-3">
      <Button variant="secondary" size="sm" onClick={runAnalysis} disabled={analyzing}>
        {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
        {analyzing ? "Recherche en cours…" : "Télécharger et analyser avec Gemini"}
      </Button>
      {analyzeError && <p className="text-[11px] text-critical">Échec : {analyzeError}</p>}

      {documents && documents.length === 0 && <p className="text-[11px] text-ink-faint">Aucun nouveau quotidien trouvé sur la source.</p>}

      {documents?.map((d) => {
        const poll = statuses[d.documentId];
        return (
          <div key={d.documentId} className="rounded-[var(--radius-md)] border border-line">
            <div className="flex flex-col gap-1 border-b border-line px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Quotidien n°{d.publicationNumero}</p>
                <p className="text-[11px] text-ink-faint">{d.filename} · {formatDate(d.publishedAt)}</p>
              </div>
              {poll?.status === "ok" && <Badge tone="info">{poll.notices.length} avis détecté(s)</Badge>}
            </div>

            {d.status === "download_failed" && <p className="px-3 py-2 text-[11px] text-critical">Échec du téléchargement de ce document.</p>}

            {d.status === "processing" && (!poll || poll.status === "processing") && (
              <div className="flex items-center gap-2 px-3 py-4 text-[12px] text-ink-muted">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                Extraction en cours côté serveur — peut prendre plusieurs minutes sur un document volumineux.
              </div>
            )}

            {poll?.status === "gemini_not_configured" && (
              <p className="px-3 py-2 text-[11px] text-warning">Clé Gemini non configurée — l&apos;aperçu n&apos;est disponible qu&apos;avec l&apos;extraction Gemini. Utilisez « Lancer une importation » pour un traitement automatique complet (avec repli sur le parseur par règles).</p>
            )}
            {(poll?.status === "extraction_failed" || poll?.status === "poll_failed") && (
              <p className="px-3 py-2 text-[11px] text-critical">Échec de l&apos;extraction : {poll.error}</p>
            )}

            {poll?.status === "ok" && <AnalyzedDocumentPreview documentId={d.documentId} notices={poll.notices} truncated={poll.truncated} invalidCount={poll.invalidCount} />}
          </div>
        );
      })}
    </div>
  );
}
