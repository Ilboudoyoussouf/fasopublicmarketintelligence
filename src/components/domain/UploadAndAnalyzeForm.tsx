"use client";

import { useRef, useState, useTransition } from "react";
import { Sparkles, Loader2, UploadCloud, RotateCcw, CheckCircle2 } from "lucide-react";
import { analyzeUploadedPdfAction, ingestExistingDocumentAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn, formatDate } from "@/lib/utils";
import { AnalyzedDocumentPreview } from "@/components/domain/AnalyzedDocumentPreview";
import { useAnalysisPolling } from "@/hooks/useAnalysisPolling";

type Meta = { documentId: string; publicationNumero: string; publishedAt: Date };

// Un problème réseau (coupure, délai dépassé côté hébergeur) fait rejeter
// la Server Action côté client au lieu de renvoyer { ok: false } — sans ce
// filet, l'exception remonte jusqu'à la limite d'erreur de Next.js et peut
// donner l'impression que la page elle-même a disparu.
function friendlyNetworkError(err: unknown): string {
  return `La requête a échoué ou a pris trop de temps (${err instanceof Error ? err.message : String(err)}). Réessayez.`;
}

// Dépôt manuel d'un quotidien avec la même valeur ajoutée que le reste de la
// plateforme : l'IA (Gemini) extrait la totalité des champs de chaque
// marché — y compris le numéro et la date du bulletin lui-même, lus sur sa
// page de garde, jamais saisis par l'admin —, l'admin voit un aperçu complet
// avant toute écriture, et ne valide que ce qu'il souhaite ajouter.
//
// L'extraction elle-même est lancée en arrière-plan côté serveur (jamais
// attendue par cette requête, qui répond tout de suite) — voir
// useAnalysisPolling, qui explique pourquoi.
export function UploadAndAnalyzeForm({ sources }: { sources: { id: string; name: string }[] }) {
  const [submitting, startSubmitting] = useTransition();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fallbackPending, setFallbackPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { statuses, start, reset: resetPolling } = useAnalysisPolling();

  const poll = meta ? statuses[meta.documentId] : undefined;

  function runAnalysis(formData: FormData) {
    const file = formData.get("file");
    setPendingFile(file instanceof File ? file : null);
    setMeta(null);
    setAnalyzeError(null);
    startSubmitting(async () => {
      try {
        const result = await analyzeUploadedPdfAction(formData);
        if (!result.ok) {
          setAnalyzeError(result.error);
          return;
        }
        setMeta({ documentId: result.documentId, publicationNumero: result.publicationNumero, publishedAt: result.publishedAt });
        start(result.documentId);
      } catch (err) {
        setAnalyzeError(friendlyNetworkError(err));
      }
    });
  }

  function runFallbackImport() {
    if (!meta || !pendingFile) return;
    setFallbackPending(true);
    ingestExistingDocumentAction(meta.documentId, pendingFile)
      .then((result) => {
        setFallbackPending(false);
        if (!result.ok) {
          setAnalyzeError(result.error);
          return;
        }
        start(result.documentId);
      })
      .catch((err) => {
        setFallbackPending(false);
        setAnalyzeError(friendlyNetworkError(err));
      });
  }

  function reset() {
    resetPolling();
    setMeta(null);
    setAnalyzeError(null);
    setPendingFile(null);
    setFallbackPending(false);
    formRef.current?.reset();
  }

  return (
    <div className="space-y-3">
      <form ref={formRef} action={runAnalysis} className="space-y-3">
        <fieldset disabled={submitting || Boolean(meta)} className="space-y-3 disabled:opacity-60">
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
        {!meta && (
          <Button type="submit" variant="secondary" size="sm" disabled={submitting}>
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {submitting ? "Envoi en cours…" : "Analyser avec l'IA (aperçu avant ajout)"}
          </Button>
        )}
      </form>
      {analyzeError && <p className="text-[11px] text-critical">Échec : {analyzeError}</p>}

      {meta && (
        <div className="rounded-[var(--radius-md)] border border-line">
          <div className="flex flex-col gap-1 border-b border-line px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Aperçu de l&apos;extraction</p>
              <p className="text-[11px] text-ink-faint">Quotidien n°{meta.publicationNumero} · {formatDate(meta.publishedAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              {poll?.status === "ok" && <Badge tone="info">{poll.notices.length} avis détecté(s)</Badge>}
              <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-xs text-brand hover:underline">
                <RotateCcw className="h-3 w-3" /> Analyser un autre document
              </button>
            </div>
          </div>

          {(!poll || poll.status === "processing") && (
            <div className="flex items-center gap-2 px-3 py-4 text-[12px] text-ink-muted">
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              Extraction en cours côté serveur — peut prendre plusieurs minutes sur un document volumineux. Cette page vérifie l&apos;avancement automatiquement, inutile de recharger.
            </div>
          )}

          {poll?.status === "ok" && (
            <AnalyzedDocumentPreview documentId={meta.documentId} notices={poll.notices} truncated={poll.truncated} invalidCount={poll.invalidCount} />
          )}

          {poll?.status === "committed" && (
            <div className="flex items-start gap-1.5 px-3 py-3 text-[12px] text-success">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Extraction par {poll.extractionMethod === "gemini" ? "IA (Gemini)" : "règles (repli)"} · {poll.candidatesFound} avis détecté(s) · {poll.createdMarkets} marché(s) créé(s){poll.updatedMarkets ? ` · ${poll.updatedMarkets} mise(s) à jour` : ""}.
            </div>
          )}

          {(poll?.status === "gemini_not_configured" || poll?.status === "extraction_failed" || poll?.status === "poll_failed") && (
            <div className="space-y-2 px-3 py-2">
              <p className="text-[11px] text-warning">
                {poll.status === "gemini_not_configured"
                  ? "Clé Gemini non configurée — l'aperçu n'est pas disponible pour ce dépôt."
                  : `Échec de l'extraction : ${poll.error}`}
              </p>
              <p className="text-[11px] text-ink-faint">
                Vous pouvez importer directement ce document sans aperçu (Gemini est retenté automatiquement, avec repli sur le parseur par règles en dernier recours).
              </p>
              <Button variant="secondary" size="sm" disabled={fallbackPending} onClick={runFallbackImport}>
                <UploadCloud className={cn("h-3.5 w-3.5", fallbackPending && "animate-pulse")} />
                {fallbackPending ? "Envoi en cours…" : "Importer sans aperçu"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
