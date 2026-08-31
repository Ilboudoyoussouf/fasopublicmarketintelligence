// Arborescence de navigation — Annexe A du cahier des charges.
export type NavItem = { label: string; href: string };
export type NavGroup = { label: string; icon: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  {
    label: "Dashboard",
    icon: "LayoutDashboard",
    items: [
      { label: "Vue générale", href: "/dashboard" },
      { label: "Dashboard commercial", href: "/dashboard/commercial" },
      { label: "Dashboard analytique", href: "/dashboard/analytique" },
      { label: "Centre d'alertes", href: "/veille/alertes" },
    ],
  },
  {
    label: "Opportunités",
    icon: "Target",
    items: [
      { label: "Recommandées", href: "/opportunites?vue=recommandees" },
      { label: "Nouvelles", href: "/opportunites?vue=nouvelles" },
      { label: "Urgentes (< 7 jours)", href: "/opportunites?vue=urgentes" },
      { label: "Réservées", href: "/opportunites?vue=reservees" },
      { label: "Suivies", href: "/opportunites?vue=suivies" },
      { label: "Expirées", href: "/opportunites?vue=expirees" },
      { label: "Comparateur", href: "/opportunites/comparateur" },
    ],
  },
  {
    label: "Marchés",
    icon: "Gavel",
    items: [
      { label: "Tous les marchés", href: "/marches" },
      { label: "Fournitures & services", href: "/marches?groupe=FOURNITURES_SERVICES" },
      { label: "Travaux", href: "/marches?groupe=TRAVAUX" },
      { label: "Prestations intellectuelles", href: "/marches?groupe=PRESTATIONS_INTELLECTUELLES" },
      { label: "Par région", href: "/marches?vue=region" },
      { label: "Par organisme", href: "/marches?vue=organisme" },
      { label: "Par montant", href: "/marches?tri=montant_desc" },
      { label: "Par statut", href: "/marches?vue=statut" },
    ],
  },
  {
    label: "Résultats",
    icon: "ClipboardCheck",
    items: [
      { label: "Tous les résultats", href: "/resultats" },
      { label: "Résultats récents", href: "/resultats?vue=recents" },
      { label: "Résultats rectifiés", href: "/resultats?vue=rectifies" },
      { label: "Réexamens", href: "/resultats?vue=reexamens" },
      { label: "Recours", href: "/resultats?vue=recours" },
    ],
  },
  {
    label: "Organismes",
    icon: "Landmark",
    items: [
      { label: "Tous les organismes", href: "/organismes" },
      { label: "Ministères", href: "/organismes?type=MINISTERE" },
      { label: "Institutions", href: "/organismes?type=INSTITUTION" },
      { label: "EPE", href: "/organismes?type=EPE" },
      { label: "Communes", href: "/organismes?type=COMMUNE" },
    ],
  },
  {
    label: "Entreprises",
    icon: "Building2",
    items: [
      { label: "Toutes les entreprises", href: "/entreprises" },
      { label: "Attributaires", href: "/entreprises?vue=attributaires" },
      { label: "Concurrents fréquents", href: "/entreprises?vue=concurrents" },
      { label: "Entreprises émergentes", href: "/entreprises?vue=emergentes" },
    ],
  },
  {
    label: "Analyses",
    icon: "BarChart3",
    items: [
      { label: "Vue générale", href: "/analyses" },
      { label: "Volumes", href: "/analyses/volumes" },
      { label: "Montants", href: "/analyses/montants" },
      { label: "Secteurs", href: "/analyses/secteurs" },
      { label: "Géographie", href: "/analyses/geographie" },
      { label: "Organismes", href: "/analyses/organismes" },
      { label: "Entreprises", href: "/analyses/entreprises" },
      { label: "Concurrence", href: "/analyses/concurrence" },
      { label: "Prix", href: "/analyses/prix" },
      { label: "Taux de réussite", href: "/analyses/reussite" },
      { label: "Causes d'échec", href: "/analyses/causes-echec" },
      { label: "Financements", href: "/analyses/financements" },
      { label: "Temporelle", href: "/analyses/temporelle" },
      { label: "Tendances & prévisions", href: "/analyses/tendances" },
    ],
  },
  {
    label: "PPM",
    icon: "CalendarClock",
    items: [
      { label: "Plans de passation", href: "/ppm" },
      { label: "Avis généraux", href: "/ppm/avis-generaux" },
      { label: "Radar des marchés à venir", href: "/ppm/radar" },
    ],
  },
  {
    label: "Veille",
    icon: "BellRing",
    items: [
      { label: "Mes alertes", href: "/veille/alertes" },
      { label: "Mes watchlists", href: "/veille/watchlists" },
      { label: "Mes favoris", href: "/veille/favoris" },
      { label: "Briefing quotidien", href: "/veille/briefing-quotidien" },
      { label: "Briefing hebdomadaire", href: "/veille/briefing-hebdomadaire" },
    ],
  },
  {
    label: "Dossiers",
    icon: "FolderKanban",
    items: [{ label: "Mes dossiers de soumission", href: "/dossiers" }],
  },
  {
    label: "Assistant IA",
    icon: "Sparkles",
    items: [{ label: "Assistant", href: "/ia" }],
  },
  {
    label: "Documents",
    icon: "Library",
    items: [
      { label: "Bibliothèque des quotidiens", href: "/documents" },
      { label: "Recherche documentaire", href: "/documents?onglet=recherche" },
      { label: "Documents réglementaires", href: "/documents?type=DOCUMENT_REGLEMENTAIRE" },
    ],
  },
  {
    label: "Mon entreprise",
    icon: "IdCard",
    items: [
      { label: "Profil de l'entreprise", href: "/compte/entreprise" },
      { label: "Centre de préparation", href: "/dossiers" },
      { label: "Documents de l'entreprise", href: "/compte/entreprise/documents" },
    ],
  },
];

export const ACCOUNT_NAV: NavItem[] = [
  { label: "Profil utilisateur", href: "/compte/profil" },
  { label: "Profil entreprise", href: "/compte/entreprise" },
  { label: "Équipe", href: "/compte/equipe" },
  { label: "Rôles et permissions", href: "/compte/roles" },
  { label: "Abonnement", href: "/compte/abonnement" },
  { label: "Facturation", href: "/compte/facturation" },
  { label: "Notifications", href: "/compte/notifications" },
  { label: "Sécurité", href: "/compte/securite" },
  { label: "Journal des connexions", href: "/compte/journal-connexions" },
];

export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard admin", href: "/admin" },
  { label: "Utilisateurs", href: "/admin/utilisateurs" },
  { label: "Entreprises (tenants)", href: "/admin/entreprises" },
  { label: "Abonnements & paiements", href: "/admin/abonnements" },
  { label: "Sources", href: "/admin/sources" },
  { label: "Importations", href: "/admin/importations" },
  { label: "Jobs d'extraction", href: "/admin/jobs" },
  { label: "Validation humaine", href: "/admin/validation" },
  { label: "Taxonomies", href: "/admin/taxonomies" },
  { label: "Scoring", href: "/admin/scoring" },
  { label: "Qualité des données", href: "/admin/qualite" },
  { label: "Audit logs", href: "/admin/audit" },
];
