import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button, LinkButton } from "@/components/ui/Button";
import { ArrowRight, Bell, LineChart, Search, ShieldCheck, Sparkles } from "lucide-react";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex-1">
      <header className="flex items-center justify-between border-b border-line bg-paper px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-sm font-bold text-white">FP</div>
          <span className="text-sm font-semibold text-ink">FASO Market Intelligence</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/connexion"><Button variant="ghost" size="sm">Connexion</Button></Link>
          <LinkButton href="/inscription" variant="primary" size="sm">Créer un compte</LinkButton>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Où sont vos opportunités commerciales publiques,<br className="hidden sm:block" /> et que devez-vous faire maintenant ?
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-ink-muted">
          Trouvez les bonnes opportunités, comprenez les exigences, suivez les rectifications, analysez la
          concurrence et décidez où investir vos efforts de soumission — à partir des publications officielles de la
          commande publique au Burkina Faso.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <LinkButton href="/inscription" variant="primary">
            Démarrer gratuitement <ArrowRight className="h-4 w-4" />
          </LinkButton>
          <LinkButton href="/connexion" variant="secondary">Se connecter</LinkButton>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl grid-cols-1 gap-4 px-6 pb-16 sm:grid-cols-3">
        {[
          { icon: Search, title: "Veille automatisée", desc: "Surveillance continue des quotidiens DGCMEF, avis, rectificatifs et résultats." },
          { icon: Sparkles, title: "Matching & scores", desc: "Pertinence, éligibilité et attractivité calculées et expliquées pour chaque marché." },
          { icon: Bell, title: "Alertes intelligentes", desc: "Échéances, rectifications et attributions, sans doublon ni spam." },
          { icon: LineChart, title: "Intelligence concurrentielle", desc: "Historique des organismes, entreprises et prix, avec traçabilité complète." },
          { icon: ShieldCheck, title: "Source officielle d'abord", desc: "Chaque donnée renvoie à sa publication, son quotidien et sa page source." },
          { icon: Sparkles, title: "Assistant IA", desc: "Résumés, comparaisons et réponses toujours sourcées — jamais inventées." },
        ].map((f) => (
          <div key={f.title} className="rounded-lg border border-line bg-paper p-4">
            <f.icon className="h-5 w-5 text-brand" />
            <p className="mt-2 text-sm font-medium text-ink">{f.title}</p>
            <p className="mt-1 text-xs text-ink-muted">{f.desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-line px-6 py-6 text-center text-[11px] text-ink-faint">
        Plateforme indépendante — non affiliée à la DGCMEF ni à l&apos;ARCOP. Les publications officielles demeurent la référence en cas de divergence.
      </footer>
    </div>
  );
}
