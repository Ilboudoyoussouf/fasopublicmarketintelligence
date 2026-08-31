// Abstraction d'envoi d'email — aucun fournisseur SMTP n'est configuré dans
// cet environnement de démonstration. En production, brancher un provider
// (Resend, SES, Mailgun...) ici sans changer les appelants.
export async function sendEmail(to: string, subject: string, body: string) {
  if (!process.env.SMTP_URL) {
    console.log(`[email:not-configured] to=${to} subject="${subject}"\n${body}`);
    return { delivered: false, reason: "SMTP non configuré (mode démonstration)" };
  }
  // TODO: brancher un fournisseur réel via SMTP_URL.
  return { delivered: false, reason: "Fournisseur non implémenté" };
}
