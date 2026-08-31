"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { toggleWatchMarketAction, addToFolderAction } from "@/app/(app)/marches/actions";
import { BellRing, BookmarkPlus, Bookmark, FolderPlus, Scale, ExternalLink } from "lucide-react";

export function MarketCtaBar({ marketId, isWatched, sourceUrl }: { marketId: string; isWatched: boolean; sourceUrl?: string | null }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function addToCompare() {
    const raw = localStorage.getItem("compare-ids");
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (!ids.includes(marketId)) ids.push(marketId);
    localStorage.setItem("compare-ids", JSON.stringify(ids.slice(-4)));
    router.push("/opportunites/comparateur");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant={isWatched ? "primary" : "secondary"} size="sm" disabled={pending} onClick={() => startTransition(() => toggleWatchMarketAction(marketId))}>
        {isWatched ? <Bookmark className="h-3.5 w-3.5" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
        {isWatched ? "Suivi" : "Suivre"}
      </Button>
      <Button variant="secondary" size="sm" disabled={pending} onClick={() => startTransition(() => toggleWatchMarketAction(marketId))}>
        <BellRing className="h-3.5 w-3.5" /> Recevoir les alertes
      </Button>
      <Button variant="secondary" size="sm" disabled={pending} onClick={() => startTransition(() => addToFolderAction(marketId))}>
        <FolderPlus className="h-3.5 w-3.5" /> Ajouter au dossier
      </Button>
      <Button variant="secondary" size="sm" onClick={addToCompare}>
        <Scale className="h-3.5 w-3.5" /> Comparer
      </Button>
      {sourceUrl && (
        <a href={sourceUrl} target="_blank" rel="noreferrer">
          <Button variant="ghost" size="sm">
            <ExternalLink className="h-3.5 w-3.5" /> Consulter la source
          </Button>
        </a>
      )}
    </div>
  );
}
