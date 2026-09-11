// Segmentation + classification + extraction structurée (section 2.2, pipeline).
// Approche heuristique (regex + dictionnaires) sur le texte administratif
// français : déterministe, traçable, et sert de première passe avant
// validation humaine (section 45) — jamais présentée comme une vérité
// absolue (chaque champ porte une confiance, section 44).

export type RequirementCandidate = {
  type: string; // RequirementType
  rawText: string;
  thresholdValue: number | null;
  thresholdUnit: string | null;
  confidence: number;
};

export type RequiredDocCandidate = {
  docType: string; // RequiredDocType
  mandatory: boolean;
  rawText: string | null;
};

export type LotCandidate = {
  numero: string;
  objet: string;
  montant: number | null;
};

export type ExtractedNoticeCandidate = {
  rawBlock: string;
  publicationTypeGuess: string;
  procedureTypeGuess: string | null;
  reference: string | null;
  title: string | null;
  authorityGuess: string | null;
  amountExclTax: number | null;
  submissionDeadline: Date | null;
  withdrawalDeadline: Date | null;
  openingAt: Date | null;
  bidValidityDays: number | null;
  executionDelayDays: number | null;
  regionGuess: string | null;
  requirements: RequirementCandidate[];
  requiredDocuments: RequiredDocCandidate[];
  lots: LotCandidate[];
  confidence: number;
};

