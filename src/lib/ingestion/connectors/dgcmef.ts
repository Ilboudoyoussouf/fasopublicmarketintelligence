import * as cheerio from "cheerio";
import type { SourceConnector, DiscoveredPublication, DiscoveredDocument } from "@/lib/ingestion/connector";

// Connecteur DGCMEF — rubrique « Revue de marchés pour tous ».
//
// IMPORTANT : cet environnement de développement n'a pas d'accès réseau
// sortant vers dgcmef.gov.bf (bloqué par le proxy sortant du bac à sable).
// Le parsing HTML ci-dessous est donc écrit défensivement à partir de la
// structure documentée en Annexe D du cahier des charges (numéros simples,
// numéros doubles « 4473-4474 » dans un seul PDF, et cas « bis » comme
// 4468/4468 bis), et validé par un test avec fixture locale
// (fixtures/dgcmef-listing.sample.html — voir __tests__/ingestion). En
// production, ajuster les sélecteurs CSS ci-dessous à la structure réelle
// de la page si elle diffère.

const LISTING_PATH = "/index.php/revue-des-marches-publics";

export type ListingFetcher = () => Promise<string>;

function defaultFetcher(baseUrl: string): ListingFetcher {
  return async () => {
    const res = await fetch(new URL(LISTING_PATH, baseUrl).toString(), {
      headers: { "User-Agent": "FasoMarketIntelligenceBot/1.0 (+veille commande publique)" },
    });
    if (!res.ok) throw new Error(`DGCMEF listing fetch failed: HTTP ${res.status}`);
    return res.text();
  };
}

const NUMERO_PATTERN = /n\s*°?\s*(\d{3,5}(?:\s*-\s*\d{3,5})?)/i;

function parseNumero(text: string): { numero: string; isDouble: boolean } | null {
  const match = text.match(NUMERO_PATTERN);
  if (!match) return null;
  const numero = match[1].replace(/\s+/g, "");
  return { numero, isDouble: numero.includes("-") };
}

export function parseListingHtml(html: string, baseUrl: string): DiscoveredPublication[] {
  const $ = cheerio.load(html);
  const byNumero = new Map<string, DiscoveredPublication>();

  $("a[href$='.pdf'], a[href*='.pdf?']").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const linkText = $(el).text().trim();
    const rowText = $(el).closest("tr, li, .item, div").text().trim();
    const parsed = parseNumero(linkText) || parseNumero(rowText) || parseNumero(href);
    if (!parsed) return;

    const isBis = /bis/i.test(linkText) || /bis/i.test(href);
    const url = new URL(href, baseUrl).toString();
    const filename = href.split("/").pop() || `${parsed.numero}.pdf`;

    // Date : cherche un motif JJ/MM/AAAA ou JJ-MM-AAAA dans la ligne.
    const dateMatch = rowText.match(/(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})/);
    const publishedAt = dateMatch
      ? new Date(Number(dateMatch[3]), Number(dateMatch[2]) - 1, Number(dateMatch[1]))
      : new Date();

    const existing = byNumero.get(parsed.numero);
    const doc: DiscoveredDocument = { filename, url, isPrincipal: !isBis, isBis };

    if (existing) {
      existing.documents.push(doc);
    } else {
      byNumero.set(parsed.numero, {
        numero: parsed.numero,
        isDoubleIssue: parsed.isDouble,
        publishedAt,
        title: linkText || undefined,
        documents: [doc],
      });
    }
  });

  return [...byNumero.values()].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

/** Exposé pour le diagnostic (`/api/cron/ingest-dgcmef?debug=1`) : permet d'inspecter la page réelle sans dépendre d'un connecteur déjà construit. */
export async function fetchListingHtml(baseUrl: string): Promise<string> {
  return defaultFetcher(baseUrl)();
}

export function createDgcmefConnector(baseUrl: string, fetcher?: ListingFetcher): SourceConnector {
  const getListing = fetcher ?? defaultFetcher(baseUrl);
  return {
    sourceName: "DGCMEF",
    baseUrl,
    async discover() {
      const html = await getListing();
      return parseListingHtml(html, baseUrl);
    },
    async download(doc) {
      const res = await fetch(doc.url, { headers: { "User-Agent": "FasoMarketIntelligenceBot/1.0" } });
      if (!res.ok) throw new Error(`Téléchargement échoué (${res.status}) : ${doc.url}`);
      return Buffer.from(await res.arrayBuffer());
    },
  };
}
