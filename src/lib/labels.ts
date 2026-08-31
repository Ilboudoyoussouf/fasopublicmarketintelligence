// Libellés français des enums métier — utilisés dans toute l'application.
export const MARKET_STATUS_LABEL: Record<string, string> = {
  PLANIFIE: "Planifié",
  PUBLIE: "Publié",
  RECTIFIE: "Rectifié",
  ANNULE: "Annulé",
  REPRIS: "Repris",
  SOUMISSIONS_CLOSES: "Soumissions closes",
  EN_EVALUATION: "En évaluation",
  RESULTAT_PUBLIE: "Résultat publié",
  RESULTAT_RECTIFIE: "Résultat rectifié",
  EN_RECOURS: "En recours",
  EN_REEXAMEN: "En réexamen",
  ATTRIBUE: "Attribué",
  CLOTURE: "Clôturé",
};

export const MARKET_STATUS_TONE: Record<string, "neutral" | "info" | "success" | "warning" | "critical" | "brand"> = {
  PLANIFIE: "neutral",
  PUBLIE: "info",
  RECTIFIE: "warning",
  ANNULE: "critical",
  REPRIS: "warning",
  SOUMISSIONS_CLOSES: "neutral",
  EN_EVALUATION: "neutral",
  RESULTAT_PUBLIE: "success",
  RESULTAT_RECTIFIE: "warning",
  EN_RECOURS: "critical",
  EN_REEXAMEN: "warning",
  ATTRIBUE: "success",
  CLOTURE: "neutral",
};

export const PROCEDURE_TYPE_LABEL: Record<string, string> = {
  APPEL_OFFRES_OUVERT: "Appel d'offres ouvert",
  APPEL_OFFRES_OUVERT_ACCELERE: "Appel d'offres ouvert accéléré",
  DEMANDE_PRIX: "Demande de prix",
  DEMANDE_COTATION: "Demande de cotation",
  MANIFESTATION_INTERET: "Manifestation d'intérêt",
  DEMANDE_PROPOSITIONS: "Demande de propositions",
  DEMANDE_PROPOSITIONS_ALLEGEE: "Demande de propositions allégée",
  AUTRE: "Autre procédure",
};

export const PUBLICATION_TYPE_LABEL: Record<string, string> = {
  AVIS_APPEL_OFFRES: "Avis d'appel d'offres",
  DEMANDE_PRIX: "Demande de prix",
  DEMANDE_COTATION: "Demande de cotation",
  APPEL_OFFRES_OUVERT: "Appel d'offres ouvert",
  APPEL_OFFRES_ACCELERE: "Appel d'offres accéléré",
  MANIFESTATION_INTERET: "Manifestation d'intérêt",
  DEMANDE_PROPOSITIONS: "Demande de propositions",
  RESULTAT_PROVISOIRE: "Résultat provisoire",
  ATTRIBUTION: "Attribution",
  RECTIFICATIF: "Rectificatif",
  ANNULATION: "Annulation",
  REPRISE: "Reprise",
  REEXAMEN: "Réexamen",
  DECISION_RECOURS: "Décision de recours",
  AVIS_GENERAL_PASSATION: "Avis général de passation",
  PLAN_PASSATION: "Plan de passation",
};

export const REJECTION_REASON_LABEL: Record<string, string> = {
  PIECE_ADMINISTRATIVE_ABSENTE: "Pièce administrative absente",
  AGREMENT_ABSENT: "Agrément absent",
  AGREMENT_NON_CONFORME: "Agrément non conforme",
  CARACTERISTIQUE_TECHNIQUE_NON_CONFORME: "Caractéristique technique non conforme",
  EXPERIENCE_INSUFFISANTE: "Expérience insuffisante",
  GARANTIE_INCORRECTE: "Garantie incorrecte",
  DELAI_NON_CONFORME: "Délai non conforme",
  ERREUR_CALCUL: "Erreur de calcul",
  ERREUR_QUANTITE: "Erreur de quantité",
  OFFRE_ANORMALEMENT_BASSE: "Offre anormalement basse",
  OFFRE_ANORMALEMENT_ELEVEE: "Offre anormalement élevée",
  DOCUMENT_NON_FOURNI: "Document non fourni",
  PERSONNEL_NON_CONFORME: "Personnel non conforme",
  REFERENCE_INSUFFISANTE: "Référence insuffisante",
  AUTRE: "Autre motif",
};

