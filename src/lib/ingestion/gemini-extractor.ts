// Extraction structurée via l'API Gemini (section 40, pipeline d'ingestion).
//
// Remplace le passage heuristique (parser.ts, regex) comme voie principale :
// Gemini lit directement le PDF (mise en page, tableaux, colonnes) plutôt
// que le texte à plat produit par pdf-parse, et raisonne sur l'ensemble du
// document pour distinguer un avis frais d'un tableau de résultats — la
// difficulté qui limitait structurellement l'approche par regex (section
// 2.2). Le parseur regex reste un repli automatique : si l'appel Gemini
// échoue (réseau, quota, clé absente, réponse non conforme), rien n'est
// perdu — segmentAndClassify() prend le relais silencieusement pour ce
// document (jamais de document non traité, section 94).
//
// IMPORTANT (constaté empiriquement, pas dans la documentation) : passer un
// `responseSchema` strict avec un tableau à la racine fait presque toujours
// s'arrêter Gemini après UN SEUL élément du tableau, même sur un document de
// 70+ avis et avec instruction explicite d'exhaustivité (finishReason=STOP,
// donc pas une troncature). Le mode JSON simple (responseMimeType seul, le
// schéma décrit en texte dans le prompt) n'a pas ce problème — validé sur 4
// quotidiens réels. D'où le choix ci-dessous, en apparence moins strict mais
// en pratique nettement plus fiable ; le schéma zod ci-dessous absorbe les
// écarts mineurs de Gemini par rapport au format demandé.
import { z } from "zod";

// Alias "latest" plutôt qu'une version épinglée : un modèle daté se fait
// retirer par Google au fil du temps (constaté en pratique : gemini-2.5-flash
// a cessé d'être disponible pour cette clé en cours de session) — l'alias
// reste toujours valide et pointe automatiquement vers le modèle Flash
// stable courant.
const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

// --- Schéma de sortie attendu (validation, miroir des enums Prisma section 42) ---

const PUBLICATION_TYPES = [
  "AVIS_APPEL_OFFRES", "DEMANDE_PRIX", "DEMANDE_COTATION", "APPEL_OFFRES_OUVERT",
  "APPEL_OFFRES_ACCELERE", "MANIFESTATION_INTERET", "DEMANDE_PROPOSITIONS",
  "RESULTAT_PROVISOIRE", "ATTRIBUTION", "RECTIFICATIF", "ANNULATION", "REPRISE",
  "REEXAMEN", "DECISION_RECOURS", "AVIS_GENERAL_PASSATION",
] as const;

// Aligné strictement sur l'enum Prisma ProcedureType (schema.prisma) — toute
// valeur hors de cette liste (ex. "APPEL_OFFRES_RESTREINT", "ENTENTE_DIRECTE"
// qui n'existent pas dans le schéma) retombe sur AUTRE via enumOrFallback.
const PROCEDURE_TYPES = [
  "APPEL_OFFRES_OUVERT", "APPEL_OFFRES_OUVERT_ACCELERE", "DEMANDE_PRIX",
  "DEMANDE_COTATION", "MANIFESTATION_INTERET", "DEMANDE_PROPOSITIONS",
  "DEMANDE_PROPOSITIONS_ALLEGEE", "AUTRE",
] as const;

const AUTHORITY_TYPES = ["MINISTERE", "INSTITUTION", "EPE", "REGION", "PROVINCE", "COMMUNE", "PROJET", "AUTRE"] as const;
const SECTOR_GROUPS = ["FOURNITURES_SERVICES", "TRAVAUX", "PRESTATIONS_INTELLECTUELLES"] as const;
const FINANCING_SOURCES = ["EXTERIEUR", "NATIONAL", "COMMUNAL", "AUTRE"] as const;

