"use client";

import { useEffect } from "react";
import { StateNotice } from "@/components/ui/StateNotice";
import { Button } from "@/components/ui/Button";

// Filet de sécurité pour la section admin : sans cette limite d'erreur,
// toute exception de rendu non rattrapée (ex. après un dépôt manuel dont la
// requête a été interrompue par un délai réseau) remplace toute la page par
// l'écran de crash générique de Next.js — ici, on garde le contexte
// (l'admin sait qu'il est sur /admin/sources) et on propose de réessayer
// sans recharger toute l'application.
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[admin] erreur de rendu :", error);
  }, [error]);

  return (
    <StateNotice
      kind="error"
      title="Une erreur est survenue"
      description="Le rendu de cette page a échoué — souvent un problème réseau temporaire. Si vous veniez de valider un dépôt ou un import, vérifiez d'abord si l'opération a bien eu lieu avant de réessayer."
      action={<Button variant="secondary" size="sm" onClick={() => reset()}>Réessayer</Button>}
    />
  );
}
