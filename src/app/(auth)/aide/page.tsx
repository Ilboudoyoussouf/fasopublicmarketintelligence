import Link from "next/link";

const FAQ: { question: string; reponse: string }[] = [
  {
    question: "D'où proviennent les données de la plateforme ?",
    reponse:
      "Chaque marché provient d'un quotidien officiel publié par la Direction Générale du Contrôle des Marchés publics et des Engagements Financiers (DGCMEF). Les documents sont téléchargés automatiquement puis restructurés en fiches consultables — aucune donnée n'est inventée ou estimée.",
  },
  {
    question: "Comment sont calculées les recommandations d'opportunités ?",
    reponse:
      "Un moteur de scoring compare chaque nouveau marché au profil de votre entreprise (secteur, régions, taille de marché habituelle) et lui attribue un verdict : compatible, probablement compatible, à vérifier ou incompatible. Complétez votre profil dans « Mon entreprise » pour affiner les résultats.",
  },
  {
    question: "Qu'est-ce qu'un dossier de soumission ?",
    reponse:
      "C'est votre espace de préparation pour répondre à un marché : checklist des pièces requises, documents déposés et échéances, propre à votre organisation et jamais visible par une autre entreprise abonnée.",
  },
  {
    question: "Comment activer des alertes sur un secteur ou une région ?",
    reponse:
      "Rendez-vous dans « Veille » pour créer une alerte selon vos critères (secteur, région, montant, mots-clés). Vous serez notifié dès qu'un marché correspondant est publié.",
  },
  {
    question: "Puis-je faire confiance aux montants et dates affichés ?",
    reponse:
      "Oui : chaque fiche marché renvoie vers l'extrait du document source qui a servi à l'extraire. En cas de doute, comparez toujours avec le quotidien original avant de soumettre un dossier — la plateforme est un outil de veille, pas un substitut aux textes officiels.",
  },
  {
    question: "Comment corriger une erreur sur une fiche marché ?",
    reponse:
      "Utilisez le bouton « Signaler un problème » sur la fiche concernée, ou contactez le support (voir ci-dessous) en précisant la référence du marché.",
  },
];

export default function AidePage() {
  return (
    <div className="max-w-none space-y-6 text-sm">
      <div>
        <h1 className="text-lg font-semibold text-ink">Centre d&apos;aide</h1>
        <p className="mt-1 text-ink-muted">Questions fréquentes sur l&apos;utilisation de FASO Market Intelligence.</p>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Prise en main</h2>
        <ol className="list-decimal space-y-1.5 pl-4 text-ink-muted">
          <li>Complétez votre profil d&apos;entreprise (secteurs, régions, taille de marché) dans « Compte → Mon entreprise ».</li>
          <li>Consultez « Opportunités » pour voir les marchés déjà qualifiés pour votre profil.</li>
          <li>Ouvrez un dossier de soumission depuis une fiche marché pour suivre votre préparation.</li>
          <li>Activez une veille dans « Veille » pour être alerté des futures publications pertinentes.</li>
        </ol>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Questions fréquentes</h2>
        <div className="space-y-3">
          {FAQ.map((f) => (
            <details key={f.question} className="group rounded-[var(--radius-md)] border border-line p-3">
              <summary className="cursor-pointer text-sm font-medium text-ink marker:content-none">{f.question}</summary>
              <p className="mt-2 text-xs text-ink-muted">{f.reponse}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="rounded-[var(--radius-md)] border border-line bg-surface-elevated p-3">
        <p className="text-sm font-medium text-ink">Besoin d&apos;aide supplémentaire ?</p>
        <p className="mt-1 text-xs text-ink-muted">
          Écrivez-nous à{" "}
          <a href="mailto:support@fasopmi.bf" className="text-brand underline">support@fasopmi.bf</a>{" "}
          en précisant votre organisation et, si possible, la référence du marché concerné.
        </p>
      </div>

      <p className="text-[11px] text-ink-faint">
        Voir aussi <Link href="/conditions-utilisation" className="underline">Conditions d&apos;utilisation</Link> et{" "}
        <Link href="/confidentialite" className="underline">Politique de confidentialité</Link>.
      </p>
    </div>
  );
}