const REQUIREMENT_TYPES = [
  "CHIFFRE_AFFAIRES", "EXPERIENCE_GENERALE", "EXPERIENCE_SPECIFIQUE", "REFERENCES",
  "AGREMENT", "CAPACITE_FINANCIERE", "CAPACITE_TECHNIQUE", "PERSONNEL", "DIPLOMES",
  "CERTIFICATIONS", "EQUIPEMENTS", "MOYENS_MATERIELS", "DELAI", "GARANTIES",
  "PIECES_ADMINISTRATIVES", "DOCUMENTS_TECHNIQUES", "CONDITIONS_GEOGRAPHIQUES",
  "CONDITIONS_RESERVATION", "CERTIFICATION", "CRITERE_ENVIRONNEMENTAL",
] as const;

const REQUIRED_DOC_TYPES = [
  "RCCM", "IFU", "ATTESTATION_FISCALE", "ATTESTATION_SOCIALE", "GARANTIE", "AGREMENT",
  "CERTIFICAT", "REFERENCE", "ATTESTATION_BONNE_EXECUTION", "CV", "DIPLOME",
  "CERTIFICAT_TECHNIQUE", "PIECE_FINANCIERE", "PIECE_ADMINISTRATIVE", "AUTRE",
] as const;

function enumOrFallback<T extends readonly [string, ...string[]]>(values: T, fallback: T[number]) {
  return z.preprocess((v) => (typeof v === "string" ? v.toUpperCase().replace(/[\s-]/g, "_") : v), z.enum(values).catch(fallback));
}

// Gemini dépasse parfois les longueurs demandées dans le prompt (titres
// verbeux, texte d'exigence copié en entier) — on tronque plutôt que de
// rejeter tout le lot pour un seul champ trop long (jamais de perte d'un
// document entier pour un dépassement mineur, section 94).
function truncated(max: number) {
  return z.coerce
    .string()
    .nullable()
    .optional()
    .default("")
    .transform((v) => (typeof v === "string" ? v.slice(0, max) : ""));
}
function nullableTruncated(max: number) {
  return z.coerce
    .string()
    .nullable()
    .optional()
    .default(null)
    .transform((v) => (typeof v === "string" && v.length > 0 ? v.slice(0, max) : null));
}
// Nombre tolérant : Gemini renvoie parfois un nombre sous forme de chaîne
// ("17796610") ou omet le champ — jamais un échec de validation pour ça.
function nullableNumber() {
  return z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .optional()
    .transform((v) => {
      if (v === null || v === undefined || v === "") return null;
      const n = typeof v === "number" ? v : Number(String(v).replace(/[\s,]/g, ""));
      return Number.isFinite(n) ? n : null;
    });
}

const requirementSchema = z.object({
  type: enumOrFallback(REQUIREMENT_TYPES, "PIECES_ADMINISTRATIVES"),
  rawText: truncated(2000),
  thresholdValue: nullableNumber(),
  thresholdUnit: nullableTruncated(60),
});

const requiredDocSchema = z.object({
  docType: enumOrFallback(REQUIRED_DOC_TYPES, "AUTRE"),
  mandatory: z.boolean().default(true),
  rawText: nullableTruncated(2000),
});

const lotSchema = z.object({
  numero: truncated(20),
  objet: truncated(150),
  description: nullableTruncated(2000),
  montant: nullableNumber(),
  quantite: nullableNumber(),
  unite: nullableTruncated(30),
  awardedAmount: nullableNumber(),
  winnerCompanyName: nullableTruncated(190),
});

const dateStringSchema = z
  .string()
  .nullable()
  .optional()
  .transform((v) => {
    if (!v) return null;
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  });

