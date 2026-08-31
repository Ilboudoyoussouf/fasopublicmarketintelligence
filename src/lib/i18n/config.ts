// Scaffold d'internationalisation — section 97 : « Prévoir dès le départ :
// français, anglais. Architecture prête pour les autres langues. »
//
// L'interface est aujourd'hui rédigée directement en français (marché
// prioritaire). Ce module fournit la structure nécessaire pour activer
// l'anglais sans réécrire les écrans : un dictionnaire par langue, chargé
// côté serveur. Le branchement complet (routing par locale, bascule dans
// chaque composant) est un chantier de suite — voir README, section
// « Roadmap ».
export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

export function isSupportedLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
