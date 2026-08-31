"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPasswordAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";

export function ReinitialisationForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, formAction, pending] = useActionState(resetPasswordAction, null);

  if (state?.ok) {
    return (
      <div className="text-center">
        <h1 className="text-lg font-semibold text-ink">Mot de passe mis à jour</h1>
        <Link href="/connexion" className="mt-3 inline-block text-sm text-brand hover:underline">Se connecter</Link>
      </div>
    );
  }

  if (!token) {
    return <p className="text-sm text-critical">Lien de réinitialisation manquant.</p>;
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-ink">Réinitialiser le mot de passe</h1>
      <form action={formAction} className="mt-5 space-y-3">
        <input type="hidden" name="token" value={token} />
        <input name="password" type="password" required minLength={8} className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none" placeholder="Nouveau mot de passe" />
        {state && !state.ok && <p className="text-xs text-critical">{state.error}</p>}
        <Button type="submit" variant="primary" className="w-full" disabled={pending}>
          {pending ? "Mise à jour…" : "Mettre à jour"}
        </Button>
      </form>
    </div>
  );
}