const noticeSchema = z.object({
  isFreshCall: z.boolean().default(false),
  publicationType: enumOrFallback(PUBLICATION_TYPES, "AVIS_APPEL_OFFRES"),
  procedureType: z.preprocess((v) => (typeof v === "string" ? v.toUpperCase().replace(/[\s-]/g, "_") : v), z.enum(PROCEDURE_TYPES).nullable().catch(null)).optional(),
  title: truncated(190),
  reference: nullableTruncated(190),
  authorityName: nullableTruncated(190),
  authorityType: enumOrFallback(AUTHORITY_TYPES, "AUTRE"),
  sectorGroup: z.preprocess((v) => (typeof v === "string" ? v.toUpperCase().replace(/[\s-]/g, "_") : v), z.enum(SECTOR_GROUPS).nullable().catch(null)).optional(),
  regionName: nullableTruncated(60),
  siteDetail: nullableTruncated(500),
  keywords: z
    .array(z.coerce.string().transform((v) => v.slice(0, 60)))
    .max(15)
    .default([])
    .catch([]),
  financingSource: z.preprocess((v) => (typeof v === "string" ? v.toUpperCase().replace(/[\s-]/g, "_") : v), z.enum(FINANCING_SOURCES).nullable().catch(null)).optional(),
  financingDetail: nullableTruncated(2000),
  amountEstimatedExclTax: nullableNumber(),
  amountEstimatedInclTax: nullableNumber(),
  currency: z.coerce.string().nullable().optional().transform((v) => (v && v.length > 0 ? v.slice(0, 10) : "XOF")),
  withdrawalDeadline: dateStringSchema,
  submissionDeadline: dateStringSchema,
  submissionTime: nullableTruncated(20),
  openingAt: dateStringSchema,
  bidValidityDays: nullableNumber(),
  executionDelayDays: nullableNumber(),
  requirements: z.array(requirementSchema).max(60).default([]),
  requiredDocuments: z.array(requiredDocSchema).max(60).default([]),
  lots: z.array(lotSchema).max(60).default([]),
  // Champs utiles quand isFreshCall=false (résultat/attribution/rectificatif...) :
  relatedReference: nullableTruncated(190),
  resultAt: dateStringSchema,
  winnerCompanyName: nullableTruncated(190),
  awardedAmount: nullableNumber(),
  numberOfBids: nullableNumber(),
  decision: nullableTruncated(2000),
  rawExcerpt: truncated(2000),
  confidence: z.union([z.number(), z.string()]).optional().transform((v) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.7;
  }),
});

export type GeminiNotice = z.infer<typeof noticeSchema>;

const responseSchema = z.object({ notices: z.array(noticeSchema).max(300).default([]) });

/**
 * Revalide un tableau d'avis Gemini déjà extraits — utilisé quand des avis
 * font un aller-retour par le client (écran d'aperçu avant ajout en base,
 * section admin/sources) : le client ne fournit que des données déjà
 * produites par cette même extraction, mais on ne fait jamais confiance
 * aveuglément à une valeur qui a transité côté client avant d'écrire en
 * base — mêmes garanties (troncature, repli d'enum) qu'à l'extraction
 * initiale.
 */
export function reviseNotices(notices: unknown[]): GeminiNotice[] {
  return notices.map((n) => noticeSchema.parse(n));
}

