# FASO Market Intelligence

Plateforme SaaS de veille, analyse et intelligence commerciale de la commande publique au Burkina Faso — construite à partir du cahier des charges fonctionnel, data & technique (v1.0, 31 août 2026).

> Plateforme indépendante, non affiliée à la DGCMEF ni à l'ARCOP. Les publications officielles demeurent la référence en cas de divergence (section 63, 99).

## Stack technique

- **Next.js 16** (App Router, Server Components/Actions, Turbopack), React 19, TypeScript strict
- **PostgreSQL + Prisma ORM** — schéma couvrant l'intégralité du modèle de données universel (section 42) et prêt multi-pays (section 98)
- **NextAuth v5** (credentials + JWT), RBAC 5 rôles, isolation multi-tenant stricte
- **Tailwind CSS v4** — design system sobre « data first, decoration last » (sections 55-58)
- **Recharts** + composants graphiques maison (heatmap, treemap, graphe de relations)
- **Anthropic Claude** (optionnel) pour l'assistant IA — architecture RAG anti-hallucination, dégradation propre sans clé API
- **Vitest** pour les tests unitaires et d'intégration (base réelle, pas de mocks Prisma)
- **cheerio + pdf-parse** pour le pipeline d'ingestion DGCMEF

## Démarrage

```bash
npm install
cp .env.example .env            # ajuster DATABASE_URL si besoin
npx prisma migrate dev          # crée le schéma
npx prisma db seed              # jeu de données de démonstration réaliste
npm run dev
```

Comptes de démonstration (créés par le seed) :

| Rôle | Email | Mot de passe |
|---|---|---|
| Entreprise abonnée (Owner) | `demo@fasopmi.bf` | `Demo1234!` |
| Entreprise abonnée (Analyste) | `analyste@fasopmi.bf` | `Demo1234!` |
| Administrateur plateforme | `admin@fasopmi.bf` | `Admin1234!` |

```bash
npm run build   # build de production
npm run test    # suite de tests (32 tests, DB réelle requise)
npm run ingest  # lance le pipeline d'ingestion DGCMEF en CLI
```

## Ce qui est livré

Construit dans l'ordre de priorité imposé par le cahier des charges (section 102) :

