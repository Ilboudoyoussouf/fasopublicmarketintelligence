"use client";

import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { commitAnalyzedCandidatesAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { formatFcfa, formatDate } from "@/lib/utils";

type CandidateForPreview = {
  rawBlock: string;
  publicationTypeGuess: string;
  procedureTypeGuess: string | null;
  reference: string | null;
  title: string | null;
  authorityGuess: string | null;
  amountExclTax: number | null;
  submissionDeadline: Date | null;
  withdrawalDeadline: Date | null;
  openingAt: Date | null;
  bidValidityDays: number | null;
  executionDelayDays: number | null;
  regionGuess: string | null;
  requirements: unknown[];
  requiredDocuments: unknown[];
  lots: unknown[];
  confidence: number;
};

const FRESH_TYPES = new Set([
  "AVIS_APPEL_OFFRES", "DEMANDE_PRIX", "DEMANDE_COTATION", "APPEL_OFFRES_OUVERT",
  "APPEL_OFFRES_ACCELERE", "MANIFESTATION_INTERET", "DEMANDE_PROPOSITIONS",
]);

// Aperçu d'un document analysé par le parseur par règles (sans IA) — même
// principe que AnalyzedDocumentPreview côté Gemini (sélection des marchés à
// ajouter, validation humaine explicite avant écriture), mais un composant
// distinct : les champs du candidat (authorityGuess, publicationTypeGuess…)
// diffèrent de ceux d'un avis Gemini, et ce chemin ne doit courir aucun
// risque de régression sur le chemin IA déjà en production.
export function CandidatePreviewTable({ documentId, candidates }: { documentId: string; candidates: CandidateForPreview[] }) {
  const [selected, setSelected] = useState<Set<number>>(new Set(candidates.map((_, i) => i)));
  const [state, setState] = useState<{ pending: boolean; message: string | null; error: string | null }>({ pending: false, message: null, error: null });

  function toggle(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function commit() {
    const toCommit = candidates.filter((_, i) => selected.has(i));
    if (toCommit.length === 0) return;
    setState({ pending: true, message: null, error: null });
    commitAnalyzedCandidatesAction(documentId, toCommit)
      .then((result) => {
        if (!result.ok) {
          setState({ pending: false, message: null, error: result.error });
          return;
        }
        setState({
          pending: false,
          error: null,
          message: `${result.createdMarkets} marché(s) créé(s) · ${result.updatedMarkets} mise(s) à jour · ${result.skippedUnmatchedUpdates} contenu(s) de suivi ignoré(s) (sans marché d'origine).`,
        });
      })
      .catch((err) => setState({
        pending: false,
        message: null,
        error: `La requête a échoué ou a pris trop de temps (${err instanceof Error ? err.message : String(err)}). Vérifiez dans « Marchés » si l'ajout a bien eu lieu avant de réessayer.`,
      }));
  }

  if (candidates.length === 0) {
    return <p className="px-3 py-2 text-[11px] text-ink-faint">Aucun marché détecté dans ce document.</p>;
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b border-line px-3 py-1.5 text-[11px]">
        <button type="button" onClick={() => setSelected(new Set(candidates.map((_, i) => i)))} className="text-brand hover:underline">Tout sélectionner</button>
        <button type="button" onClick={() => setSelected(new Set())} className="text-brand hover:underline">Tout désélectionner</button>
      </div>
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
            {candidates.map((c, i) => (
              <tr key={i} className="border-t border-line">
                <td className="px-3 py-1.5">
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggle(i)}
                    aria-label={`Inclure « ${c.title ?? "sans titre"} »`}
                  />
                </td>
                <td className="max-w-[280px] truncate px-2 py-1.5 text-ink" title={c.title ?? ""}>{c.title ?? "—"}</td>
                <td className="max-w-[180px] truncate px-2 py-1.5 text-ink-muted" title={c.authorityGuess ?? ""}>{c.authorityGuess ?? "—"}</td>
                <td className="px-2 py-1.5">
                  <Badge tone={FRESH_TYPES.has(c.publicationTypeGuess) ? "brand" : "neutral"}>
                    {FRESH_TYPES.has(c.publicationTypeGuess) ? "Nouvel avis" : "Suivi"}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-2 py-1.5 text-ink-muted">{c.amountExclTax ? formatFcfa(c.amountExclTax) : "—"}</td>
                <td className="whitespace-nowrap px-2 py-1.5 text-ink-muted">{c.submissionDeadline ? formatDate(c.submissionDeadline) : "—"}</td>
                <td className="px-2 py-1.5 text-ink-muted">{Math.round(c.confidence * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-1.5 border-t border-line px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-ink-faint">{selected.size} marché(s) sélectionné(s) sur {candidates.length}.</p>
        <Button variant="primary" size="sm" disabled={state.pending || selected.size === 0} onClick={commit}>
          <UploadCloud className={cn("h-3.5 w-3.5", state.pending && "animate-pulse")} />
          {state.pending ? "Ajout en cours…" : "Ajouter à la base de données"}
        </Button>
      </div>
      {state.message && <p className="border-t border-line px-3 py-2 text-[11px] text-success">{state.message}</p>}
      {state.error && <p className="border-t border-line px-3 py-2 text-[11px] text-critical">Échec : {state.error}</p>}
    </>
  );
}
