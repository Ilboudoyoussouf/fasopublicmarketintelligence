"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { requestPasswordResetAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";

export function MotDePasseOublieForm() {
  const params = useSearchParams();
  const sent = params.get("sent");
  const demoLink = params.get("demoLink");
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, null);

  if (sent) {
    return (
      <div className="text-center">
        <h1 className="text-lg font-semibold text-ink">Vérifiez votre boîte mail</h1>
        <p className="mt-2 text-sm text-ink-muted">Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.</p>
        {demoLink && (
          <div className="mt-4 rounded-md bg-paper-sunken px-3 py-2 text-left text-[11px] text-ink-faint">
            Mode démonstration — lien de test :
            <br />
            <a href={demoLink} className="break-all text-brand underline">{demoLink}</a>
          </div>
        )}
        <Link href="/connexion" className="mt-4 inline-block text-sm text-brand hover:underline">Retour à la connexion</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-ink">Mot de passe oublié</h1>
      <p className="mt-1 text-sm text-ink-muted">Recevez un lien pour réinitialiser votre mot de passe.</p>
      <form action={formAction} className="mt-5 space-y-3">
        <input name="email" type="email" required className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-brand focus:outline-none" placeholder="vous@entreprise.bf" />
        {state && !state.ok && <p className="text-xs text-critical">{state.error}</p>}
        <Button type="submit" variant="primary" className="w-full" disabled={pending}>
          {pending ? "Envoi…" : "Envoyer le lien"}
        </Button>
      </form>
      <Link href="/connexion" className="mt-4 inline-block text-sm text-brand hover:underline">Retour à la connexion</Link>
    </div>
  );
}
