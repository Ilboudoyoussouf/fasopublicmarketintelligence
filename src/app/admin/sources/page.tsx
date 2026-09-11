import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { toggleSourceActiveAction } from "@/app/admin/actions";
import { formatDateTime } from "@/lib/utils";
import { IngestButton } from "@/components/domain/IngestButton";
import { ClearDemoDataButton } from "@/components/domain/ClearDemoDataButton";
import { UploadAndAnalyzeForm } from "@/components/domain/UploadAndAnalyzeForm";
import { UploadWithoutAIForm } from "@/components/domain/UploadWithoutAIForm";
import { SourceAnalysisPanel } from "@/components/domain/SourceAnalysisPanel";

// L'extraction Gemini d'un quotidien de plusieurs dizaines de pages peut
// prendre plusieurs minutes (voir MAX_ATTEMPTS/retries dans
// gemini-extractor.ts) — au-delà de la limite par défaut des fonctions
// serverless (souvent 10-60s), ce qui interromprait la requête en plein
// milieu et ferait échouer les Server Actions de cette page de façon
// confuse côté client. Sans effet sur un hébergement Node.js persistant
// (Hostinger) ; pris en compte automatiquement sur Vercel.
export const maxDuration = 300;

export default async function AdminSourcesPage() {
  const sources = await prisma.source.findMany({ include: { _count: { select: { publications: true } } } });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-ink">Sources</h1>
      <Card>
        <CardBody className="space-y-2">
          <div>
            <p className="text-sm font-medium text-ink">Import manuel d&apos;un quotidien (PDF)</p>
            <p className="text-xs text-ink-muted">Dépose le PDF d&apos;un quotidien DGCMEF (numéro déjà en main, sans attendre le passage du robot). L&apos;IA (Gemini) extrait tous les champs de chaque marché — titre, autorité, secteur, région, financement, montants, calendrier complet, exigences, pièces requises, lots — puis affiche un aperçu : rien n&apos;est ajouté à la base tant que vous ne validez pas explicitement.</p>
          </div>
          <UploadAndAnalyzeForm sources={sources.map((s) => ({ id: s.id, name: s.name }))} />
        </CardBody>
      </Card>
      <Card>
        <CardBody className="space-y-2">
          <div>
            <p className="text-sm font-medium text-ink">Import manuel d&apos;un quotidien — sans IA</p>
            <p className="text-xs text-ink-muted">Même principe (aperçu avant ajout, rien n&apos;est écrit tant que vous ne validez pas), mais avec le parseur par règles au lieu de Gemini : plus rapide, sans dépendance à un quota externe. Utile en repli, ou simplement pour un dépôt immédiat sans attendre l&apos;IA.</p>
          </div>
          <UploadWithoutAIForm sources={sources.map((s) => ({ id: s.id, name: s.name }))} />
        </CardBody>
      </Card>
      <Card>
        <CardBody className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <p className="text-sm font-medium text-ink">Données de démonstration</p>
            <p className="text-xs text-ink-muted">Retire les marchés fictifs du jeu de données initial (Annexe D) sans toucher aux marchés réellement ingérés depuis DGCMEF.</p>
          </div>
          <ClearDemoDataButton />
        </CardBody>
      </Card>
      <div className="space-y-2">
        {sources.map((s) => (
          <Card key={s.id}><CardBody className="space-y-3">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{s.name}</p>
                <p className="text-xs text-ink-muted break-words">{s.baseUrl} · {s._count.publications} publication(s) · dernier passage {formatDateTime(s.lastCrawledAt)}</p>
              </div>
              <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
                <Badge tone={s.isActive ? "success" : "neutral"}>{s.isActive ? "Actif" : "Inactif"}</Badge>
                <form action={toggleSourceActiveAction.bind(null, s.id)}>
                  <button type="submit" className="text-xs text-brand hover:underline">{s.isActive ? "Désactiver" : "Activer"}</button>
                </form>
                <IngestButton sourceId={s.id} />
              </div>
            </div>
            <div className="border-t border-line pt-3">
              <p className="mb-1.5 text-xs font-medium text-ink">Analyser avec aperçu avant ajout</p>
              <p className="mb-2 text-[11px] text-ink-muted">Télécharge les nouveaux quotidiens de cette source, les extrait avec Gemini, puis affiche un aperçu des marchés détectés — rien n&apos;est ajouté à la base tant que vous ne le validez pas explicitement.</p>
              <SourceAnalysisPanel sourceId={s.id} />
            </div>
          </CardBody></Card>
        ))}
      </div>
    </div>
  );
}