export const RESERVATION_CATEGORY_LABEL: Record<string, string> = {
  PME: "PME",
  ENTREPRISES_BURKINABE: "Entreprises burkinabè",
  ENTREPRISES_COMMUNAUTAIRES: "Entreprises communautaires",
  FEMMES: "Entreprises dirigées par des femmes",
  JEUNES: "Entreprises dirigées par des jeunes",
  CRITERES_SPECIFIQUES: "Critères spécifiques",
  CONSULTANTS_BURKINABE_COMMUNAUTAIRES: "Consultants burkinabè / communautaires",
  AUTRE: "Autre catégorie",
};

export const ORG_TYPE_LABEL: Record<string, string> = {
  MINISTERE: "Ministère",
  INSTITUTION: "Institution",
  EPE: "Établissement public de l'État",
  REGION: "Région",
  PROVINCE: "Province",
  COMMUNE: "Commune",
  PROJET: "Projet",
  AUTRE: "Autre organisme",
};

export const REQUIRED_DOC_LABEL: Record<string, string> = {
  RCCM: "RCCM",
  IFU: "IFU",
  ATTESTATION_FISCALE: "Attestation fiscale",
  ATTESTATION_SOCIALE: "Attestation sociale",
  GARANTIE: "Garantie",
  AGREMENT: "Agrément",
  CERTIFICAT: "Certificat",
  REFERENCE: "Référence",
  ATTESTATION_BONNE_EXECUTION: "Attestation de bonne exécution",
  CV: "CV",
  DIPLOME: "Diplôme",
  CERTIFICAT_TECHNIQUE: "Certificat technique",
  PIECE_FINANCIERE: "Pièce financière",
  PIECE_ADMINISTRATIVE: "Pièce administrative",
  AUTRE: "Autre document",
};

export const REQUIREMENT_TYPE_LABEL: Record<string, string> = {
  CHIFFRE_AFFAIRES: "Chiffre d'affaires",
  EXPERIENCE_GENERALE: "Expérience générale",
  EXPERIENCE_SPECIFIQUE: "Expérience spécifique",
  REFERENCES: "Références",
  AGREMENT: "Agrément",
  CAPACITE_FINANCIERE: "Capacité financière",
  CAPACITE_TECHNIQUE: "Capacité technique",
  PERSONNEL: "Personnel",
  DIPLOMES: "Diplômes",
  CERTIFICATIONS: "Certifications",
  EQUIPEMENTS: "Équipements",
  MOYENS_MATERIELS: "Moyens matériels",
  DELAI: "Délai",
  GARANTIES: "Garanties",
  PIECES_ADMINISTRATIVES: "Pièces administratives",
  DOCUMENTS_TECHNIQUES: "Documents techniques",
  CONDITIONS_GEOGRAPHIQUES: "Conditions géographiques",
  CONDITIONS_RESERVATION: "Conditions de réservation",
  AUTRE: "Autre exigence",
};

export const FINANCING_SOURCE_LABEL: Record<string, string> = {
  EXTERIEUR: "Financement extérieur",
  NATIONAL: "Financement national",
  COMMUNAL: "Financement communal",
  AUTRE: "Autre financement",
};

export const SECTOR_GROUP_LABEL: Record<string, string> = {
  FOURNITURES_SERVICES: "Fournitures et services courants",
  TRAVAUX: "Travaux",
  PRESTATIONS_INTELLECTUELLES: "Prestations intellectuelles",
};

export const MATCH_VERDICT_LABEL: Record<string, string> = {
  COMPATIBLE: "Compatible",
  PROBABLEMENT_COMPATIBLE: "Probablement compatible",
  A_VERIFIER: "À vérifier",
  INCOMPATIBLE: "Incompatible",
};

export const MATCH_VERDICT_TONE: Record<string, "success" | "info" | "warning" | "critical"> = {
  COMPATIBLE: "success",
  PROBABLEMENT_COMPATIBLE: "info",
  A_VERIFIER: "warning",
  INCOMPATIBLE: "critical",
};

export const DOC_LIFECYCLE_LABEL: Record<string, string> = {
  VALID: "Valide",
  EXPIRING_SOON: "Expire bientôt",
  EXPIRED: "Expiré",
  MISSING: "Manquant",
  UNVERIFIED: "Non vérifié",
};

export const DOC_LIFECYCLE_TONE: Record<string, "success" | "warning" | "critical" | "neutral"> = {
  VALID: "success",
  EXPIRING_SOON: "warning",
  EXPIRED: "critical",
  MISSING: "critical",
  UNVERIFIED: "neutral",
};
