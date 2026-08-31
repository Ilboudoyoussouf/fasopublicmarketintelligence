"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";

export function InscriptionForm() {
  const [state, formAction, pending] = useActionState(registerAction, null);

  return (
    <div>
      <h1 className="text-lg font-semibold text-ink">Créer un compte</h1>
      <p className="mt-1 text-sm text-ink-muted">Commencez votre veille de la commande publique au Burkina Faso.</p>

      <form action={formAction} className="mt-5 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">Nom complet</label>
          <input name="fullName" required className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none" placeholder="Aïcha Ouédraogo" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">Email professionnel</label>
          <input name="email" type="email" required className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none" placeholder="vous@entreprise.bf" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">Mot de passe</label>
          <input name="password" type="password" required minLength={8} className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none" placeholder="8 caractères minimum" />
        </div>
        {state && !state.ok && <p className="text-xs text-critical">{state.error}</p>}
        <p className="text-[11px] text-ink-faint">
          En créant un compte, vous acceptez les <Link href="/conditions-utilisation" className="underline">Conditions d&apos;utilisation</Link> et la{" "}
          <Link href="/confidentialite" className="underline">Politique de confidentialité</Link>.
        </p>
        <Button type="submit" variant="primary" className="w-full" disabled={pending}>
          {pending ? "Création…" : "Créer mon compte"}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs">
        Déjà un compte ? <Link href="/connexion" className="text-brand hover:underline">Se connecter</Link>
      </p>
    </div>
  );
}
