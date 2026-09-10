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

const NOTICE_BOUNDARY = /(AVIS\s+D[’']APPEL\s+D[’']OFFRES|DEMANDE\s+DE\s+PRIX|DEMANDE\s+DE\s+COTATION|MANIFESTATION\s+D[’']INT[ÉE]R[ÊE]T|DEMANDE\s+DE\s+PROPOSITIONS|R[ÉE]SULTAT\s+PROVISOIRE|AVIS\s+D[’']ATTRIBUTION|RECTIFICATIF|AVIS\s+D[’']ANNULATION)/gi;

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
  [/r[ée]sultat\s+provisoire/i, "RESULTAT_PROVISOIRE"],
  [/attribution/i, "ATTRIBUTION"],
  [/rectificatif/i, "RECTIFICATIF"],
  [/annulation/i, "ANNULATION"],
  [/reprise/i, "REPRISE"],
  [/r[ée]examen/i, "REEXAMEN"],
  [/appel\s+d[’']offres/i, "AVIS_APPEL_OFFRES"],
  [/demande\s+de\s+prix/i, "DEMANDE_PRIX"],
  [/demande\s+de\s+cotation/i, "DEMANDE_COTATION"],
  [/manifestation\s+d[’']int[ée]r[êe]t/i, "MANIFESTATION_INTERET"],
  [/demande\s+de\s+propositions/i, "DEMANDE_PROPOSITIONS"],
];

const REFERENCE_PATTERN = /n[°o]\s*([A-Z0-9][A-Z0-9./-]{3,30})/i;
const AMOUNT_PATTERN = /(?:montant|estimation|budget)[^\d]{0,20}([\d\s.,]{5,20})\s*(?:f\s*cfa|fcfa|xof)/i;
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

function guessTitle(block: string): string | null {
  // Le titre suit généralement le motif d'objet : "objet : ..." ou la
  // première ligne significative après l'en-tête du type d'avis.
  const objetMatch = block.match(/objet\s*:?\s*([^\n]{10,200})/i);
  if (objetMatch) return objetMatch[1].trim();
  const firstLine = block.split("\n").map((l) => l.trim()).find((l) => l.length > 15 && !NOTICE_BOUNDARY.test(l));
  return firstLine ?? null;
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
  { type: "CONDITIONS_RESERVATION", pattern: /r[ée]serv[ée]\s+(?:aux?\s+)?(?:pme|femmes|jeunes|entreprises?\s+communautaires?|entreprises?\s+burkinab[ée])[^\n.]{0,100}/i },
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
  const lots: LotCandidate[] = [];
  const seen = new Set<string>();
  // Une ligne à la fois : évite qu'un montant appartenant au lot suivant
  // ne "fuite" dans le lot courant (la capture d'objet est gourmande par
  // construction, donc on la contient strictement à la ligne du match).
  for (const m of block.matchAll(LOT_LINE_PATTERN)) {
    const numero = m[1];
    if (seen.has(numero)) continue;
    seen.add(numero);
    const line = m[2].trim();
    const amountMatch = line.match(LOT_AMOUNT_PATTERN);
    const objet = amountMatch ? line.slice(0, amountMatch.index).replace(/[—\-–:]\s*$/, "").trim() : line;
    lots.push({ numero, objet: objet.slice(0, 150), montant: amountMatch ? parseAmount(amountMatch[1]) : null });
  }
  return lots;
}

export function segmentAndClassify(fullText: string): ExtractedNoticeCandidate[] {
  const indices: number[] = [];
  const matches = [...fullText.matchAll(NOTICE_BOUNDARY)];
  for (const m of matches) if (m.index !== undefined) indices.push(m.index);
  if (indices.length === 0) return [];

  const blocks = indices.map((start, i) => fullText.slice(start, indices[i + 1] ?? fullText.length));

  return blocks.map((block) => {
    const procedureEntry = PROCEDURE_KEYWORDS.find(([re]) => re.test(block));
    const publicationEntry = PUBLICATION_KEYWORDS.find(([re]) => re.test(block));
    const reference = block.match(REFERENCE_PATTERN)?.[1] ?? null;
    const amountMatch = block.match(AMOUNT_PATTERN);
    const deadlineMatch = block.match(DEADLINE_PATTERN);
    const authorityMatch = block.match(AUTHORITY_PATTERN);
    const region = REGION_KEYWORDS.find((r) => block.includes(r)) ?? null;

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
    if (authorityMatch) fieldsFound++;
    if (procedureEntry) fieldsFound++;
    if (requirements.length > 0) fieldsFound++;
    if (requiredDocuments.length > 0) fieldsFound++;
    if (withdrawalDeadline || openingAt) fieldsFound++;

    return {
      rawBlock: block.slice(0, 2000),
      publicationTypeGuess: publicationEntry?.[1] ?? "AVIS_APPEL_OFFRES",
      procedureTypeGuess: procedureEntry?.[1] ?? null,
      reference,
      title: guessTitle(block),
      authorityGuess: authorityMatch?.[1] ? cleanAuthority(authorityMatch[1]) : null,
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
