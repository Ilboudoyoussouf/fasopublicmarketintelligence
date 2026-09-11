"use client";

import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { commitAnalyzedDocumentAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { formatFcfa, formatDate } from "@/lib/utils";
import type { GeminiNotice } from "@/lib/ingestion/gemini-extractor";

export const FRESH_TYPES = new Set([
  "AVIS_APPEL_OFFRES", "DEMANDE_PRIX", "DEMANDE_COTATION", "APPEL_OFFRES_OUVERT",
  "APPEL_OFFRES_ACCELERE", "MANIFESTATION_INTERET", "DEMANDE_PROPOSITIONS",
]);

// Aperçu d'un document déjà analysé par Gemini, avec sélection des avis à
// ajouter et validation explicite avant écriture en base — la même « valeur
// ajoutée » (extraction IA → aperçu → validation humaine) qu'il s'agisse
// d'un document découvert automatiquement sur une source ou déposé à la
// main : un seul composant, aucune divergence d'affichage entre les deux.
export function AnalyzedDocumentPreview({ documentId, notices }: { documentId: string; notices: GeminiNotice[] }) {
  const [selected, setSelected] = useState<Set<number>>(new Set(notices.map((_, i) => i)));
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
    const toCommit = notices.filter((_, i) => selected.has(i));
    if (toCommit.length === 0) return;
    setState({ pending: true, message: null, error: null });
    commitAnalyzedDocumentAction(documentId, toCommit)
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
      // Une requête réseau interrompue (délai dépassé, coupure) rejette la
      // promesse au lieu de renvoyer { ok: false } — sans ce filet,
      // l'exception non gérée peut donner l'impression que la page a
      // disparu alors que l'ajout a peut-être bien eu lieu côté serveur.
      .catch((err) => setState({
        pending: false,
        message: null,
        error: `La requête a échoué ou a pris trop de temps (${err instanceof Error ? err.message : String(err)}). Vérifiez dans « Marchés » si l'ajout a bien eu lieu avant de réessayer.`,
      }));
  }

  if (notices.length === 0) {
    return <p className="px-3 py-2 text-[11px] text-ink-faint">Aucun avis détecté dans ce document.</p>;
  }

  return (
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
            {notices.map((n, i) => (
              <tr key={i} className="border-t border-line">
                <td className="px-3 py-1.5">
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggle(i)}
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
        <p className="text-[11px] text-ink-faint">{selected.size} avis sélectionné(s) sur {notices.length}.</p>
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