const EXTRACTION_PROMPT = `Tu es un extracteur de données structurées pour les quotidiens des marchés publics du Burkina Faso, publiés par la DGCMEF (Direction Générale du Contrôle des Marchés publics et des Engagements Financiers).

ÉTAPE 1 (impérative) : parcours le document PAGE PAR PAGE, du début à la fin. Un quotidien contient généralement entre 10 et 70 avis distincts répartis sur toutes les pages. N'ARRÊTE JAMAIS après avoir trouvé le premier avis — continue systématiquement jusqu'à la dernière page. Ignore uniquement les pages de sommaire/couverture pures sans contenu de marché.

ÉTAPE 2 : pour CHAQUE avis distinct repéré, extrait ses champs (détail ci-dessous). Réponds avec un objet JSON de la forme {"notices": [ ... ]}, un élément par avis.

Deux types de contenus se mélangent dans le document, à distinguer via "isFreshCall" :
1. isFreshCall=true : un NOUVEL appel à la concurrence — avis d'appel d'offres, demande de prix, demande de cotation, manifestation d'intérêt, demande de propositions. Reconnaissable à : une autorité qui « sollicite des offres », un objet du marché, une date limite de dépôt À VENIR.
2. isFreshCall=false : un contenu de SUIVI — tableau de résultats/synthèse, avis d'attribution, rectificatif, annulation, reprise, réexamen, décision de recours, avis général de passation. Reconnaissable à : un tableau de dépouillement, un « Attributaire », des mentions « Conforme/Non conforme », une référence à un marché déjà publié dans un quotidien antérieur. CE N'EST JAMAIS UN NOUVEL APPEL — même si le texte mentionne au passage un type de procédure ("demande de prix", "appel d'offres") pour décrire le marché d'origine.

Champs à extraire pour chaque avis :
{
  "isFreshCall": boolean,
  "publicationType": un parmi AVIS_APPEL_OFFRES, DEMANDE_PRIX, DEMANDE_COTATION, APPEL_OFFRES_OUVERT, APPEL_OFFRES_ACCELERE, MANIFESTATION_INTERET, DEMANDE_PROPOSITIONS, RESULTAT_PROVISOIRE, ATTRIBUTION, RECTIFICATIF, ANNULATION, REPRISE, REEXAMEN, DECISION_RECOURS, AVIS_GENERAL_PASSATION,
  "procedureType": un parmi APPEL_OFFRES_OUVERT, APPEL_OFFRES_OUVERT_ACCELERE, DEMANDE_PRIX, DEMANDE_COTATION, MANIFESTATION_INTERET, DEMANDE_PROPOSITIONS, DEMANDE_PROPOSITIONS_ALLEGEE, AUTRE, ou null,
  "title": le VRAI titre/objet du marché (ex. "Acquisition de matériel informatique au profit de..."). Jamais un fragment de phrase, jamais un repère de liste ("17. Les..."), jamais une référence seule ("N°2026-..."), jamais un label vide ("Objet :"). Ne fabrique rien : si aucun titre exploitable n'existe, résume honnêtement le contenu réel en une phrase courte,
  "reference": la référence officielle du marché (ex. "2026-16F/MAERAH/SG/DMP") ou null,
  "authorityName": le nom de l'autorité contractante EXACTEMENT comme écrit (ministère, commune, projet, société d'État...) ou null,
  "authorityType": un parmi MINISTERE, INSTITUTION, EPE (établissement public), REGION, PROVINCE, COMMUNE, PROJET, AUTRE,
  "sectorGroup": lu dans la ligne de catégorie juste avant le nom de l'autorité — un parmi FOURNITURES_SERVICES, TRAVAUX, PRESTATIONS_INTELLECTUELLES, ou null,
  "regionName": la région du Burkina Faso concernée si mentionnée ou déductible (ex. "Centre", "Hauts-Bassins", "Sahel") ou null,
  "siteDetail": le lieu précis d'exécution/livraison si mentionné ou null,
  "keywords": 3 à 8 mots-clés significatifs (matériel, secteur, nature des travaux...),
  "financingSource": un parmi EXTERIEUR (bailleur international), NATIONAL (budget de l'État), COMMUNAL (budget communal), AUTRE, ou null,
  "financingDetail": le texte exact de la ligne "Financement : ..." si présente, ou null,
  "amountEstimatedExclTax": le montant HTVA en NOMBRE (jamais le texte en lettres — les montants sont souvent écrits "dix-sept millions...(17 796 610) francs CFA en HTVA" : renvoie 17796610), ou null,
  "amountEstimatedInclTax": le montant TTC en nombre si distinct du HTVA, ou null,
  "currency": "XOF" sauf mention contraire,
  "withdrawalDeadline": date limite de retrait des dossiers, format AAAA-MM-JJ, ou null,
  "submissionDeadline": date limite de dépôt des offres, format AAAA-MM-JJ, ou null,
  "submissionTime": l'heure limite de dépôt si mentionnée (ex. "09h00") ou null,
  "openingAt": date d'ouverture des plis, format AAAA-MM-JJ, ou null,
  "bidValidityDays": durée de validité des offres en jours, ou null,
  "executionDelayDays": délai d'exécution/livraison en jours, ou null,
  "requirements": liste de {"type": un parmi CHIFFRE_AFFAIRES, EXPERIENCE_GENERALE, EXPERIENCE_SPECIFIQUE, REFERENCES, AGREMENT, CAPACITE_FINANCIERE, CAPACITE_TECHNIQUE, PERSONNEL, DIPLOMES, CERTIFICATIONS, EQUIPEMENTS, MOYENS_MATERIELS, DELAI, GARANTIES, PIECES_ADMINISTRATIVES, DOCUMENTS_TECHNIQUES, CONDITIONS_GEOGRAPHIQUES, CONDITIONS_RESERVATION, CERTIFICATION, CRITERE_ENVIRONNEMENTAL, "rawText": le texte exact de l'exigence, "thresholdValue": nombre ou null, "thresholdUnit": unité (FCFA, ans, jours...) ou null} — inclut tout ce qui est exigé des candidats, même mentionné brièvement,
  "requiredDocuments": liste de {"docType": un parmi RCCM, IFU, ATTESTATION_FISCALE, ATTESTATION_SOCIALE, GARANTIE, AGREMENT, CERTIFICAT, REFERENCE, ATTESTATION_BONNE_EXECUTION, CV, DIPLOME, CERTIFICAT_TECHNIQUE, PIECE_FINANCIERE, PIECE_ADMINISTRATIVE, AUTRE, "mandatory": boolean, "rawText": texte exact ou null},
  "lots": si le marché est en plusieurs lots, liste de {"numero": "1", "objet": objet du lot, "description": détail ou null, "montant": nombre ou null, "quantite": nombre ou null, "unite": unité ou null, "awardedAmount": nombre ou null (résultats), "winnerCompanyName": nom de l'attributaire du lot ou null (résultats)} — sinon liste vide,
  "relatedReference": UNIQUEMENT si isFreshCall=false : la référence du marché d'origine que ce contenu de suivi concerne (souvent citée explicitement), ou null,
  "resultAt": UNIQUEMENT si isFreshCall=false : date de délibération/décision, format AAAA-MM-JJ, ou null,
  "winnerCompanyName": UNIQUEMENT si isFreshCall=false et qu'un lauréat global est mentionné (hors lots), ou null,
  "awardedAmount": UNIQUEMENT si isFreshCall=false : montant attribué global, ou null,
  "numberOfBids": UNIQUEMENT si isFreshCall=false : nombre d'offres reçues, ou null,
  "decision": UNIQUEMENT si isFreshCall=false : résumé de la décision (attribué / infructueux / annulé / rectifié...) ou null,
  "rawExcerpt": un court extrait (2-3 phrases) du texte source pour traçabilité,
  "confidence": ton estimation honnête (0 à 1) de la fiabilité de cette extraction précise — baisse-la si le texte est ambigu, tronqué, ou si tu improvises une partie des champs
}

RÈGLES IMPÉRATIVES :
- Ne fabrique JAMAIS une donnée absente du texte : laisse le champ null plutôt que de deviner un chiffre ou une date.
- Sois EXHAUSTIF : le document a plusieurs dizaines de pages, extrait TOUS les avis du début à la fin, pas seulement les premiers rencontrés.
- Réponds uniquement avec le JSON demandé, sans texte avant ou après.`;

