# FASO Market Intelligence

Plateforme SaaS de veille, conformité et intelligence de la commande publique au Burkina Faso — construite à partir de deux cahiers des charges successifs (v1 du 31 août 2026, v2 « conformité et intelligence » avec analyse structurelle des quotidiens de septembre 2026) et d'une maquette de référence pour la direction artistique.

> Plateforme indépendante, non affiliée à la DGCMEF ni à l'ARCOP. **Seule la version des quotidiens publiée sur dgcmef.gov.bf est officielle et authentique** ; toute copie ici n'a aucune valeur légale (section 1.1 de l'analyse structurelle, bandeau reproduit sur chaque fiche marché).

## Stack technique

- **Next.js 16** (App Router, Server Components/Actions, Turbopack), React 19, TypeScript strict
- **MySQL + Prisma ORM** — modèle de données universel, prêt multi-pays (section 98). Champs tableaux (`keywords`, `telephones`, `rejectionMotifCodes`, `exercices`, `targetCategories`) stockés en `Json` (MySQL n'a pas de type tableau natif) ; champs de texte long explicitement `@db.Text`.
- **NextAuth v5** (credentials + JWT), RBAC 5 rôles, isolation multi-tenant stricte
- **Tailwind CSS v4** — design system §12 du cahier des charges v2 : neutres à 90%, accent vert profond unique, échelle d'urgence temporelle dédiée (J-1/J-3/J-7/J-15), typographie Inter + JetBrains Mono (chiffres tabulaires)
- **Recharts** + composants graphiques maison (heatmap, treemap, graphe de relations)
- **Anthropic Claude** (optionnel) pour l'assistant IA — architecture RAG anti-hallucination, dégradation propre sans clé API
- **Vitest** pour les tests unitaires et d'intégration (base réelle, pas de mocks Prisma)
- **cheerio + pdf-parse** pour le pipeline d'ingestion DGCMEF, robot quotidien via cron Vercel

## Démarrage

```bash
npm install
cp .env.example .env            # ajuster DATABASE_URL (MySQL/MariaDB) si besoin
npx prisma migrate dev          # crée le schéma
npx prisma db seed              # jeu de données de démonstration réaliste (idempotent)
npm run dev
```

Comptes de démonstration (créés par le seed) :

| Rôle | Email | Mot de passe |
|---|---|---|
| Entreprise abonnée (Owner) | `demo@fasopmi.bf` | `Demo1234!` |
| Entreprise abonnée (Analyste) | `analyste@fasopmi.bf` | `Demo1234!` |
| Administrateur plateforme | `admin@fasopmi.bf` | `Admin1234!` |

```bash
npm run build   # build de production (exécute `prisma generate` en amont)
npm run test    # suite de tests (36 tests, DB réelle requise)
npm run ingest  # lance le pipeline d'ingestion DGCMEF en CLI
```

## Déploiement (Hostinger — hébergement Node.js + MySQL colocalisés)

Le plan retenu héberge l'application **et** la base MySQL sur le même compte Hostinger (plan Business), afin que Next.js parle à MySQL en `localhost` sans jamais exposer la base à Internet.

**Déjà fait via l'API Hostinger (MCP) :**
- Base MySQL créée (`u720554844_fasopmi`, utilisateur dédié `u720554844_fasopmi_app`), 3 Go alloués, accès `localhost` uniquement.
- Variables d'environnement Node.js du site configurées (`DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, `CRON_SECRET`, `DGCMEF_BASE_URL`).
- Paramètres de build Node.js enregistrés (Node 22, type `next`, script `hostinger-build`, sortie `.next`).
- Cron quotidien Hostinger créé (06h00 UTC) : `curl -H "Authorization: Bearer $CRON_SECRET" https://<domaine>/api/cron/ingest-dgcmef` — c'est le « robot » qui surveille la DGCMEF sans intervention manuelle.

**Reste à faire manuellement (le bac à sable de développement n'a pas d'accès réseau sortant vers les serveurs de fichiers Hostinger — politique réseau de session, constatée et non contournée) :**
1. Dans hPanel → *Sites web* → le site cible → *Node.js* : uploader l'archive `fasopmi-hostinger.tar.gz` fournie (code source complet, sans `node_modules`/`.next`/`.git`) dans `public_html`.
2. Lancer le build Node.js (les réglages — Node 22, script `hostinger-build` — sont déjà enregistrés côté Hostinger). Le script `hostinger-build` exécute `prisma generate && prisma migrate deploy && prisma db seed && next build` : la migration et le seed (idempotent, se désactive automatiquement si la base est déjà peuplée) tournent donc **automatiquement à chaque déploiement**, en toute sécurité.
3. Vérifier les logs de build (`Get Node.js Build Logs` côté hPanel ou API) puis déclencher une première importation manuelle depuis `/admin/sources` pour vérifier le pipeline DGCMEF contre le site réel — voir « Limites connues ».

**Alternative Vercel** (si un hébergement séparé est préféré) : `vercel.json` reste fonctionnel — il faut alors ouvrir l'accès distant MySQL depuis Hostinger (`%` ou IP fixe, aucune IP sortante fixe n'existant côté Vercel) ou provisionner une base MySQL/PostgreSQL managée tierce, et renseigner les mêmes variables d'environnement dans le projet Vercel.

## Ce qui est livré

1. **Modèle de données universel** (`prisma/schema.prisma`) — Publication → Document → Page, Marché → Lot → Événement/Version/Rectification/Annulation/Reprise, Exigences/Documents requis/Réservations (7 régimes dont actionnariat handicap), Entreprises enrichies (RCCM normalisé, taille, régime fiscal, représentant légal, PGES) + résolution d'entité, Offres avec **trois montants distincts** (soumissionné/corrigé/attribué + taux d'augmentation), **référentiel des motifs de rejet A-I** (64 codes, y compris fraude et taille/régime fiscal), **moteur OAB multi-conventions** avec score de cohérence, Répertoires de fournisseurs (objets REP), Recours ARCOP qualifiés, PPM/Avis généraux, Tenants/Users/RBAC, Watchlists/Alertes, Scores/Matching, Abonnements/Paiements, Dossiers de soumission, IA, Qualité des données/Audit, déduplication par hash de bloc.
2. **Pipeline d'ingestion DGCMEF** (`src/lib/ingestion/`) — connecteur HTML (numéros simples/doubles/`bis`), extraction PDF avec repli OCR pluggable, segmentation/classification/extraction structurée, **déduplication par hash de bloc** (encarts publicitaires et blocs republiés à l'identique, section 1.3), déduplication par similarité (Jaccard), orchestration avec reprise sur échec. **Robot quotidien automatique** via cron Vercel (`vercel.json` + `/api/cron/ingest-dgcmef`), déclenchable aussi manuellement (`/admin/sources`, `npm run ingest`).
3. **Recherche + fiche marché** — recherche en langage naturel → filtres, fiche marché complète (score, exigences, documents requis, lots, calendrier, analyse prix/concurrence, risques, chronologie, **bandeau de source officielle obligatoire avec lien direct dgcmef.gov.bf**).
4. **Profil entreprise + matching** — onboarding guidé, moteur de matching à 4 verdicts.
5. **Scores versionnés et explicables** — pertinence/éligibilité/attractivité/global, pondérations administrables, facteurs affichés.
6. **Dashboard analytique** + module Analyses paramétré (12 dimensions).
7. **Alertes & veille** — centre d'alertes, watchlists, favoris, briefings quotidien/hebdomadaire.
8. **Assistant IA** — RAG anti-hallucination, sources citées, dégradation propre sans clé API.
9. **Administration SaaS complète** — utilisateurs, tenants, sources, importations, jobs, validation humaine, taxonomies, scoring, qualité des données, audit.
10. **API REST interne** (`/api/v1/*`).
11. **Tests** — 36 tests (dont la déduplication par hash de bloc reproduisant le cas SONATUR n°4484/4485 de l'analyse structurelle).

Les nombreuses variantes de liste du cahier des charges sont implémentées comme un **framework générique paramétré par filtres et route dynamique** plutôt que comme des pages dupliquées.

## Limites connues et prochaines étapes

- **Base de données de production** : provisionnée sur Hostinger (MySQL, `srv2029.hstgr.io`, accès `localhost` uniquement depuis le site Node.js colocalisé — voir « Déploiement »). Le développement local utilise MariaDB dans cet environnement de session ; le schéma est validé MySQL (migration, seed idempotent, 36 tests, build de production — tous verts).
- **Déploiement effectif du code sur Hostinger** : bloqué depuis ce bac à sable par la politique réseau de session (le serveur de fichiers Hostinger, `srv2029-files.hstgr.io`, n'est pas sur la liste blanche sortante) — confirmé via le diagnostic proxy, non contourné. L'archive de déploiement et les 3 étapes manuelles restantes sont détaillées dans « Déploiement ».
- **Réseau sortant vers dgcmef.gov.bf** : cet environnement de développement n'a pas d'accès réseau sortant vers le site réel (confirmé par test direct). Le connecteur et le robot cron sont du code de production réel, validés par tests avec fixtures locales reproduisant fidèlement la structure des quotidiens (numéros doubles, fichiers `bis`, encarts publicitaires dupliqués). **À faire au premier déploiement avec accès réseau** : vérifier les sélecteurs CSS de `src/lib/ingestion/connectors/dgcmef.ts` contre la page réelle.
- **OCR** : interface de repli prête (`src/lib/ingestion/extract-text.ts`), aucun moteur installé (poids/complexité de ce bac à sable).
- **Paiements PayDunya / WhatsApp Business API** : le cahier des charges v2 spécifie ces fournisseurs précisément ; l'architecture reste abstraite (`src/lib/payments/provider.ts`) avec un fournisseur simulé, aucune clé marchande n'étant disponible ici.
- **i18n** : scaffold posé, interface encore rédigée en dur en français.
- **Répertoires de fournisseurs (REP)** : modèle de données et écrans admin en place ; l'extraction automatique depuis les tableaux de répertoire (section 3.1, gisement prioritaire) reste à raffiner sur des PDF réels.
- **Multi-pays** : modèle déjà générique (`Country`, `regulationFramework`) ; seul le Burkina Faso est peuplé.

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
src/app/api/cron/           robot d'ingestion quotidien (Vercel Cron)
vercel.json                  configuration du cron de production
tests/unit, tests/integration  suite de tests
```