1. **Modèle de données universel** (`prisma/schema.prisma`) — Publication → Document → Page, Marché → Lot → Événement/Version/Rectification/Annulation/Reprise, Exigences/Documents requis/Réservations, Entreprises + résolution d'entité (alias, fusions traçables), Offres/Évaluation/Résultats, Recours/Réexamen, Financement/Projets, PPM/Avis généraux, Tenants/Users/RBAC, Watchlists/Alertes/Notifications, Scores/Matching/Recommandations, Abonnements/Paiements, Dossiers de soumission, IA (conversations/messages/sources), Qualité des données/Audit.
2. **Pipeline d'ingestion DGCMEF** (`src/lib/ingestion/`) — connecteur HTML (gère numéros simples, doubles comme `4473-4474`, et fichiers `bis` comme `4468`/`4468 bis`, conformément à l'Annexe D), extraction PDF avec repli OCR pluggable, segmentation/classification/extraction structurée par heuristiques regex, déduplication (Jaccard + clés de rapprochement), orchestration avec `ExtractionJob` et reprise sur échec (section 94). **Testé par fixtures locales** (HTML + texte administratif synthétique) — voir « Limites connues » ci-dessous.
3. **Recherche + fiche marché** — recherche en langage naturel → filtres (`/recherche`), fiche marché complète (score, exigences, documents requis, lots, calendrier, analyse prix/concurrence, risques, chronologie des événements et rectifications, source officielle).
4. **Profil entreprise + matching** — onboarding guidé (12 étapes), moteur de matching à 4 verdicts (compatible / probablement compatible / à vérifier / incompatible).
5. **Scores versionnés et explicables** (`src/lib/scoring/engine.ts`) — pertinence/éligibilité/attractivité/global, pondérations administrables (`/admin/scoring`), facteurs affichés (« Pourquoi ce score ? »).
6. **Dashboard analytique** + module Analyses paramétré (12 dimensions : volumes, montants, secteurs, géographie, organismes, entreprises, concurrence, prix, réussite, causes d'échec, financements, tendances).
7. **Alertes & veille** — centre d'alertes, watchlists, favoris, briefings quotidien/hebdomadaire générés depuis les données réelles.
8. **Assistant IA** (`/ia`) — récupération de contexte depuis la base avant toute synthèse, citation systématique des sources, réponse structurée (données utilisées / raisonnement / confiance / avertissements), et repli déterministe (« Information non trouvée dans les sources disponibles ») quand aucune clé `ANTHROPIC_API_KEY` n'est configurée ou que la donnée est absente — jamais d'invention.
9. **Administration SaaS complète** — utilisateurs, tenants, abonnements/paiements, sources, importations, jobs d'extraction, file de validation humaine, taxonomies, scoring, qualité des données, audit logs.
10. **API REST interne** (`/api/v1/*`) — endpoints de la section 47, authentifiés par session.
11. **Tests** — 32 tests (unitaires : parser d'extraction, connecteur DGCMEF, déduplication, formatage ; intégration : moteur de scoring sur base réelle, anti-hallucination de l'assistant, invariants de qualité de données).

Environ 45 écrans applicatifs distincts sont servis par ces modules ; les nombreuses variantes de liste du cahier des charges (« Marchés par catégorie / procédure / région / organisme / montant / statut », les 12 sous-écrans « Analyses », les 6 vues « Opportunités »…) sont implémentées comme un **framework générique paramétré par filtres et route dynamique** plutôt que comme des pages dupliquées — chaque lien de la navigation pointe vers une combinaison de filtres réellement différente et répond donc à une question métier distincte (Annexe C), avec de vraies requêtes en base à chaque fois.

## Limites connues et prochaines étapes

- **Réseau sortant vers dgcmef.gov.bf** : cet environnement de développement n'a pas d'accès réseau sortant vers le site réel (bloqué par le proxy sortant du bac à sable — confirmé par un test direct). Le connecteur DGCMEF est du code de production réel (fetch + parsing HTML), validé par des tests avec fixtures locales reproduisant la structure documentée en Annexe D, mais n'a pas pu être exécuté contre le site réel. **À faire au premier déploiement avec accès réseau** : vérifier les sélecteurs CSS de `src/lib/ingestion/connectors/dgcmef.ts` contre la page réelle et ajuster si besoin.
- **OCR** : l'interface de repli OCR (`src/lib/ingestion/extract-text.ts`) est prête mais aucun moteur OCR n'est installé dans cet environnement (poids/complexité). Brancher Tesseract ou un service cloud ne change aucun appelant.
- **Paiements** : architecture abstraite (`src/lib/payments/provider.ts`) avec un fournisseur simulé. Aucun compte marchand Mobile Money/carte n'est configuré — brancher Orange Money/Moov Money/un PSP carte ne change aucun appelant.
- **Email** : aucun fournisseur SMTP n'est configuré ; les emails de vérification/réinitialisation sont journalisés et le lien est affiché à l'écran en mode démonstration.
- **i18n** : scaffold posé (`src/lib/i18n/`, dictionnaires fr/en) mais l'interface reste rédigée en dur en français. Le branchement complet (routing par locale, extraction de toutes les chaînes) est un chantier de suite.
- **WhatsApp/Push** : les canaux sont modélisés (`NotificationChannel`) et affichés dans les préférences, mais seul le canal in-app est réellement câblé dans cette itération ; WhatsApp/push sont des intégrations Phase 4 (section 66).
- **Multi-pays** : le modèle de données est déjà générique (`Country`, `regulationFramework`) ; seul le Burkina Faso est peuplé.

Ces limites sont documentées ici plutôt que masquées : le code correspondant est écrit pour fonctionner en production (pas des stubs vides), mais n'a pas pu être validé de bout en bout contre des services externes indisponibles dans ce bac à sable.

## Structure du projet

```
prisma/schema.prisma       modèle de données complet
prisma/seed.ts              jeu de données de démonstration (Annexe D)
src/lib/ingestion/          pipeline DGCMEF (connecteur, extraction, parsing, dédup, orchestration)
src/lib/scoring/            moteur de score/matching versionné
src/lib/ai/                 assistant IA (retrieval + génération contrainte)
src/lib/search/             recherche en langage naturel → filtres
src/lib/queries/            requêtes Prisma partagées par les écrans
src/app/(app)/              application authentifiée (tenant-scoped)
src/app/admin/              administration plateforme (isPlatformAdmin)
src/app/api/v1/             API REST interne
tests/unit, tests/integration  suite de tests
```