type GeminiCallOptions = { apiKey?: string; timeoutMs?: number };

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;
const MAX_RETRY_DELAY_MS = 90_000;

// Un 429 de quota (constaté en pratique : palier gratuit à 20 requêtes)
// indique précisément le délai avant réinitialisation ("Please retry in
// 52.65s" dans le message, parfois aussi structuré dans error.details en
// RetryInfo) — l'utiliser directement est bien plus fiable qu'un backoff
// exponentiel générique qui n'a aucune chance d'aboutir avant ce délai.
function parseRetryDelayMs(body: string): number | undefined {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string; details?: { retryDelay?: string }[] } };
    const structured = parsed.error?.details?.find((d) => d.retryDelay)?.retryDelay;
    if (structured) {
      const seconds = Number(structured.replace(/s$/, ""));
      if (Number.isFinite(seconds)) return Math.min(seconds * 1000, MAX_RETRY_DELAY_MS);
    }
    const match = parsed.error?.message?.match(/retry in ([\d.]+)s/i);
    if (match) return Math.min(Number(match[1]) * 1000, MAX_RETRY_DELAY_MS);
  } catch {
    // corps non JSON ou format inattendu — pas de délai exploitable
  }
  return undefined;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiOnce(pdfBuffer: Buffer, apiKey: string, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { inline_data: { mime_type: "application/pdf", data: pdfBuffer.toString("base64") } },
              { text: EXTRACTION_PROMPT },
            ],
          },
        ],
        // Volontairement PAS de responseSchema strict — voir commentaire en
        // tête de fichier (fait s'arrêter Gemini après un seul élément de
        // tableau). responseMimeType seul suffit à garantir un JSON valide ;
        // le schéma zod ci-dessus absorbe les écarts de Gemini par rapport
        // au format demandé en texte.
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const err = new Error(`Gemini API ${res.status}: ${body.slice(0, 500)}`);
      (err as Error & { status?: number; retryAfterMs?: number }).status = res.status;
      (err as Error & { status?: number; retryAfterMs?: number }).retryAfterMs = parseRetryDelayMs(body);
      throw err;
    }

    const json = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
      usageMetadata?: unknown;
    };
    if (process.env.DEBUG_GEMINI) {
      console.error("[gemini] finishReason:", json.candidates?.[0]?.finishReason, "usage:", JSON.stringify(json.usageMetadata));
    }
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error(`Réponse Gemini sans contenu (finishReason=${json.candidates?.[0]?.finishReason ?? "?"}).`);
    return JSON.parse(text);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * L'API Gemini renvoie régulièrement des 503 "high demand" transitoires
 * (constaté en pratique, plusieurs fois de suite en conditions réelles) —
 * une erreur immédiate ferait basculer inutilement vers le repli regex pour
 * un simple pic de charge côté Google. Retry avec backoff exponentiel sur
 * les statuts transitoires (429/50x) uniquement ; les erreurs définitives
 * (401, réponse non conforme...) échouent immédiatement.
 */
