"use client";

import { useState, useTransition } from "react";
import { triggerIngestionAction } from "@/app/admin/actions";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function IngestButton({ sourceId }: { sourceId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run() {
    setMessage(null);
    startTransition(async () => {
      const result = await triggerIngestionAction(sourceId);
      if (result.ok) {
        const retried = result.retriedStalled ? ` · ${result.retriedStalled} document(s) en attente relancé(s)` : "";
        setMessage(`${result.publicationsScanned} publication(s) analysée(s) · ${result.newDocuments} nouveau(x) document(s)${retried}.`);
      } else {
        setMessage(`Échec : ${result.error}`);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={run} disabled={pending} className="flex items-center gap-1 text-xs text-brand hover:underline disabled:opacity-50">
        <RefreshCw className={cn("h-3 w-3", pending && "animate-spin")} /> {pending ? "Import en cours…" : "Lancer une importation"}
      </button>
      {message && <p className="max-w-xs text-right text-[11px] text-ink-faint">{message}</p>}
    </div>
  );
}
