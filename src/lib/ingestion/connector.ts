// Interface de connecteur — section 40 (Crawler / connecteurs) et section 3
// (« La source DGCMEF doit être surveillée automatiquement »).
//
// Un connecteur découvre des publications (quotidiens, avis, PPM…) sur une
// source officielle et fournit les fichiers bruts associés. L'implémentation
// DGCMEF (connectors/dgcmef.ts) est prête pour un déploiement avec accès
// réseau ; ce fichier ne dépend d'aucune implémentation concrète afin de
// pouvoir ajouter d'autres sources/pays sans toucher au pipeline (section 98).

export type DiscoveredDocument = {
  filename: string;
  url: string;
  isPrincipal: boolean;
  isBis: boolean;
};

export type DiscoveredPublication = {
  numero: string;
  isDoubleIssue: boolean;
  publishedAt: Date;
  title?: string;
  documents: DiscoveredDocument[];
};

export interface SourceConnector {
  sourceName: string;
  baseUrl: string;
  /** Liste les publications disponibles sur la source (la plus récente d'abord). */
  discover(): Promise<DiscoveredPublication[]>;
  /** Télécharge le contenu binaire d'un document découvert. */
  download(doc: DiscoveredDocument): Promise<Buffer>;
}
