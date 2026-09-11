"use client";

import { useState, useTransition } from "react";
import { Search, Loader2 } from "lucide-react";
import { analyzeSourceAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { AnalyzedDocumentPreview } from "@/components/domain/AnalyzedDocumentPreview";
import type { GeminiNotice } from "@/lib/ingestion/gemini-extractor";

type Analysis = {
  documentId: string;
  filename: string;
  publicationNumero: string;
  publishedAt: Date;
  status: "ok" | "gemini_not_configured" | "download_failed" | "extraction_failed";
  notices?: GeminiNotice[];
  error?: string;
};

export function SourceAnalysisPanel({ sourceId }: { sourceId: string }) {
  const [analyzing, startAnalyzing] = useTransition();
  const [analyses, setAnalyses] = useState<Analysis[] | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  function runAnalysis() {
    setAnalyzeError(null);
    startAnalyzing(async () => {
      const result = await analyzeSourceAction(sourceId);
      if (!result.ok) {
        setAnalyzeError(result.error);
        return;
      }
      setAnalyses(result.analyses);
    });
  }

  return (
    <div className="space-y-3">
      <Button variant="secondary" size="sm" onClick={runAnalysis} disabled={analyzing}>
        {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
        {analyzing ? "Téléchargement et analyse en cours…" : "Télécharger et analyser avec Gemini"}
      </Button>
      {analyzing && (
        <p className="text-[11px] text-ink-faint">
          Recherche de nouveaux quotidiens, téléchargement puis extraction avec Gemini — peut prendre plusieurs minutes selon le nombre de documents.
        </p>
      )}
      {analyzeError && <p className="text-[11px] text-critical">Échec : {analyzeError}</p>}

      {analyses && analyses.length === 0 && <p className="text-[11px] text-ink-faint">Aucun nouveau quotidien trouvé sur la source.</p>}

      {analyses?.map((a) => (
        <div key={a.documentId} className="rounded-[var(--radius-md)] border border-line">
          <div className="flex flex-col gap-1 border-b border-line px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Quotidien n°{a.publicationNumero}</p>
              <p className="text-[11px] text-ink-faint">{a.filename} · {formatDate(a.publishedAt)}</p>
            </div>
            {a.status === "ok" && a.notices && (
              <Badge tone="info">{a.notices.length} avis détecté(s)</Badge>
            )}
          </div>

          {a.status === "gemini_not_configured" && (
            <p className="px-3 py-2 text-[11px] text-warning">Clé Gemini non configurée — l&apos;aperçu n&apos;est disponible qu&apos;avec l&apos;extraction Gemini. Utilisez « Lancer une importation » pour un traitement automatique complet (avec repli sur le parseur par règles).</p>
          )}
          {a.status === "download_failed" && <p className="px-3 py-2 text-[11px] text-critical">Échec du téléchargement de ce document.</p>}
          {a.status === "extraction_failed" && <p className="px-3 py-2 text-[11px] text-critical">Échec de l&apos;extraction Gemini : {a.error}</p>}

          {a.status === "ok" && a.notices && <AnalyzedDocumentPreview documentId={a.documentId} notices={a.notices} />}
        </div>
      ))}
    </div>
  );
}