async function callGemini(pdfBuffer: Buffer, options: GeminiCallOptions = {}): Promise<unknown> {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY non configurée.");
  const timeoutMs = options.timeoutMs ?? 280_000;

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await callGeminiOnce(pdfBuffer, apiKey, timeoutMs);
    } catch (err) {
      lastError = err;
      const typedErr = err as Error & { status?: number; retryAfterMs?: number };
      const retryable = typedErr.status !== undefined && RETRYABLE_STATUS.has(typedErr.status);
      if (!retryable || attempt === MAX_ATTEMPTS) throw err;
      await sleep(typedErr.retryAfterMs ?? 2 ** attempt * 1000);
    }
  }
  throw lastError;
}

/**
 * Extrait tous les avis d'un quotidien PDF via Gemini. Lève une erreur en
 * cas d'échec (réseau, quota, réponse non conforme) — à l'appelant de
 * décider du repli (voir pipeline.ts : bascule automatique vers
 * segmentAndClassify si cette fonction rejette).
 */
export async function extractNoticesWithGemini(pdfBuffer: Buffer, options: GeminiCallOptions = {}): Promise<GeminiNotice[]> {
  const raw = await callGemini(pdfBuffer, options);
  const parsed = responseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Réponse Gemini non conforme au schéma attendu : ${parsed.error.message.slice(0, 500)}`);
  }
  return parsed.data.notices.filter((n) => n.title && n.title.length > 3);
}
