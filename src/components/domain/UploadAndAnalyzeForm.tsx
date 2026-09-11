"use client";

import { useRef, useState, useTransition } from "react";
import { Sparkles, Loader2, UploadCloud, RotateCcw } from "lucide-react";
import { analyzeUploadedPdfAction, ingestExistingDocumentAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn, formatDate } from "@/lib/utils";
import { AnalyzedDocumentPreview } from "@/components/domain/AnalyzedDocumentPreview";
import type { GeminiNotice } from "@/lib/ingestion/gemini-extractor";

type Analysis =
  | { status: "ok"; documentId: string; notices: GeminiNotice[]; publicationNumero: string; publishedAt: Date }
  | { status: "gemini_not_configured"; documentId: string; publicationNumero: string; publishedAt: Date }
  | { status: "extraction_failed"; documentId: string; error: string; publicationNumero: string; publishedAt: Date };

type FallbackState = { pending: boolean; message: string | null; error: string | null };

// Un problème réseau (coupure, délai dépassé côté hébergeur pendant les
// quelques minutes que Gemini peut prendre sur un gros document) fait
// rejeter la Server Action côté client au lieu de renvoyer { ok: false } —
// sans ce filet, l'exception remonte jusqu'à la limite d'erreur de Next.js
// et peut donner l'impression que la page elle-même a disparu, alors que
// l'extraction a peut-être bien eu lieu côté serveur.
function friendlyNetworkError(err: unknown): string {
  return `La requête a échoué ou a pris trop de temps (${err instanceof Error ? err.message : String(err)}). Réessayez — si l'extraction avait déjà été effectuée côté serveur, un nouvel essai n'en crée pas une seconde.`;
}

// Dépôt manuel d'un quotidien avec la même valeur ajoutée que le reste de la
// plateforme : l'IA (Gemini) extrait la totalité des champs de chaque
// marché — y compris le numéro et la date du bulletin lui-même, lus sur sa
// page de garde, jamais saisis par l'admin —, l'admin voit un aperçu complet
// avant toute écriture, et ne valide que ce qu'il souhaite ajouter.
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
      try {
        const result = await analyzeUploadedPdfAction(formData);
        if (!result.ok) {
          setAnalyzeError(result.error);
          return;
        }
        setAnalysis(result as Analysis);
      } catch (err) {
        setAnalyzeError(friendlyNetworkError(err));
      }
    });
  }

  function runFallbackImport() {
    if (!analysis || !pendingFile) return;
    setFallback({ pending: true, message: null, error: null });
    ingestExistingDocumentAction(analysis.documentId, pendingFile)
      .then((result) => {
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
      })
      .catch((err) => setFallback({ pending: false, message: null, error: friendlyNetworkError(err) }));
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
          <label className="block text-xs text-ink-muted sm:max-w-xs">
            Source
            <select name="sourceId" required className="mt-1 w-full rounded-md border border-line bg-paper px-2 py-1.5 text-sm text-ink">
              {sources.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-ink-muted">
            Fichier PDF du quotidien
            <input type="file" name="file" accept="application/pdf" required className="mt-1 block w-full text-sm text-ink file:mr-3 file:rounded-md file:border file:border-line file:bg-paper file:px-2.5 file:py-1.5 file:text-xs file:text-ink-muted" />
          </label>
          <p className="text-[11px] text-ink-faint">Le numéro du quotidien et sa date de publication sont lus automatiquement par l&apos;IA sur la page de garde du PDF — aucune saisie requise.</p>
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
          Lecture du PDF et extraction de tous les champs de chaque marché avec Gemini — peut prendre une à deux minutes selon la taille du document. Ne fermez pas cette page.
        </p>
      )}
      {analyzeError && <p className="text-[11px] text-critical">Échec : {analyzeError}</p>}

      {analysis && (
        <div className="rounded-[var(--radius-md)] border border-line">
          <div className="flex flex-col gap-1 border-b border-line px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Aperçu de l&apos;extraction</p>
              <p className="text-[11px] text-ink-faint">Quotidien n°{analysis.publicationNumero} · {formatDate(analysis.publishedAt)}</p>
            </div>
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
