import { ShieldAlert, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";

// Bandeau légal obligatoire — section 1.1 de l'analyse structurelle : les
// quotidiens DGCMEF portent désormais la mention « Seule la version des
// quotidiens disponible sur le site web de la DGCMEF est officielle et
// authentique. Toute autre copie ou diffusion en dehors de cette
// plateforme n'a aucune valeur légale. » Ce bandeau doit apparaître sur
// toute fiche dérivée d'une publication DGCMEF, avec lien direct vers la
// source.
export function OfficialSourceBanner({
  numero,
  page,
  publishedAt,
  sourceUrl,
}: {
  numero?: string | null;
  page?: number | null;
  publishedAt?: string | Date | null;
  sourceUrl?: string | null;
}) {
  if (!numero) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning-soft px-3.5 py-3 text-xs text-ink">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <div className="space-y-1">
        <p>
          Donnée extraite du <strong>Quotidien n°{numero}</strong>
          {publishedAt ? ` du ${formatDate(publishedAt)}` : ""}
          {page ? `, page ${page}` : ""}.{" "}
          <strong>Seule la version publiée sur dgcmef.gov.bf fait foi.</strong> Toute copie en dehors de ce site officiel
          n&apos;a aucune valeur légale.
        </p>
        {sourceUrl && (
          <a href={sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-brand hover:underline">
            Consulter le document officiel sur dgcmef.gov.bf <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
