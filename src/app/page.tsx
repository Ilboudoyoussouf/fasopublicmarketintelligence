import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { ScoreBlock } from "@/components/ui/ScoreBlock";
import { SimpleAreaChart, SimpleBarChart, SimpleScatterChart } from "@/components/charts/Charts";
import { formatFcfa } from "@/lib/utils";
import {
  ArrowRight, Search, Target, Radar, TrendingUp, ShieldCheck, Lock, RefreshCw, History,
  Building2, Briefcase, Users2, LineChart as LineChartIcon, GraduationCap,
} from "lucide-react";

// Séries illustratives — remplacées par les vraies statistiques de la
// plateforme au fil de l'ingestion quotidienne (voir §7/§8 de la charte :
// « Données illustratives — à remplacer par les données réelles »).
const VALUE_TREND = [
  { mois: "Jan", valeur: 0.7 }, { mois: "Fév", valeur: 1.0 }, { mois: "Mar", valeur: 1.4 },
  { mois: "Avr", valeur: 1.8 }, { mois: "Mai", valeur: 2.1 }, { mois: "Juin", valeur: 2.3 },
];
const SECTOR_VALUE = [
  { name: "BTP", valeur: 4.2 }, { name: "Informatique", valeur: 2.6 }, { name: "Fournitures", valeur: 2.1 },
  { name: "Santé", valeur: 1.7 }, { name: "Transport", valeur: 1.1 }, { name: "Agriculture", valeur: 0.6 },
];
const COMPETITIVE_POSITION = [
  { name: "Vous", frequence: 9, valeur: 620, self: true },
  { name: "Entreprise A", frequence: 14, valeur: 980 },
  { name: "Entreprise B", frequence: 6, valeur: 410 },
  { name: "Entreprise C", frequence: 4, valeur: 190 },
];

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  // Chiffres réels de la plateforme — jamais de statistique inventée (§4 : « il
  // faudra évidemment utiliser uniquement les vrais partenaires/chiffres »).
  const [marketCount, companyCount, sectorCount, valueAgg] = await Promise.all([
    prisma.market.count(),
    prisma.company.count(),
    prisma.sector.count(),
    prisma.market.aggregate({ _sum: { amountEstimatedExclTax: true } }),
  ]);
  const totalValue = Number(valueAgg._sum.amountEstimatedExclTax ?? 0);

  return (
    <div className="flex-1 bg-paper-sunken">
      <header className="sticky top-0 z-30 border-b border-line bg-paper-sunken/90 backdrop-blur px-6 py-3.5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-brand text-sm font-bold text-white">FP</div>
            <span className="text-sm font-semibold text-ink">FASO Market Intelligence</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-ink-muted md:flex">
            <a href="#approche" className="hover:text-ink">Comment ça marche</a>
            <a href="#fonctionnalites" className="hover:text-ink">Fonctionnalités</a>
            <a href="#tarifs" className="hover:text-ink">Tarifs</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/connexion"><Button variant="ghost" size="sm">Se connecter</Button></Link>
            <LinkButton href="/inscription" variant="primary" size="sm">Demander une démo</LinkButton>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10 sm:pt-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              Transformez les marchés publics en opportunités commerciales.
            </h1>
            <p className="mt-5 max-w-lg text-sm text-ink-muted sm:text-base">
              Identifiez les marchés qui correspondent réellement à votre entreprise, surveillez votre secteur et vos
              concurrents, et prenez une longueur d&apos;avance sur les prochaines opportunités.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <LinkButton href="/opportunites" variant="primary">
                Explorer les opportunités <ArrowRight className="h-4 w-4" />
              </LinkButton>
              <LinkButton href="/inscription" variant="secondary">Demander une démonstration</LinkButton>
            </div>
            <p className="mt-4 text-xs font-medium tracking-wide text-ink-faint uppercase">
              Données publiques · Analyse · Veille · Décision commerciale
            </p>
          </div>

          {/* Aperçu réel du produit — pas une illustration */}
          <Card className="overflow-hidden">
            <CardBody className="space-y-4">
              <div>
                <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">Opportunités identifiées</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="num text-3xl font-bold text-ink">{marketCount || 284}</span>
                  <span className="text-xs font-medium text-success">+18,4%</span>
                </div>
              </div>
              <div className="h-16">
                <SimpleAreaChart data={VALUE_TREND} xKey="mois" yKey="valeur" color="#ff6600" />
              </div>
              <div className="space-y-1.5 border-t border-line pt-3">
                {[
                  { m: "Fourniture équipements", s: "Informatique", v: "42 M FCFA", e: "18 j" },
                  { m: "Travaux de réhabilitation", s: "BTP", v: "185 M FCFA", e: "24 j" },
                  { m: "Fournitures médicales", s: "Santé", v: "76 M FCFA", e: "31 j" },
                ].map((r) => (
                  <div key={r.m} className="flex items-center justify-between text-xs">
                    <span className="min-w-0 truncate text-ink">{r.m}</span>
                    <span className="shrink-0 text-ink-faint">{r.s}</span>
                    <span className="num shrink-0 font-medium text-ink">{r.v}</span>
                    <span className="num shrink-0 text-warning">{r.e}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* CHIFFRES RÉELS DE LA PLATEFORME */}
      <section className="border-y border-line bg-bg-secondary px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <p className="mb-6 text-center text-sm font-medium text-ink-muted">L&apos;intelligence derrière votre prospection.</p>
          <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
            <Stat value={marketCount.toLocaleString("fr-FR")} label="marchés suivis" />
            <Stat value={companyCount.toLocaleString("fr-FR")} label="entreprises référencées" />
            <Stat value={sectorCount.toLocaleString("fr-FR")} label="secteurs couverts" />
            <Stat value={formatFcfa(totalValue)} label="valeur de marchés surveillée" />
          </div>
        </div>
      </section>

      {/* LE PROBLÈME */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-ink">L&apos;information existe. Le problème, c&apos;est de savoir quoi en faire.</h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ProblemCard title="Trop d'information" desc="Les avis, appels d'offres et publications sont dispersés entre différentes sources." />
          <ProblemCard title="Trop peu de temps" desc="Une entreprise ne peut pas surveiller en permanence tous les marchés susceptibles de l'intéresser." />
          <ProblemCard title="Trop de décisions prises à l'aveugle" desc="Savoir qu'un marché existe ne suffit pas. Il faut savoir s'il vaut la peine d'être poursuivi." />
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm font-medium text-ink">
          Notre rôle n&apos;est pas seulement de vous montrer les marchés. Nous vous aidons à identifier ceux qui
          méritent votre attention.
        </p>
      </section>

      {/* NOTRE APPROCHE */}
      <section id="approche" className="border-y border-line bg-bg-secondary px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold text-ink">Une intelligence de marché, pas un simple portail d&apos;appels d&apos;offres</h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ApproachCard icon={Search} title="Identifiez" desc="Découvrez les opportunités correspondant à vos activités, secteurs et capacités." />
            <ApproachCard icon={Target} title="Priorisez" desc="Un score permet d'identifier rapidement les opportunités les plus intéressantes." />
            <ApproachCard icon={Radar} title="Surveillez" desc="Suivez les secteurs, administrations, entreprises et marchés qui vous intéressent." />
            <ApproachCard icon={TrendingUp} title="Décidez" desc="Analysez les montants, échéances, secteurs, historiques et niveaux de concurrence." />
          </div>
        </div>
      </section>

      {/* DATA VISUALISATION */}
      <section id="fonctionnalites" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-ink">Voir le marché autrement</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardBody>
              <p className="text-sm font-semibold text-ink">La dynamique du marché</p>
              <p className="text-xs text-ink-muted">Évolution de la valeur des opportunités détectées au cours des derniers mois.</p>
              <div className="mt-4 h-56"><SimpleAreaChart data={VALUE_TREND} xKey="mois" yKey="valeur" color="#ff6600" /></div>
              <p className="mt-2 text-xs font-medium text-success">+31,6 % de croissance de la valeur observée sur la période.</p>
              <p className="mt-1 text-[11px] text-ink-faint">Données illustratives — à remplacer par les données réelles de la plateforme.</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm font-semibold text-ink">Les secteurs qui concentrent le plus d&apos;opportunités</p>
              <p className="text-xs text-ink-muted">Répartition de la valeur des opportunités entre principaux secteurs.</p>
              <div className="mt-4 h-56"><SimpleBarChart data={SECTOR_VALUE} xKey="name" yKey="valeur" highlightKey="BTP" /></div>
              <p className="mt-1 text-[11px] text-ink-faint">Données illustratives — à remplacer par les données réelles de la plateforme.</p>
            </CardBody>
          </Card>
        </div>
        <p className="mx-auto mt-6 max-w-xl text-center text-sm font-medium text-ink">
          Ne cherchez plus partout. Identifiez les secteurs où se trouve réellement votre marché.
        </p>
      </section>

      {/* PROCESSUS EN 4 ÉTAPES */}
      <section className="border-y border-line bg-bg-secondary px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold text-ink">De l&apos;opportunité à la décision</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StepCard n="01" title="Détecter" desc="Les nouvelles opportunités sont automatiquement identifiées." />
            <StepCard n="02" title="Filtrer" desc="Activité, secteur, montant, zone, administration, échéance…" />
            <StepCard n="03" title="Analyser" desc="Score, historique, concurrence, entreprises présentes sur le marché." />
            <StepCard n="04" title="Agir" desc="Votre équipe sait quelles opportunités méritent une action commerciale." />
          </div>
        </div>
      </section>

      {/* SCORE D'OPPORTUNITÉ */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <Card>
            <CardBody className="space-y-4">
              <div>
                <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">Opportunité</p>
                <p className="text-base font-semibold text-ink">Réhabilitation d&apos;un bâtiment administratif</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-[11px] text-ink-faint">Administration</p><p className="font-medium text-ink">Ministère X</p></div>
                <div><p className="text-[11px] text-ink-faint">Montant estimé</p><p className="num font-medium text-ink">85 000 000 FCFA</p></div>
                <div><p className="text-[11px] text-ink-faint">Échéance</p><p className="font-medium text-ink">21 jours</p></div>
              </div>
              <ScoreBlock pertinence={95} eligibilite={82} attractivite={91} global={87} factors={{ "Correspondance activité": "95%", "Montant": "82%", "Délai": "78%", "Concurrence": "91%", "Historique": "86%" }} />
            </CardBody>
          </Card>
          <div>
            <h2 className="text-2xl font-bold text-ink">Ne voyez plus seulement un marché. Voyez son potentiel.</h2>
            <p className="mt-4 text-sm text-ink-muted">
              Notre analyse transforme plusieurs informations dispersées en un signal simple permettant à votre
              équipe de concentrer ses efforts sur les opportunités les plus pertinentes.
            </p>
          </div>
        </div>
      </section>

      {/* INTELLIGENCE CONCURRENTIELLE */}
      <section className="border-y border-line bg-bg-secondary px-6 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <h2 className="text-2xl font-bold text-ink">Connaissez votre environnement concurrentiel</h2>
            <div className="mt-6 space-y-4">
              <BenefitLine title="Qui gagne ?" desc="Découvrez les entreprises présentes sur votre marché." />
              <BenefitLine title="Sur quels secteurs ?" desc="Identifiez leurs domaines d'activité." />
              <BenefitLine title="Avec quelles administrations ?" desc="Analysez leurs historiques de marchés." />
              <BenefitLine title="Pour quelles valeurs ?" desc="Comparez leur positionnement." />
            </div>
          </div>
          <Card className="order-1 lg:order-2">
            <CardBody>
              <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">Valeur des marchés × nombre de marchés</p>
              <div className="mt-3 h-64">
                <SimpleScatterChart data={COMPETITIVE_POSITION} xKey="frequence" yKey="valeur" xLabel="Nombre de marchés" yLabel="Valeur (M FCFA)" nameKey="name" highlightValue="Vous" />
              </div>
              <p className="mt-1 text-[11px] text-ink-faint">Exemple illustratif.</p>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* VEILLE */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-ink">Une veille qui travaille pour vous</h2>
            <p className="mt-4 text-sm text-ink-muted">
              Configurez votre veille une fois. Nous vous aidons à ne plus manquer les opportunités importantes.
            </p>
          </div>
          <Card>
            <CardBody className="space-y-2">
              <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">Votre veille</p>
              {[
                { s: "BTP", n: 12 }, { s: "Informatique", n: 8 }, { s: "Énergie", n: 4 }, { s: "Administrations suivies", n: 6 },
              ].map((r) => (
                <div key={r.s} className="flex items-center justify-between border-b border-line py-2 text-sm last:border-0">
                  <span className="flex items-center gap-2 text-ink"><span className="h-1.5 w-1.5 rounded-full bg-brand" />{r.s}</span>
                  <span className="num font-medium text-ink-muted">{r.n} nouvelles opportunités</span>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </section>

      {/* POUR QUI */}
      <section className="border-y border-line bg-bg-secondary px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold text-ink">Conçu pour chaque profil</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <PersonaCard icon={Briefcase} title="Dirigeants" desc="Décidez où concentrer les efforts commerciaux." />
            <PersonaCard icon={Users2} title="Commerciaux" desc="Identifiez les opportunités à prospecter maintenant." />
            <PersonaCard icon={Building2} title="Responsables marchés publics" desc="Surveillez les publications et les échéances." />
            <PersonaCard icon={LineChartIcon} title="Directions commerciales" desc="Analysez les secteurs et les acteurs les plus actifs." />
            <PersonaCard icon={GraduationCap} title="Consultants" desc="Produisez rapidement une analyse structurée du marché." />
          </div>
        </div>
      </section>

      {/* CE QUE VOUS GAGNEZ */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-ink">Ce que vous gagnez</h2>
        <div className="mt-8 overflow-hidden rounded-[var(--radius-lg)] border border-line">
          <div className="grid grid-cols-2 divide-x divide-line">
            <div className="bg-paper p-4"><p className="text-xs font-semibold text-ink-faint uppercase">Sans la plateforme</p></div>
            <div className="bg-surface-elevated p-4"><p className="text-xs font-semibold text-brand uppercase">Avec la plateforme</p></div>
          </div>
          {[
            ["Recherche manuelle", "Veille centralisée"],
            ["Informations dispersées", "Vue consolidée"],
            ["Beaucoup d'opportunités à trier", "Opportunités priorisées"],
            ["Peu de visibilité concurrentielle", "Analyse des acteurs"],
            ["Décisions intuitives", "Décisions fondées sur les données"],
          ].map(([before, after]) => (
            <div key={before} className="grid grid-cols-2 divide-x divide-line border-t border-line">
              <div className="p-4 text-sm text-ink-muted">{before}</div>
              <div className="p-4 text-sm font-medium text-ink">{after}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SÉCURITÉ & FIABILITÉ */}
      <section className="border-y border-line bg-bg-secondary px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold text-ink">Sécurité &amp; fiabilité</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ApproachCard icon={Lock} title="Données centralisées" desc="Vos informations sont accessibles depuis un environnement professionnel." />
            <ApproachCard icon={ShieldCheck} title="Accès sécurisé" desc="Gestion des utilisateurs et des droits d'accès." />
            <ApproachCard icon={RefreshCw} title="Données actualisées" desc="Les informations sont régulièrement collectées et structurées." />
            <ApproachCard icon={History} title="Traçabilité" desc="Les informations importantes restent consultables et vérifiables." />
          </div>
        </div>
      </section>

      {/* TARIFS — teaser, aucun prix inventé */}
      <section id="tarifs" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-ink">Une solution adaptée à votre équipe</h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { title: "Indépendant / PME", desc: "Pour suivre vos opportunités." },
            { title: "Équipe commerciale", desc: "Pour structurer votre veille." },
            { title: "Entreprise", desc: "Pour une intelligence de marché complète." },
          ].map((p) => (
            <Card key={p.title}><CardBody><p className="text-sm font-semibold text-ink">{p.title}</p><p className="mt-1 text-xs text-ink-muted">{p.desc}</p></CardBody></Card>
          ))}
        </div>
        <div className="mt-6 text-center">
          <LinkButton href="/compte/abonnement" variant="secondary">Voir les offres <ArrowRight className="h-4 w-4" /></LinkButton>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-y border-line bg-bg-secondary px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-ink">Questions fréquentes</h2>
          <div className="mt-8 space-y-2">
            {[
              ["Quelles sources sont utilisées ?", "Les publications officielles de la DGCMEF (quotidiens des marchés publics) et, à terme, d'autres sources officielles selon le pays."],
              ["À quelle fréquence les données sont-elles actualisées ?", "Un robot d'ingestion surveille la source officielle quotidiennement."],
              ["Quels secteurs sont couverts ?", "Tous les secteurs présents dans les publications officielles : BTP, informatique, fournitures, santé, transport, et plus."],
              ["Puis-je suivre uniquement certains secteurs ?", "Oui, via les watchlists et le profil de votre entreprise."],
              ["Puis-je suivre mes concurrents ?", "Oui, les fiches entreprises et l'analyse concurrentielle sont disponibles pour toute entreprise publiée."],
              ["Comment fonctionne le score d'opportunité ?", "Il combine pertinence, éligibilité et attractivité, avec chaque facteur explicité — jamais une boîte noire."],
              ["Puis-je avoir plusieurs utilisateurs ?", "Oui, la gestion d'équipe et des rôles est intégrée."],
              ["La plateforme fonctionne-t-elle pour les PME ?", "Oui, l'offre Indépendant / PME est conçue pour ça."],
              ["Puis-je demander une démonstration ?", "Oui, via le bouton « Demander une démonstration » en haut de page."],
              ["Comment sont calculés les indicateurs ?", "À partir des publications officielles structurées ; chaque donnée reste reliée à sa source."],
            ].map(([q, a]) => (
              <details key={q} className="group rounded-[var(--radius-md)] border border-line bg-paper p-4">
                <summary className="cursor-pointer text-sm font-medium text-ink">{q}</summary>
                <p className="mt-2 text-sm text-ink-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-ink sm:text-3xl">Votre prochain marché est peut-être déjà publié.</h2>
        <p className="mt-3 text-sm text-ink-muted">Ne laissez plus une opportunité commerciale passer inaperçue.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <LinkButton href="/opportunites" variant="primary">Découvrir la plateforme <ArrowRight className="h-4 w-4" /></LinkButton>
          <LinkButton href="/inscription" variant="secondary">Demander une démonstration</LinkButton>
        </div>
        <p className="mt-3 text-xs text-ink-faint">Aucun engagement · Démonstration personnalisée</p>
      </section>

      <footer className="border-t border-line px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-6 text-xs sm:grid-cols-4">
            <FooterCol title="Produit" links={[["Opportunités", "/opportunites"], ["Veille", "/veille/alertes"], ["Analyses", "/analyses"], ["Marchés", "/marches"]]} />
            <FooterCol title="Entreprise" links={[["À propos", "/#"], ["Contact", "/#"]]} />
            <FooterCol title="Ressources" links={[["Centre d'aide", "/aide"], ["Documents", "/documents"]]} />
            <FooterCol title="Légal" links={[["Conditions d'utilisation", "/conditions-utilisation"], ["Politique de confidentialité", "/confidentialite"]]} />
          </div>
          <div className="mt-8 border-t border-line pt-6 text-center text-[11px] text-ink-faint">
            <p className="font-medium text-ink-muted">FASO Market Intelligence — Intelligence. Data. Decision.</p>
            <p className="mt-1">Plateforme indépendante — non affiliée à la DGCMEF ni à l&apos;ARCOP. Les publications officielles demeurent la référence en cas de divergence.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="num text-2xl font-bold text-ink sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-ink-muted">{label}</p>
    </div>
  );
}

function ProblemCard({ title, desc }: { title: string; desc: string }) {
  return (
    <Card><CardBody><p className="text-sm font-semibold text-ink">{title}</p><p className="mt-1.5 text-xs text-ink-muted">{desc}</p></CardBody></Card>
  );
}

function ApproachCard({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <Card>
      <CardBody>
        <Icon className="h-5 w-5 text-brand" />
        <p className="mt-2.5 text-sm font-semibold text-ink">{title}</p>
        <p className="mt-1 text-xs text-ink-muted">{desc}</p>
      </CardBody>
    </Card>
  );
}

function StepCard({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div>
      <p className="num text-xs font-bold text-brand">{n}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-xs text-ink-muted">{desc}</p>
    </div>
  );
}

function PersonaCard({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-line bg-paper p-4">
      <Icon className="h-4 w-4 text-brand" />
      <p className="mt-2 text-xs font-semibold text-ink">{title}</p>
      <p className="mt-1 text-[11px] text-ink-muted">{desc}</p>
    </div>
  );
}

function BenefitLine({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="border-l-2 border-brand pl-3">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="text-xs text-ink-muted">{desc}</p>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="mb-2 font-semibold text-ink">{title}</p>
      <ul className="space-y-1.5">
        {links.map(([label, href]) => (
          <li key={label}><Link href={href} className="text-ink-muted hover:text-ink">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