// Les en-têtes réels portent quasi systématiquement le préfixe "AVIS DE"/
// "AVIS D'" (ex. "AVIS DE DEMANDE DE PRIX") : on fait démarrer le bloc au
// début de ce préfixe quand il est présent (variantes ci-dessous listées
// avant leur équivalent nu), sinon on retombe sur le mot-clé seul.
// Volontairement SENSIBLE À LA CASSE (pas de flag "i") : le corps des avis
// réutilise très souvent la même expression en minuscules dans une phrase
// ("Cet avis de demande de prix fait suite à…", "la présente demande de
// prix…") — confirmé sur le quotidien n°4486, où cela tronquait le bloc dès
// la première ligne. Les en-têtes eux-mêmes sont systématiquement en
// capitales, ce qui suffit à les distinguer sans perdre en robustesse.
// "SYNTHESE DES RESULTATS DE LA DEMANDE DE PRIX N°...", "SYNTHESE AVIS
// D'APPEL D'OFFRES OUVERT LOCAL N°...", "FICHE DE SYNTHESE RECTIFICATIVE...",
// "SYNTHESE : Appel d'offres accéléré..." : un tableau de résultats cite le
// type de procédure d'origine dans son propre en-tête (confirmé sur 4
// quotidiens réels distincts, sous des formulations très variables) — d'où
// un déclencheur générique "SYNTHESE" (placé avant, donc prioritaire dès
// qu'il apparaît), avec retour arrière négatif pour ne pas matcher au
// milieu d'un mot ("OSTEOSYNTHESE"). Pluriel toléré sur "RESULTAT(S)
// PROVISOIRE(S)". "APPEL D'OFFRES" sans le préfixe "AVIS" est aussi un
// en-tête réel valide (ex. "APPEL D'OFFRES OUVERT DIRECT(AOOD)...") — et
// couvre au passage la coquille source "APPEL D'APPEL D'OFFRES...".
const NOTICE_BOUNDARY = /((?<![A-ZÀ-Ü])(?:FICHE\s+(?:DE\s+)?)?SYNTHESE|R[ÉE]SULTATS?\s+PROVISOIRES?|AVIS\s+D[’']APPEL\s+D[’']OFFRES|AVIS\s+DE\s+DEMANDE\s+DE\s+PRIX|AVIS\s+DE\s+DEMANDE\s+DE\s+COTATION|AVIS\s+(?:DE|A)\s+MANIFESTATION\s+D[’']INT[ÉE]R[ÊE]T|AVIS\s+DE\s+DEMANDE\s+DE\s+PROPOSITIONS|APPEL\s+D[’']OFFRES|DEMANDE\s+DE\s+PRIX|DEMANDE\s+DE\s+COTATION|MANIFESTATION\s+D[’']INT[ÉE]R[ÊE]T|DEMANDE\s+DE\s+PROPOSITIONS|AVIS\s+D[’']ATTRIBUTION|RECTIFICATIF|AVIS\s+D[’']ANNULL?ATION)/g;

const PROCEDURE_KEYWORDS: [RegExp, string][] = [
  [/appel\s+d[’']offres\s+ouvert\s+acc[ée]l[ée]r[ée]/i, "APPEL_OFFRES_OUVERT_ACCELERE"],
  [/appel\s+d[’']offres\s+ouvert/i, "APPEL_OFFRES_OUVERT"],
  [/demande\s+de\s+prix/i, "DEMANDE_PRIX"],
  [/demande\s+de\s+cotation/i, "DEMANDE_COTATION"],
  [/manifestation\s+d[’']int[ée]r[êe]t/i, "MANIFESTATION_INTERET"],
  [/demande\s+de\s+propositions\s+all[ée]g[ée]e/i, "DEMANDE_PROPOSITIONS_ALLEGEE"],
  [/demande\s+de\s+propositions/i, "DEMANDE_PROPOSITIONS"],
];

const PUBLICATION_KEYWORDS: [RegExp, string][] = [
  [/synthese/i, "RESULTAT_PROVISOIRE"],
  [/r[ée]sultats?\s+provisoires?/i, "RESULTAT_PROVISOIRE"],
  [/attribution/i, "ATTRIBUTION"],
  [/rectificatif|rectificative/i, "RECTIFICATIF"],
  [/annull?ation/i, "ANNULATION"],
  // "reprise" est un vrai mot-clé d'en-tête, mais aussi un simple suffixe
  // d'« ENTREPRISE » (nom de société, omniprésent) — exclu explicitement.
  [/(?<!ent)reprise/i, "REPRISE"],
  [/r[ée]examen/i, "REEXAMEN"],
  [/appel\s+d[’']offres/i, "AVIS_APPEL_OFFRES"],
  [/demande\s+de\s+prix/i, "DEMANDE_PRIX"],
  [/demande\s+de\s+cotation/i, "DEMANDE_COTATION"],
  [/manifestation\s+d[’']int[ée]r[êe]t/i, "MANIFESTATION_INTERET"],
  [/demande\s+de\s+propositions/i, "DEMANDE_PROPOSITIONS"],
];

const REFERENCE_PATTERN = /n[°o]\s*([A-Z0-9][A-Z0-9./-]{3,30})/i;
// Les quotidiens DGCMEF écrivent la plupart des montants en toutes lettres,
// suivies de la valeur numérique entre parenthèses (ex. "dix-sept millions
// ...(17 796 610) francs CFA en HTVA"), parfois avec un retour à la ligne
// juste avant la parenthèse. On cherche donc en priorité la première valeur
// parenthésée après "montant" (généralement le montant HTVA, cité avant le
// TTC) ; le motif à chiffres directs reste un filet de sécurité pour les
// avis plus courts qui écrivent le montant en chiffres uniquement.
const AMOUNT_PAREN_PATTERN = /montant[^(]{0,200}\(([\d\s.,]{4,20})\)\s*(?:francs?\s*cfa|f\s*cfa|fcfa|xof)/i;
const AMOUNT_DIRECT_PATTERN = /(?:montant|estimation|budget)[^\d]{0,20}([\d\s.,]{5,20})\s*(?:f\s*cfa|fcfa|xof)/i;
const DATE_PATTERN = (label: RegExp) => new RegExp(`${label.source}[^\\d]{0,25}(\\d{1,2})[\\/.\\-](\\d{1,2})[\\/.\\-](\\d{4})`, "i");
const DEADLINE_PATTERN = DATE_PATTERN(/(?:date\s+limite|au\s+plus\s+tard\s+le|d[ée]p[ôo]t\s+des\s+offres)/);
const WITHDRAWAL_PATTERN = DATE_PATTERN(/retrait\s+(?:du|des)\s+dossiers?/);
const OPENING_PATTERN = DATE_PATTERN(/ouverture\s+(?:des\s+plis|des\s+offres)/);
const VALIDITY_PATTERN = /validit[ée]\s+(?:de\s+l[’']offre|des\s+offres)[^\d]{0,15}(\d{1,4})\s*jours?/i;
const EXECUTION_PATTERN = /d[ée]lai\s+d[’']ex[ée]cution[^\d]{0,15}(\d{1,4})\s*jours?/i;
const AUTHORITY_STOPWORD = /\s+(?:lance|sollicite|invite|recherche|informe|porte|organise|procède)/i;
const AUTHORITY_PATTERN = /(minist[èe]re[^,.\n]{3,80}|commune\s+de\s+[a-zàâäéèêëîïôöùûüç\-\s]{2,40}|office\s+national[^,.\n]{3,80}|soci[ée]t[ée]\s+nationale[^,.\n]{3,80})/i;
const LOT_LINE_PATTERN = /lot\s*n?[°o]?\s*(\d{1,3})\s*[:\-–]\s*([^\n]{5,150})/gi;
const LOT_AMOUNT_PATTERN = /([\d\s.,]{4,20})\s*(?:f\s*cfa|fcfa|xof)/i;
// Un même "Lot N :" apparaît souvent deux fois dans un avis : une fois dans
// le paragraphe de montant prévisionnel ("Lot 1 : six millions ...(6 440
// 678) francs CFA en HTVA...") et une fois dans la description réelle du
// lot ("Lot 1 : Travaux de construction d'une salle de classe..."). On
// écarte l'occurrence "montant" pour l'objet (mais on récupère son montant)
// quand une occurrence plus descriptive existe pour le même numéro.
const AMOUNT_WORD_START = /^(?:\d|une?|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize|vingt|trente|quarante|cinquante|soixante|cent|mille|millions?)\b/i;

function cleanAuthority(raw: string): string {
  const stop = raw.search(AUTHORITY_STOPWORD);
  return (stop === -1 ? raw : raw.slice(0, stop)).trim();
}
const REGION_KEYWORDS = ["Centre", "Hauts-Bassins", "Centre-Est", "Sahel", "Boucle du Mouhoun", "Centre-Ouest", "Est", "Nord", "Plateau-Central", "Sud-Ouest", "Centre-Sud", "Centre-Nord", "Cascades"];

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[\s.]/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseDateMatch(m: RegExpMatchArray | null): Date | null {
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

// Longueur maximale des champs texte libre (titre, autorité) — alignée sur
// la colonne MySQL générée par Prisma pour un `String` sans type natif
// explicite (VARCHAR(191)) afin qu'une extraction verbeuse ne fasse jamais
// échouer la création du marché.
const MAX_TITLE_LENGTH = 190;

// Signatures fiables d'un titre qui n'en est pas un — repérées en comparant
// les vrais titres de marché (toujours "Acquisition de...", "Travaux de...",
// "Réalisation de..." : un nom commun avec majuscule initiale) aux fragments
// produits par un mauvais découpage à l'intérieur d'un tableau de résultats
// (confirmé sur 4 quotidiens réels distincts — jamais vus sur un vrai titre) :
//   - reprise mi-phrase, ex. "340) francs CFA..." ou "authentique) BATI..."
//   - repère de liste numérotée, ex. "17.   Les acquisitions..."
//   - référence seule, ex. "N°2026-036/MAERAH/SG/PRECEL/SPM du..."
//   - label vide, ex. "Objet du marché :" (aucune valeur n'a suivi le label)
//   - minuscule initiale, ex. "lorsque le marché...", "de réservation..."
// On rejette plutôt que de créer un marché avec un titre manifestement faux
// — cohérent avec la philosophie du module (jamais de vérité présumée).
const BAD_TITLE_PATTERNS = [
  /^\d+[).]/, // "340)..." / "17. Les acquisitions..."
  /^n[°o]\s*\d/i, // "N°2026-036/..."
  /^objets?\s+du\s+march[ée]\s*:?\s*$/i,
  /^objet\s*:?\s*$/i,
  /^[a-zàâäéèêëîïôöùûüç]/, // minuscule initiale : toujours une reprise mi-phrase dans le corpus observé
];

function cleanTitle(title: string | null): string | null {
  if (!title) return null;
  const trimmed = title.trim();
  return BAD_TITLE_PATTERNS.some((p) => p.test(trimmed)) ? null : title;
}

function guessTitle(block: string): string | null {
  // Le titre suit généralement le motif d'objet : "objet : ..." ou la
  // première ligne significative après l'en-tête du type d'avis. Sert de
  // filet de sécurité quand le préambule (voir extractPreambleTitleAuthority)
  // n'a rien donné.
  const objetMatch = block.match(/objet\s*:?\s*([^\n]{10,200})/i);
  if (objetMatch) return objetMatch[1].trim().slice(0, MAX_TITLE_LENGTH);
  const firstLine = block.split("\n").map((l) => l.trim()).find((l) => l.length > 15 && !NOTICE_BOUNDARY.test(l));
  return firstLine ? firstLine.slice(0, MAX_TITLE_LENGTH) : null;
}

// Le texte réel des quotidiens DGCMEF place le titre du marché et l'autorité
// contractante AVANT l'en-tête du type d'avis, jamais après un label
// "Objet :" (vérifié sur le quotidien n°4486) :
//   Fournitures et Services courants          <- catégorie (ignorée)
//   MINISTERE DE L'AGRICULTURE, ...            <- autorité (tout en capitales)
//   Acquisition de petits matériels agricoles  <- titre (peut s'étaler
//   ... au profit du Projet ...                   sur plusieurs lignes)
//   AVIS D'APPEL D'OFFRES OUVERT NATIONAL      <- en-tête (début du bloc)
// On repère donc, dans les dernières lignes du texte qui précède l'en-tête,
// la dernière ligne "tout en capitales" (l'autorité), puis on prend tout ce
// qui suit comme titre.
const NOISE_PREAMBLE_LINE = /^(n[°o]\s*\d|www\.|\d{1,4}$)/i;

function isMostlyUppercase(line: string): boolean {
  const letters = line.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "");
  if (letters.length < 6) return false;
  const upper = letters.replace(/[^A-ZÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ]/g, "");
  return upper.length / letters.length > 0.85;
}

function extractPreambleTitleAuthority(precedingText: string): { title: string | null; authority: string | null } {
  const window = precedingText.length > 3000 ? precedingText.slice(-3000) : precedingText;
  const lines = window
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !NOISE_PREAMBLE_LINE.test(l));
  const tail = lines.slice(-25);

  let authorityIdx = -1;
  for (let i = tail.length - 1; i >= 0; i--) {
    if (isMostlyUppercase(tail[i]) && tail[i].length >= 8) {
      authorityIdx = i;
      break;
    }
  }
  if (authorityIdx === -1) return { title: null, authority: null };

  const authority = tail[authorityIdx];
  const titleLines = tail.slice(authorityIdx + 1);
  // Filet de sécurité : si l'en-tête n'a pas été reconnu avec son préfixe
  // "AVIS DE"/"AVIS D'" (variante non couverte par NOTICE_BOUNDARY), ce
  // résidu se retrouve en fin de titre — on le retire.
  const title = titleLines
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+AVIS(?:\s+DE|\s+D[’'])?\s*$/i, "")
    .trim()
    .slice(0, MAX_TITLE_LENGTH);
  return { title: title.length > 8 ? title : null, authority: authority.slice(0, MAX_TITLE_LENGTH) };
}

// Section "Exigences / critères de qualification" — le dictionnaire couvre
// le référentiel RequirementType du schéma (section 9). Chaque motif est
// cherché dans tout le bloc (une exigence peut apparaître hors d'une
// section dédiée, notamment dans les avis courts).
const REQUIREMENT_PATTERNS: { type: string; pattern: RegExp; unit?: string }[] = [
  { type: "CHIFFRE_AFFAIRES", pattern: /chiffre\s+d[’']affaires\s+moyen[^\d]{0,20}([\d\s.,]{4,20})\s*(?:f\s*cfa|fcfa|xof)/i, unit: "FCFA" },
  { type: "EXPERIENCE_SPECIFIQUE", pattern: /(?:au\s+moins\s+)?(\d{1,2})\s+march[ées]s?\s+similaires?[^\n.]{0,120}/i },
  { type: "EXPERIENCE_GENERALE", pattern: /exp[ée]rience\s+(?:g[ée]n[ée]rale\s+)?(?:d[’']au\s+moins\s+)?(\d{1,2})\s+ans?/i, unit: "ans" },
  { type: "AGREMENT", pattern: /agr[ée]ment\s+(?:technique\s+)?(?:de\s+cat[ée]gorie\s+[A-Z0-9\-]+\s+)?[^\n.]{0,100}(?:en\s+cours\s+de\s+validit[ée])?/i },
  { type: "CAPACITE_FINANCIERE", pattern: /capacit[ée]\s+financi[èe]re[^\n.]{0,150}/i },
  { type: "CAPACITE_TECHNIQUE", pattern: /capacit[ée]\s+technique[^\n.]{0,150}/i },
  { type: "PERSONNEL", pattern: /personnel\s+(?:cl[ée]|qualifi[ée])[^\n.]{0,150}/i },
  { type: "DIPLOMES", pattern: /dipl[ôo]me[^\n.]{0,120}/i },
  { type: "CERTIFICATIONS", pattern: /certification\s+(?:iso\s*[\d]+|qualit[ée])[^\n.]{0,100}/i },
  { type: "EQUIPEMENTS", pattern: /(?:mat[ée]riel|[ée]quipements?)\s+(?:roulant|minimum|requis)[^\n.]{0,120}/i },
  { type: "GARANTIES", pattern: /garantie\s+de\s+soumission[^\n.]{0,120}/i },
  { type: "CRITERE_ENVIRONNEMENTAL", pattern: /(?:crit[èe]re|plan)\s+(?:environnemental|de\s+gestion\s+environnementale)[^\n.]{0,150}/i },
  { type: "CONDITIONS_RESERVATION", pattern: /r[ée]serv[ée]e?\s*:?\s*(?:aux?\s+)?(?:pme|micro(?:s)?\s+et\s+petites?\s+entreprises?|petites?\s+et\s+moyennes?\s+entreprises?|femmes|jeunes|entreprises?\s+communautaires?|entreprises?\s+burkinab[ée])[^\n.]{0,100}/i },
];

function extractRequirements(block: string): RequirementCandidate[] {
  const found: RequirementCandidate[] = [];
  for (const { type, pattern, unit } of REQUIREMENT_PATTERNS) {
    const m = block.match(pattern);
    if (!m) continue;
    const numeric = m[1] ? Number(m[1].replace(/[\s.]/g, "").replace(",", ".")) : null;
    found.push({
      type,
      rawText: m[0].trim().slice(0, 300),
      thresholdValue: numeric && Number.isFinite(numeric) ? numeric : null,
      thresholdUnit: numeric ? (unit ?? null) : null,
      confidence: 0.75,
    });
  }
  return found;
}

// Section "Pièces à fournir / Dossier de candidature" — dictionnaire aligné
// sur RequiredDocType. Recherche par mot-clé plutôt que par liste à puces
// stricte : la mise en forme des quotidiens varie trop pour un parseur de
// liste unique fiable.
const REQUIRED_DOC_PATTERNS: [RegExp, string][] = [
  [/\bR\.?C\.?C\.?M\.?\b|registre\s+du\s+commerce/i, "RCCM"],
  [/\bI\.?F\.?U\.?\b|identifiant\s+financier\s+unique/i, "IFU"],
  [/attestation\s+(?:de\s+situation\s+)?fiscale/i, "ATTESTATION_FISCALE"],
  [/attestation\s+(?:de\s+situation\s+)?sociale|attestation\s+cnss/i, "ATTESTATION_SOCIALE"],
  [/garantie\s+de\s+soumission|caution\s+de\s+soumission/i, "GARANTIE"],
  [/agr[ée]ment\s+(?:technique)?/i, "AGREMENT"],
  [/certificat\s+(?:de\s+qualification|technique)/i, "CERTIFICAT_TECHNIQUE"],
  [/attestation\s+de\s+(?:bonne\s+ex[ée]cution|r[ée]f[ée]rence)/i, "ATTESTATION_BONNE_EXECUTION"],
  [/curriculum\s+vitae|\bCV\b/i, "CV"],
  [/dipl[ôo]me/i, "DIPLOME"],
  [/pi[èe]ce\s+financi[èe]re|bilan\s+financier|[ée]tats?\s+financiers?/i, "PIECE_FINANCIERE"],
  [/pi[èe]ce\s+administrative/i, "PIECE_ADMINISTRATIVE"],
  [/certificat\b/i, "CERTIFICAT"],
  [/r[ée]f[ée]rence\s+(?:technique|similaire)/i, "REFERENCE"],
];

function extractRequiredDocuments(block: string): RequiredDocCandidate[] {
  const seen = new Set<string>();
  const found: RequiredDocCandidate[] = [];
  // Restreindre la recherche à une éventuelle section dédiée quand elle
  // existe (évite de capter "RCCM" mentionné incidemment ailleurs) ; à
  // défaut, retombe sur le bloc entier avec une confiance implicite plus
  // faible, cohérent avec le reste du module (jamais de perte silencieuse).
  const sectionMatch = block.match(/(?:pi[èe]ces?\s+(?:à|a)\s+fournir|dossier\s+de\s+candidature\s+doit\s+comprendre|composition\s+du\s+dossier)([\s\S]{0,1500})/i);
  const scope = sectionMatch ? sectionMatch[1] : block;

  for (const [pattern, docType] of REQUIRED_DOC_PATTERNS) {
    if (seen.has(docType)) continue;
    const m = scope.match(pattern);
    if (!m) continue;
    seen.add(docType);
    const lineStart = scope.lastIndexOf("\n", m.index ?? 0) + 1;
    const lineEnd = scope.indexOf("\n", m.index ?? 0);
    const line = scope.slice(lineStart, lineEnd === -1 ? undefined : lineEnd).trim();
    found.push({ docType, mandatory: !/optionnel|facultatif/i.test(line), rawText: line.slice(0, 200) || null });
  }
  return found;
}

function extractLots(block: string): LotCandidate[] {
  const byNumero = new Map<string, LotCandidate>();
  // Une ligne à la fois : évite qu'un montant appartenant au lot suivant
  // ne "fuite" dans le lot courant (la capture d'objet est gourmande par
  // construction, donc on la contient strictement à la ligne du match).
  for (const m of block.matchAll(LOT_LINE_PATTERN)) {
    const numero = m[1];
    const line = m[2].trim();
    const amountMatch = line.match(LOT_AMOUNT_PATTERN);
    const objet = (amountMatch ? line.slice(0, amountMatch.index).replace(/[—\-–:]\s*$/, "").trim() : line).slice(0, 150);
    const montant = amountMatch ? parseAmount(amountMatch[1]) : null;
    const isAmountish = objet.length < 5 || AMOUNT_WORD_START.test(objet);

    const existing = byNumero.get(numero);
    if (!existing) {
      byNumero.set(numero, { numero, objet, montant });
      continue;
    }
    const existingIsAmountish = existing.objet.length < 5 || AMOUNT_WORD_START.test(existing.objet);
    if (existingIsAmountish && !isAmountish) {
      byNumero.set(numero, { numero, objet, montant: montant ?? existing.montant });
    } else if (!existingIsAmountish && existing.montant == null && montant != null) {
      existing.montant = montant;
    }
  }
  return [...byNumero.values()];
}

// Distance minimale (caractères) entre deux frontières pour qu'elles soient
// traitées comme deux avis distincts. En dessous, on considère qu'il s'agit
// du même en-tête citant deux mots-clés proches (ex. "SYNTHESE DES
// RESULTATS DE LA DEMANDE DE PRIX N°…" : un tableau de résultats cite le
// type de procédure d'origine à quelques mots de son propre en-tête) — sans
// ce filtre, un seul avis se scindait en deux blocs parasites, dont un
// second à tort classé comme un nouvel appel (confirmé sur le quotidien
// n°4486).
const MIN_BOUNDARY_GAP = 60;

export function segmentAndClassify(fullText: string): ExtractedNoticeCandidate[] {
  const rawIndices: number[] = [];
  const matches = [...fullText.matchAll(NOTICE_BOUNDARY)];
  for (const m of matches) if (m.index !== undefined) rawIndices.push(m.index);
  if (rawIndices.length === 0) return [];

  const indices = rawIndices.filter((idx, i) => i === 0 || idx - rawIndices[i - 1] >= MIN_BOUNDARY_GAP);

  const blocks = indices.map((start, i) => fullText.slice(start, indices[i + 1] ?? fullText.length));

  return blocks.map((block, i) => {
    // Le type d'avis/de procédure se détermine dans la zone d'en-tête (nom
    // du type d'avis + référence), jamais dans le corps entier : un avis
    // d'appel d'offres classique mentionne presque toujours, bien plus loin
    // dans le texte, la « commission d'attribution des marchés » (organe
    // d'évaluation, boilerplate quasi systématique) — la chercher sur tout
    // le bloc reclasserait à tort ces avis en résultat d'attribution
    // (confirmé sur le quotidien n°4486).
    const headerWindow = block.slice(0, 220);
    const procedureEntry = PROCEDURE_KEYWORDS.find(([re]) => re.test(headerWindow));
    const publicationEntry = PUBLICATION_KEYWORDS.find(([re]) => re.test(headerWindow));
    const reference = block.match(REFERENCE_PATTERN)?.[1] ?? null;
    const amountMatch = block.match(AMOUNT_PAREN_PATTERN) ?? block.match(AMOUNT_DIRECT_PATTERN);
    const deadlineMatch = block.match(DEADLINE_PATTERN);
    const authorityMatch = block.match(AUTHORITY_PATTERN);
    const region = REGION_KEYWORDS.find((r) => block.includes(r)) ?? null;
    const precedingText = i === 0 ? fullText.slice(0, indices[0]) : blocks[i - 1];
    const preamble = extractPreambleTitleAuthority(precedingText);

    const withdrawalDeadline = parseDateMatch(block.match(WITHDRAWAL_PATTERN));
    const openingAt = parseDateMatch(block.match(OPENING_PATTERN));
    const validityMatch = block.match(VALIDITY_PATTERN);
    const executionMatch = block.match(EXECUTION_PATTERN);
    const requirements = extractRequirements(block);
    const requiredDocuments = extractRequiredDocuments(block);
    const lots = extractLots(block);

    let fieldsFound = 0;
    const totalFields = 8;
    if (reference) fieldsFound++;
    if (amountMatch) fieldsFound++;
    if (deadlineMatch) fieldsFound++;
    if (preamble.authority || authorityMatch) fieldsFound++;
    if (procedureEntry) fieldsFound++;
    if (requirements.length > 0) fieldsFound++;
    if (requiredDocuments.length > 0) fieldsFound++;
    if (withdrawalDeadline || openingAt) fieldsFound++;

    return {
      rawBlock: block.slice(0, 2000),
      publicationTypeGuess: publicationEntry?.[1] ?? "AVIS_APPEL_OFFRES",
      procedureTypeGuess: procedureEntry?.[1] ?? null,
      reference,
      title: cleanTitle(preamble.title ?? guessTitle(block)),
      authorityGuess: preamble.authority ? cleanAuthority(preamble.authority) : authorityMatch?.[1] ? cleanAuthority(authorityMatch[1]) : null,
      amountExclTax: amountMatch ? parseAmount(amountMatch[1]) : null,
      submissionDeadline: parseDateMatch(deadlineMatch),
      withdrawalDeadline,
      openingAt,
      bidValidityDays: validityMatch ? Number(validityMatch[1]) : null,
      executionDelayDays: executionMatch ? Number(executionMatch[1]) : null,
      regionGuess: region,
      requirements,
      requiredDocuments,
      lots,
      confidence: Math.round((fieldsFound / totalFields) * 100) / 100,
    };
  });
}
