"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Loader2, RotateCcw } from "lucide-react";
import { analyzeUploadedPdfWithoutAIAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { CandidatePreviewTable } from "@/components/domain/CandidatePreviewTable";

type Result =
  | { status: "ok"; documentId: string; publicationNumero: string; publishedAt: Date; candidates: Parameters<typeof CandidatePreviewTable>[0]["candidates"] }
  | { status: "extraction_failed"; error: string };

function friendlyNetworkError(err: unknown): string {
  return `La requête a échoué ou a pris trop de temps (${err instanceof Error ? err.message : String(err)}). Réessayez.`;
}

// Dépôt manuel SANS IA (parser par règles, parser.ts) : en plus du dépôt
// avec Gemini ci-dessus, jamais à sa place. L'extraction est un calcul local
// (pas d'appel réseau externe) : contrairement au chemin Gemini, cette
// requête peut être attendue directement — pas besoin de polling en
// arrière-plan, le résultat revient en quelques secondes même sur un gros
// document. Même garantie qu'ailleurs : aperçu complet avant toute écriture,
// l'admin ne valide que ce qu'il souhaite ajouter.
export function UploadWithoutAIForm({ sources }: { sources: { id: string; name: string }[] }) {
  const [submitting, startSubmitting] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function runAnalysis(formData: FormData) {
    setResult(null);
    setSubmitError(null);
    startSubmitting(async () => {
      try {
        const res = await analyzeUploadedPdfWithoutAIAction(formData);
        if (!res.ok) {
          setSubmitError(res.error);
          return;
        }
        if (res.status === "extraction_failed") {
          setResult({ status: "extraction_failed", error: res.error });
          return;
        }
        setResult({ status: "ok", documentId: res.documentId, publicationNumero: res.publicationNumero, publishedAt: res.publishedAt, candidates: res.candidates });
      } catch (err) {
        setSubmitError(friendlyNetworkError(err));
      }
    });
  }

  function reset() {
    setResult(null);
    setSubmitError(null);
    formRef.current?.reset();
  }

  return (
    <div className="space-y-3">
      <form ref={formRef} action={runAnalysis} className="space-y-3">
        <fieldset disabled={submitting || Boolean(result)} className="space-y-3 disabled:opacity-60">
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
          <p className="text-[11px] text-ink-faint">Extraction par règles (sans IA) — plus rapide, sans dépendance à un quota externe. Le numéro du quotidien est deviné depuis le nom du fichier.</p>
        </fieldset>
        {!result && (
          <Button type="submit" variant="secondary" size="sm" disabled={submitting}>
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            {submitting ? "Extraction en cours…" : "Analyser sans IA (aperçu avant ajout)"}
          </Button>
        )}
      </form>
      {submitError && <p className="text-[11px] text-critical">Échec : {submitError}</p>}

      {result && (
        <div className="rounded-[var(--radius-md)] border border-line">
          <div className="flex flex-col gap-1 border-b border-line px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Aperçu de l&apos;extraction (sans IA)</p>
              {result.status === "ok" && <p className="text-[11px] text-ink-faint">Quotidien n°{result.publicationNumero} · {formatDate(result.publishedAt)}</p>}
            </div>
            <div className="flex items-center gap-2">
              {result.status === "ok" && <Badge tone="info">{result.candidates.length} marché(s) détecté(s)</Badge>}
              <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-xs text-brand hover:underline">
                <RotateCcw className="h-3 w-3" /> Analyser un autre document
              </button>
            </div>
          </div>

          {result.status === "ok" && <CandidatePreviewTable documentId={result.documentId} candidates={result.candidates} />}

          {result.status === "extraction_failed" && (
            <p className="px-3 py-2 text-[11px] text-critical">Échec de l&apos;extraction : {result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
