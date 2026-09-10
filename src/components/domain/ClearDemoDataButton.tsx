"use client";

import { useState, useTransition } from "react";
import { clearDemoDataAction } from "@/app/admin/actions";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function ClearDemoDataButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run() {
    if (!confirm("Supprimer définitivement tous les marchés de démonstration (jeu de données Annexe D) ? Cette action est irréversible.")) return;
    setMessage(null);
    startTransition(async () => {
      const result = await clearDemoDataAction();
      setMessage(
        result.deletedMarkets > 0
          ? `${result.deletedMarkets} marché(s) de démonstration supprimé(s) : ${result.titles.join(", ")}.`
          : "Aucun marché de démonstration trouvé — la base ne contient déjà que des données réelles.",
      );
    });
  }

  return (
    <div className="space-y-1.5">
      <Button variant="secondary" size="sm" onClick={run} disabled={pending}>
        <Trash2 className={cn("h-3.5 w-3.5", pending && "animate-pulse")} /> {pending ? "Suppression…" : "Supprimer les données de démonstration"}
      </Button>
      {message && <p className="max-w-md text-[11px] text-ink-faint">{message}</p>}
    </div>
  );
}
