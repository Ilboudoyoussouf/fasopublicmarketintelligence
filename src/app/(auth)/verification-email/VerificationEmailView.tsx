"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { verifyEmailAction } from "@/app/(auth)/actions";
import { CheckCircle2, MailCheck, XCircle } from "lucide-react";

export function VerificationEmailView() {
  const params = useSearchParams();
  const token = params.get("token");
  const sent = params.get("sent");
  const demoLink = params.get("demoLink");
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "error">(token ? "checking" : "idle");

  useEffect(() => {
    if (!token) return;
    verifyEmailAction(token).then((r) => setStatus(r.ok ? "ok" : "error"));
  }, [token]);

  if (status === "ok") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="h-8 w-8 text-success" />
        <h1 className="text-lg font-semibold text-ink">Email vérifié</h1>
        <p className="text-sm text-ink-muted">Votre adresse email est confirmée.</p>
        <Link href="/connexion" className="text-sm text-brand hover:underline">Se connecter</Link>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <XCircle className="h-8 w-8 text-critical" />
        <h1 className="text-lg font-semibold text-ink">Lien invalide ou expiré</h1>
        <Link href="/connexion" className="text-sm text-brand hover:underline">Retour à la connexion</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <MailCheck className="h-8 w-8 text-brand" />
      <h1 className="text-lg font-semibold text-ink">Vérifiez votre boîte mail</h1>
      <p className="text-sm text-ink-muted">
        {sent ? "Un lien de vérification a été envoyé à votre adresse email." : "Consultez votre boîte mail pour confirmer votre compte."}
      </p>
      {demoLink && (
        <div className="w-full rounded-md bg-paper-sunken px-3 py-2 text-left text-[11px] text-ink-faint">
          Aucun fournisseur d&apos;email n&apos;est configuré dans cet environnement de démonstration — lien de test :
          <br />
          <a href={demoLink} className="break-all text-brand underline">{demoLink}</a>
        </div>
      )}
    </div>
  );
}
