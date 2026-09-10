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
      <h1 className="text-lg font-semibold text-ink">Connectez-vous à votre espace</h1>

      <form action={formAction} className="mt-5 space-y-3">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">Adresse e-mail</label>
          <input name="email" type="email" required className="input" placeholder="vous@entreprise.bf" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">Mot de passe</label>
          <input name="password" type="password" required className="input" placeholder="••••••••" />
        </div>
        {state && !state.ok && <p className="text-xs text-critical">{state.error}</p>}
        <Button type="submit" variant="primary" className="w-full" disabled={pending}>
          {pending ? "Connexion…" : "Se connecter"}
        </Button>
      </form>

      <Link href="/mot-de-passe-oublie" className="mt-3 block text-center text-xs text-ink-muted hover:text-ink">Mot de passe oublié ?</Link>

      <div className="mt-5 border-t border-line pt-4 text-center text-xs text-ink-muted">
        Nouveau sur la plateforme ?{" "}
        <Link href="/inscription" className="font-medium text-brand hover:underline">Créer un compte</Link>
      </div>

      <div className="mt-4 rounded-[var(--radius-sm)] bg-surface-elevated px-3 py-2 text-[11px] text-ink-faint">
        Démo : demo@fasopmi.bf / Demo1234!
      </div>
    </div>
  );
}
