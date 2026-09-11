"use client";

import { useRef, useState, useTransition } from "react";
import { Sparkles, Loader2, UploadCloud, RotateCcw } from "lucide-react";
import { analyzeUploadedPdfAction, ingestExistingDocumentAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { AnalyzedDocumentPreview } from "@/components/domain/AnalyzedDocumentPreview";
import type { GeminiNotice } from "@/lib/ingestion/gemini-extractor";

type Analysis =
  | { status: "ok"; documentId: string; notices: GeminiNotice[] }
  | { status: "gemini_not_configured"; documentId: string }
  | { status: "extraction_failed"; documentId: string; error: string };

type FallbackState = { pending: boolean; message: string | null; error: string | null };

// Dépôt manuel d'un quotidien avec la même valeur ajoutée que le reste de la
// plateforme : l'IA (Gemini) extrait la totalité des champs de chaque
// marché, l'admin voit un aperçu complet avant toute écriture, et ne valide
// que ce qu'il souhaite ajouter — jamais un fichier ingéré à l'aveugle.
export function UploadAndAnalyzeForm({ sources }: { sources: { id: string; name: string }[] }) {
  const [analyzing, startAnalyzing] = useTransition();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fallback, setFallback] = useState<FallbackState>({ pending: false, message: null, error: null });
  const formRef = useRef<HTMLFormElement>(null);

  function runAnalysis(formData: FormData) {
    const file = formData.get("file");
    setPendingFile(file instanceof File ? file : null);
    setAnalysis(null);
    setAnalyzeError(null);
    setFallback({ pending: false, message: null, error: null });
    startAnalyzing(async () => {
      const result = await analyzeUploadedPdfAction(formData);
      if (!result.ok) {
        setAnalyzeError(result.error);
        return;
      }
      setAnalysis(result as Analysis);
    });
  }

  function runFallbackImport() {
    if (!analysis || !pendingFile) return;
    setFallback({ pending: true, message: null, error: null });
    ingestExistingDocumentAction(analysis.documentId, pendingFile).then((result) => {
      if (!result.ok) {
        setFallback({ pending: false, message: null, error: result.error });
        return;
      }
      const methodLabel = result.extractionMethod === "gemini" ? "IA (Gemini)" : "règles (repli)";
      setFallback({
        pending: false,
        error: null,
        message: `Extraction par ${methodLabel} · ${result.candidatesFound} avis détecté(s) · ${result.createdMarkets} marché(s) créé(s)${result.updatedMarkets ? ` · ${result.updatedMarkets} mise(s) à jour` : ""}.`,
      });
    });
  }

  function reset() {
    setAnalysis(null);
    setAnalyzeError(null);
    setPendingFile(null);
    setFallback({ pending: false, message: null, error: null });
    formRef.current?.reset();
  }

  return (
    <div className="space-y-3">
      <form ref={formRef} action={runAnalysis} className="space-y-3">
        <fieldset disabled={analyzing || Boolean(analysis)} className="space-y-3 disabled:opacity-60">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-xs text-ink-muted sm:col-span-1">
              Source
              <select name="sourceId" required className="mt-1 w-full rounded-md border border-line bg-paper px-2 py-1.5 text-sm text-ink">
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-ink-muted sm:col-span-1">
              N° du quotidien
              <input name="numero" required placeholder="4486" className="mt-1 w-full rounded-md border border-line bg-paper px-2 py-1.5 text-sm text-ink placeholder:text-ink-faint" />
            </label>
            <label className="block text-xs text-ink-muted sm:col-span-1">
              Date de publication
              <input type="date" name="publishedAt" required className="mt-1 w-full rounded-md border border-line bg-paper px-2 py-1.5 text-sm text-ink" />
            </label>
          </div>
          <label className="block text-xs text-ink-muted">
            Fichier PDF du quotidien
            <input type="file" name="file" accept="application/pdf" required className="mt-1 block w-full text-sm text-ink file:mr-3 file:rounded-md file:border file:border-line file:bg-paper file:px-2.5 file:py-1.5 file:text-xs file:text-ink-muted" />
          </label>
        </fieldset>
        {!analysis && (
          <Button type="submit" variant="secondary" size="sm" disabled={analyzing}>
            {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {analyzing ? "Extraction IA en cours…" : "Analyser avec l'IA (aperçu avant ajout)"}
          </Button>
        )}
      </form>
      {analyzing && (
        <p className="text-[11px] text-ink-faint">
          Lecture du PDF et extraction de tous les champs de chaque marché avec Gemini — peut prendre une à deux minutes selon la taille du document.
        </p>
      )}
      {analyzeError && <p className="text-[11px] text-critical">Échec : {analyzeError}</p>}

      {analysis && (
        <div className="rounded-[var(--radius-md)] border border-line">
          <div className="flex flex-col gap-1 border-b border-line px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-ink">Aperçu de l&apos;extraction</p>
            <div className="flex items-center gap-2">
              {analysis.status === "ok" && <Badge tone="info">{analysis.notices.length} avis détecté(s)</Badge>}
              <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-xs text-brand hover:underline">
                <RotateCcw className="h-3 w-3" /> Analyser un autre document
              </button>
            </div>
          </div>

          {analysis.status === "ok" && <AnalyzedDocumentPreview documentId={analysis.documentId} notices={analysis.notices} />}

          {analysis.status !== "ok" && (
            <div className="space-y-2 px-3 py-2">
              <p className="text-[11px] text-warning">
                {analysis.status === "gemini_not_configured"
                  ? "Clé Gemini non configurée — l'aperçu n'est pas disponible pour ce dépôt."
                  : `Échec de l'extraction Gemini : ${analysis.error}`}
              </p>
              <p className="text-[11px] text-ink-faint">
                Vous pouvez importer directement ce document sans aperçu (Gemini est retenté automatiquement, avec repli sur le parseur par règles en dernier recours).
              </p>
              <Button variant="secondary" size="sm" disabled={fallback.pending} onClick={runFallbackImport}>
                <UploadCloud className={cn("h-3.5 w-3.5", fallback.pending && "animate-pulse")} />
                {fallback.pending ? "Import en cours…" : "Importer sans aperçu"}
              </Button>
              {fallback.message && <p className="text-[11px] text-success">{fallback.message}</p>}
              {fallback.error && <p className="text-[11px] text-critical">Échec : {fallback.error}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
