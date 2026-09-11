"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Loader2, RotateCcw } from "lucide-react";
import { analyzeUploadedPdfWithoutAIAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { CandidatePreviewTable } from "@/components/domain/CandidatePreviewTable";
import { useAnalysisPolling } from "@/hooks/useAnalysisPolling";

type Meta = { documentId: string; publicationNumero: string; publishedAt: Date };

function friendlyNetworkError(err: unknown): string {
  return `La requête a échoué ou a pris trop de temps (${err instanceof Error ? err.message : String(err)}). Réessayez.`;
}

// Dépôt manuel SANS IA (parser par règles, parser.ts) : en plus du dépôt
// avec Gemini ci-dessus, jamais à sa place. Même garantie qu'ailleurs :
// aperçu complet avant toute écriture, l'admin ne valide que ce qu'il
// souhaite ajouter.
//
// L'extraction elle-même (avec repli OCR possible sur un quotidien scanné,
// voir extract-text.ts) est lancée en arrière-plan côté serveur — jamais
// attendue par cette requête, qui répond tout de suite — le client suit la
// progression par polling (useAnalysisPolling), comme pour le chemin Gemini
// : un quotidien scanné de plusieurs dizaines de pages peut prendre de
// longues secondes à quelques minutes à traiter (rendu image + Tesseract,
// page par page), largement au-delà de ce que tolère le proxy inverse
// devant l'hébergement de production.
export function UploadWithoutAIForm({ sources }: { sources: { id: string; name: string }[] }) {
  const [submitting, startSubmitting] = useTransition();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { statuses, start, reset: resetPolling } = useAnalysisPolling();

  const poll = meta ? statuses[meta.documentId] : undefined;

  function runAnalysis(formData: FormData) {
    setMeta(null);
    setSubmitError(null);
    startSubmitting(async () => {
      try {
        const res = await analyzeUploadedPdfWithoutAIAction(formData);
        if (!res.ok) {
          setSubmitError(res.error);
          return;
        }
        setMeta({ documentId: res.documentId, publicationNumero: res.publicationNumero, publishedAt: res.publishedAt });
        start(res.documentId);
      } catch (err) {
        setSubmitError(friendlyNetworkError(err));
      }
    });
  }

  function reset() {
    resetPolling();
    setMeta(null);
    setSubmitError(null);
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
          <p className="text-[11px] text-ink-faint">Extraction par règles (sans IA), avec repli OCR automatique sur un document scanné — plus rapide qu&apos;une extraction IA, sans dépendance à un quota externe. Le numéro du quotidien est deviné depuis le nom du fichier.</p>
        </fieldset>
        {!meta && (
          <Button type="submit" variant="secondary" size="sm" disabled={submitting}>
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            {submitting ? "Envoi en cours…" : "Analyser sans IA (aperçu avant ajout)"}
          </Button>
        )}
      </form>
      {submitError && <p className="text-[11px] text-critical">Échec : {submitError}</p>}

      {meta && (
        <div className="rounded-[var(--radius-md)] border border-line">
          <div className="flex flex-col gap-1 border-b border-line px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Aperçu de l&apos;extraction (sans IA)</p>
              <p className="text-[11px] text-ink-faint">Quotidien n°{meta.publicationNumero} · {formatDate(meta.publishedAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              {poll?.status === "candidates_ready" && <Badge tone="info">{poll.candidates.length} marché(s) détecté(s)</Badge>}
              <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-xs text-brand hover:underline">
                <RotateCcw className="h-3 w-3" /> Analyser un autre document
              </button>
            </div>
          </div>

          {(!poll || poll.status === "processing") && (
            <div className="flex items-center gap-2 px-3 py-4 text-[12px] text-ink-muted">
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              Extraction en cours côté serveur — un document scanné (repli OCR) peut prendre plusieurs minutes. Cette page vérifie l&apos;avancement automatiquement, inutile de recharger.
            </div>
          )}

          {poll?.status === "candidates_ready" && (
            <CandidatePreviewTable documentId={meta.documentId} candidates={poll.candidates} />
          )}

          {(poll?.status === "extraction_failed" || poll?.status === "poll_failed") && (
            <p className="px-3 py-2 text-[11px] text-critical">Échec de l&apos;extraction : {poll.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
