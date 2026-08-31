import type { Locale } from "@/lib/i18n/config";
import fr from "@/lib/i18n/dictionaries/fr.json";
import en from "@/lib/i18n/dictionaries/en.json";

const dictionaries = { fr, en } as const;

export function getDictionary(locale: Locale) {
  return dictionaries[locale] ?? dictionaries.fr;
}
