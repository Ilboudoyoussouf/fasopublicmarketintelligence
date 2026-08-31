"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StateNotice } from "@/components/ui/StateNotice";
import { formatFcfa, formatDate } from "@/lib/utils";
import { PROCEDURE_TYPE_LABEL, RESERVATION_CATEGORY_LABEL } from "@/lib/labels";
import { X } from "lucide-react";

type CompareMarket = {
  id: string; title: string; amountEstimatedExclTax: string | null; submissionDeadline: string | null;
  procedureType: string; contractingAuthority: { name: string };
  requirements: { type: string }[]; reservations: { category: string }[];
};
type CompareScore = { marketId: string; global: number };

export default function ComparateurPage() {
  const [markets, setMarkets] = useState<CompareMarket[] | null>(null);
  const [scores, setScores] = useState<CompareScore[]>([]);
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("compare-ids");
    const parsed: string[] = raw ? JSON.parse(raw) : [];
    setIds(parsed);
    if (parsed.length === 0) {
      setMarkets([]);
      return;
    }
    fetch(`/api/markets/compare?ids=${parsed.join(",")}`)
      .then((r) => r.json())
      .then((d) => {
        setMarkets(d.markets ?? []);
        setScores(d.scores ?? []);
      });
  }, []);

  function remove(id: string) {
    const next = ids.filter((i) => i !== id);
    setIds(next);
    localStorage.setItem("compare-ids", JSON.stringify(next));
    setMarkets((m) => m?.filter((mm) => mm.id !== id) ?? null);
  }

  if (markets === null) return <p className="text-sm text-ink-muted">Chargement…</p>;

  if (markets.length === 0) {
    return (
      <StateNotice
        kind="empty"
        title="Aucun marché à comparer"
        description="Depuis une fiche marché, cliquez sur « Comparer » pour l'ajouter ici (jusqu'à 4 marchés)."
        action={<Link href="/opportunites" className="text-xs text-brand hover:underline">Parcourir les opportunités</Link>}
      />
    );
  }

  const scoreByMarket = new Map(scores.map((s) => [s.marketId, s.global]));
  const rows: { label: string; render: (m: CompareMarket) => React.ReactNode }[] = [
    { label: "Organisme", render: (m) => m.contractingAuthority.name },
    { label: "Procédure", render: (m) => PROCEDURE_TYPE_LABEL[m.procedureType] },
    { label: "Montant", render: (m) => formatFcfa(m.amountEstimatedExclTax) },
    { label: "Échéance", render: (m) => formatDate(m.submissionDeadline) },
    { label: "Score", render: (m) => (scoreByMarket.has(m.id) ? `${Math.round(scoreByMarket.get(m.id)!)}/100` : "—") },
    { label: "Exigences", render: (m) => `${m.requirements.length} exigence(s)` },
    { label: "Réservation", render: (m) => (m.reservations.length ? m.reservations.map((r) => RESERVATION_CATEGORY_LABEL[r.category]).join(", ") : "Aucune") },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-ink">Comparateur d&apos;opportunités</h1>
      <div className="overflow-x-auto rounded-lg border border-line bg-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="w-32 p-3 text-left text-xs font-medium text-ink-faint">Critère</th>
              {markets.map((m) => (
                <th key={m.id} className="min-w-[200px] p-3 text-left">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/marches/${m.id}`} className="text-xs font-semibold text-ink hover:text-brand">{m.title}</Link>
                    <button onClick={() => remove(m.id)} className="text-ink-faint hover:text-critical" aria-label="Retirer">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-line last:border-0">
                <td className="p-3 text-xs font-medium text-ink-muted">{row.label}</td>
                {markets.map((m) => (
                  <td key={m.id} className="p-3 text-xs text-ink">{row.render(m)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
