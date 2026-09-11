"use client";

import { useRef, useState, useTransition } from "react";
import { uploadQuotidienAction } from "@/app/admin/actions";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function UploadQuotidienForm({ sources }: { sources: { id: string; name: string }[] }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function submit(formData: FormData) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await uploadQuotidienAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.status === "ok") {
        setMessage(
          `${result.candidatesFound} avis détecté(s) dans le document · ${result.createdMarkets} marché(s) créé(s)` +
            `${result.updatedMarkets ? ` · ${result.updatedMarkets} mise(s) à jour` : ""}` +
            `${result.republishedBlocks ? ` · ${result.republishedBlocks} republication(s) ignorée(s)` : ""}` +
            `${result.skippedUnmatchedUpdates ? ` · ${result.skippedUnmatchedUpdates} résultat(s)/rectificatif(s) sans marché d'origine connu ignoré(s)` : ""}.`,
        );
      } else if (result.status === "extraction_failed") {
        setError("Le texte du PDF n'a pas pu être extrait (fichier illisible).");
      } else {
        setError("Le téléchargement du fichier a échoué.");
      }
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} action={submit} className="space-y-3">
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
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        <UploadCloud className={cn("h-3.5 w-3.5", pending && "animate-pulse")} /> {pending ? "Extraction en cours…" : "Extraire et alimenter la base"}
      </Button>
      {message && <p className="max-w-md text-[11px] text-success">{message}</p>}
      {error && <p className="max-w-md text-[11px] text-critical">Échec : {error}</p>}
    </form>
  );
}
