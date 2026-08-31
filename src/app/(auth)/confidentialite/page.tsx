export default function ConfidentialitePage() {
  return (
    <div className="prose prose-sm max-w-none">
      <h1 className="text-lg font-semibold text-ink">Politique de confidentialité</h1>
      <div className="mt-3 space-y-3 text-sm text-ink-muted">
        <p>
          Nous distinguons strictement les données publiques issues des publications officielles des documents
          privés que vous déposez (pièces administratives, dossiers de soumission). Vos documents privés ne sont
          jamais visibles par une autre organisation abonnée (section 49, isolation multi-tenant).
        </p>
        <p>Vos données de compte (email, téléphone, mots de passe) sont chiffrées au repos et en transit (HTTPS).</p>
        <p>Vous pouvez à tout moment consulter, corriger ou supprimer vos données depuis votre espace « Compte ».</p>
      </div>
    </div>
  );
}
