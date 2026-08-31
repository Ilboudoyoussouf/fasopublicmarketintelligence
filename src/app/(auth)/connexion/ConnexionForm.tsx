"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";

export function ConnexionForm() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <div>
      <h1 className="text-lg font-semibold text-ink">Connexion</h1>
      <p className="mt-1 text-sm text-ink-muted">Accédez à votre veille de la commande publique.</p>

      <form action={formAction} className="mt-5 space-y-3">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">Email professionnel</label>
          <input name="email" type="email" required className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none" placeholder="vous@entreprise.bf" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">Mot de passe</label>
          <input name="password" type="password" required className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none" placeholder="••••••••" />
        </div>
        {state && !state.ok && <p className="text-xs text-critical">{state.error}</p>}
        <Button type="submit" variant="primary" className="w-full" disabled={pending}>
          {pending ? "Connexion…" : "Se connecter"}
        </Button>
      </form>

      <div className="mt-4 flex items-center justify-between text-xs">
        <Link href="/mot-de-passe-oublie" className="text-brand hover:underline">Mot de passe oublié ?</Link>
        <Link href="/inscription" className="text-brand hover:underline">Créer un compte</Link>
      </div>

      <div className="mt-4 rounded-md bg-paper-sunken px-3 py-2 text-[11px] text-ink-faint">
        Démo : demo@fasopmi.bf / Demo1234!
      </div>
    </div>
  );
}
