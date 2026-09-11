"use client";

import { useState, useTransition } from "react";
import { Search, UploadCloud, Loader2 } from "lucide-react";
import { analyzeSourceAction, commitAnalyzedDocumentAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { formatFcfa, formatDate } from "@/lib/utils";
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

type CommitState = { pending: boolean; message: string | null; error: string | null };

const FRESH_TYPES = new Set(["AVIS_APPEL_OFFRES", "DEMANDE_PRIX", "DEMANDE_COTATION", "APPEL_OFFRES_OUVERT", "APPEL_OFFRES_ACCELERE", "MANIFESTATION_INTERET", "DEMANDE_PROPOSITIONS"]);

export function SourceAnalysisPanel({ sourceId }: { sourceId: string }) {
  const [analyzing, startAnalyzing] = useTransition();
  const [analyses, setAnalyses] = useState<Analysis[] | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, Set<number>>>({});
  const [commitStates, setCommitStates] = useState<Record<string, CommitState>>({});

  function runAnalysis() {
    setAnalyzeError(null);
    startAnalyzing(async () => {
      const result = await analyzeSourceAction(sourceId);
      if (!result.ok) {
        setAnalyzeError(result.error);
        return;
      }
      setAnalyses(result.analyses);
      const nextSelected: Record<string, Set<number>> = {};
      for (const a of result.analyses) {
        if (a.status === "ok" && a.notices) nextSelected[a.documentId] = new Set(a.notices.map((_, i) => i));
      }
      setSelected(nextSelected);
    });
  }

  function toggleNotice(documentId: string, index: number) {
    setSelected((prev) => {
      const current = new Set(prev[documentId] ?? []);
      if (current.has(index)) current.delete(index);
      else current.add(index);
      return { ...prev, [documentId]: current };
    });
  }

  function commit(documentId: string, notices: GeminiNotice[]) {
    const indices = selected[documentId] ?? new Set();
    const toCommit = notices.filter((_, i) => indices.has(i));
    if (toCommit.length === 0) return;

    setCommitStates((prev) => ({ ...prev, [documentId]: { pending: true, message: null, error: null } }));
    commitAnalyzedDocumentAction(documentId, toCommit).then((result) => {
      if (!result.ok) {
        setCommitStates((prev) => ({ ...prev, [documentId]: { pending: false, message: null, error: result.error } }));
        return;
      }
      setCommitStates((prev) => ({
        ...prev,
        [documentId]: {
          pending: false,
          error: null,
          message: `${result.createdMarkets} marché(s) créé(s) · ${result.updatedMarkets} mise(s) à jour · ${result.skippedUnmatchedUpdates} contenu(s) de suivi ignoré(s) (sans marché d'origine).`,
        },
      }));
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

          {a.status === "ok" && a.notices && a.notices.length > 0 && (
            <>
              <div className="max-h-[420px] overflow-y-auto">
                <table className="w-full text-left text-[12px]">
                  <thead className="sticky top-0 bg-paper text-[11px] uppercase tracking-wide text-ink-faint">
                    <tr>
                      <th className="w-8 px-3 py-1.5"></th>
                      <th className="px-2 py-1.5">Titre</th>
                      <th className="px-2 py-1.5">Autorité</th>
                      <th className="px-2 py-1.5">Type</th>
                      <th className="px-2 py-1.5">Montant</th>
                      <th className="px-2 py-1.5">Échéance</th>
                      <th className="px-2 py-1.5">Confiance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.notices.map((n, i) => (
                      <tr key={i} className="border-t border-line">
                        <td className="px-3 py-1.5">
                          <input
                            type="checkbox"
                            checked={selected[a.documentId]?.has(i) ?? false}
                            onChange={() => toggleNotice(a.documentId, i)}
                            aria-label={`Inclure « ${n.title} »`}
                          />
                        </td>
                        <td className="max-w-[280px] truncate px-2 py-1.5 text-ink" title={n.title}>{n.title}</td>
                        <td className="max-w-[180px] truncate px-2 py-1.5 text-ink-muted" title={n.authorityName ?? ""}>{n.authorityName ?? "—"}</td>
                        <td className="px-2 py-1.5">
                          <Badge tone={n.isFreshCall && FRESH_TYPES.has(n.publicationType) ? "brand" : "neutral"}>
                            {n.isFreshCall ? "Nouvel avis" : "Suivi"}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-2 py-1.5 text-ink-muted">{n.amountEstimatedExclTax ? formatFcfa(n.amountEstimatedExclTax) : "—"}</td>
                        <td className="whitespace-nowrap px-2 py-1.5 text-ink-muted">{n.submissionDeadline ? formatDate(n.submissionDeadline) : "—"}</td>
                        <td className="px-2 py-1.5 text-ink-muted">{Math.round(n.confidence * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-1.5 border-t border-line px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-ink-faint">{selected[a.documentId]?.size ?? 0} avis sélectionné(s) sur {a.notices.length}.</p>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={commitStates[a.documentId]?.pending || (selected[a.documentId]?.size ?? 0) === 0}
                  onClick={() => commit(a.documentId, a.notices!)}
                >
                  <UploadCloud className={cn("h-3.5 w-3.5", commitStates[a.documentId]?.pending && "animate-pulse")} />
                  {commitStates[a.documentId]?.pending ? "Ajout en cours…" : "Ajouter à la base de données"}
                </Button>
              </div>
              {commitStates[a.documentId]?.message && (
                <p className="border-t border-line px-3 py-2 text-[11px] text-success">{commitStates[a.documentId]?.message}</p>
              )}
              {commitStates[a.documentId]?.error && (
                <p className="border-t border-line px-3 py-2 text-[11px] text-critical">Échec : {commitStates[a.documentId]?.error}</p>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
