// Segmentation + classification + extraction structurée (section 2.2, pipeline).
// Approche heuristique (regex + dictionnaires) sur le texte administratif
// français : déterministe, traçable, et sert de première passe avant
// validation humaine (section 45) — jamais présentée comme une vérité
// absolue (chaque champ porte une confiance, section 44).

export type ExtractedNoticeCandidate = {
  rawBlock: string;
  publicationTypeGuess: string;
  procedureTypeGuess: string | null;
  reference: string | null;
  title: string | null;
  authorityGuess: string | null;
  amountExclTax: number | null;
  submissionDeadline: Date | null;
  regionGuess: string | null;
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
const DEADLINE_PATTERN = /(?:date\s+limite|au\s+plus\s+tard\s+le|d[ée]p[ôo]t\s+des\s+offres)[^\d]{0,20}(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})/i;
const AUTHORITY_STOPWORD = /\s+(?:lance|sollicite|invite|recherche|informe|porte|organise|procède)/i;
const AUTHORITY_PATTERN = /(minist[èe]re[^,.\n]{3,80}|commune\s+de\s+[a-zàâäéèêëîïôöùûüç\-\s]{2,40}|office\s+national[^,.\n]{3,80}|soci[ée]t[ée]\s+nationale[^,.\n]{3,80})/i;

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

function guessTitle(block: string): string | null {
  // Le titre suit généralement le motif d'objet : "objet : ..." ou la
  // première ligne significative après l'en-tête du type d'avis.
  const objetMatch = block.match(/objet\s*:?\s*([^\n]{10,200})/i);
  if (objetMatch) return objetMatch[1].trim();
  const firstLine = block.split("\n").map((l) => l.trim()).find((l) => l.length > 15 && !NOTICE_BOUNDARY.test(l));
  return firstLine ?? null;
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

    let fieldsFound = 0;
    const totalFields = 5;
    if (reference) fieldsFound++;
    if (amountMatch) fieldsFound++;
    if (deadlineMatch) fieldsFound++;
    if (authorityMatch) fieldsFound++;
    if (procedureEntry) fieldsFound++;

    return {
      rawBlock: block.slice(0, 2000),
      publicationTypeGuess: publicationEntry?.[1] ?? "AVIS_APPEL_OFFRES",
      procedureTypeGuess: procedureEntry?.[1] ?? null,
      reference,
      title: guessTitle(block),
      authorityGuess: authorityMatch?.[1] ? cleanAuthority(authorityMatch[1]) : null,
      amountExclTax: amountMatch ? parseAmount(amountMatch[1]) : null,
      submissionDeadline: deadlineMatch ? new Date(Number(deadlineMatch[3]), Number(deadlineMatch[2]) - 1, Number(deadlineMatch[1])) : null,
      regionGuess: region,
      confidence: Math.round((fieldsFound / totalFields) * 100) / 100,
    };
  });
}
