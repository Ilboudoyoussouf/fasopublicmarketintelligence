"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { completeOnboardingAction, type OnboardingPayload } from "@/app/onboarding/actions";
import type { Sector, Region } from "@prisma/client";
import { CheckCircle2 } from "lucide-react";

const STEPS = [
  "Bienvenue",
  "Type d'entreprise",
  "Secteur",
  "Localisation",
  "Capacités",
  "Agréments",
  "Expérience",
  "Préférences de marchés",
  "Zones recherchées",
  "Budget / valeur ciblée",
  "Configuration des alertes",
  "Résumé du profil",
] as const;

export function OnboardingWizard({ sectors, regions }: { sectors: Sector[]; regions: Region[] }) {
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const grouped = useMemo(() => {
    const map = new Map<string, Sector[]>();
    for (const s of sectors) {
      if (!map.has(s.group)) map.set(s.group, []);
      map.get(s.group)!.push(s);
    }
    return map;
  }, [sectors]);

  const [form, setForm] = useState({
    companyName: "",
    size: "PME (11-50 salariés)",
    sectorIds: [] as string[],
    regionName: regions[0]?.name ?? "",
    zoneRegionNames: [] as string[],
    revenueBand: "",
    experienceYears: 2,
    licenses: [{ label: "", expirationDate: "" }],
    references: [{ marketTitle: "", clientName: "", year: undefined as number | undefined, amount: undefined as number | undefined }],
    targetCategories: [] as string[],
    budgetMin: undefined as number | undefined,
    budgetMax: undefined as number | undefined,
    alertChannels: ["APP", "EMAIL"] as string[],
    alertFrequency: "QUOTIDIEN" as "QUOTIDIEN" | "HEBDOMADAIRE",
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleInArray(key: "sectorIds" | "zoneRegionNames" | "alertChannels", value: string) {
    setForm((f) => {
      const arr = f[key];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...f, [key]: next };
    });
  }

  const canNext = step === 1 ? form.companyName.trim().length > 1 : step === 2 ? form.sectorIds.length > 0 : true;

  function submit() {
    const selectedNames = sectors.filter((s) => form.sectorIds.includes(s.id)).map((s) => s.name);
    const payload: OnboardingPayload = {
      ...form,
      targetCategories: form.targetCategories.length > 0 ? form.targetCategories : selectedNames,
    };
    startTransition(() => completeOnboardingAction(payload));
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-1">
        {STEPS.map((label, i) => (
          <div key={label} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-brand" : "bg-line")} title={label} />
        ))}
      </div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-faint">
        Étape {step + 1} / {STEPS.length}
      </p>
      <h1 className="mb-5 text-lg font-semibold text-ink">{STEPS[step]}</h1>

      <div className="rounded-xl border border-line bg-paper p-6">
        {step === 0 && (
          <div className="space-y-3 text-sm text-ink-muted">
            <p>Configurons votre profil entreprise pour faire remonter automatiquement les marchés publics qui vous correspondent.</p>
            <p>Cela prend environ 3 minutes. Vous pourrez tout modifier ensuite depuis « Mon entreprise ».</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <Field label="Raison sociale">
              <input value={form.companyName} onChange={(e) => update("companyName", e.target.value)} className="input" placeholder="TECH SAHEL SOLUTIONS SARL" />
            </Field>
            <Field label="Taille de l'entreprise">
              <select value={form.size} onChange={(e) => update("size", e.target.value)} className="input">
                {["Micro-entreprise (1-10 salariés)", "PME (11-50 salariés)", "PME (51-200 salariés)", "Grande entreprise (200+ salariés)"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {[...grouped.entries()].map(([group, list]) => (
              <div key={group}>
                <p className="mb-1.5 text-xs font-semibold text-ink-muted">{groupLabel(group)}</p>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((s) => (
                    <Chip key={s.id} active={form.sectorIds.includes(s.id)} onClick={() => toggleInArray("sectorIds", s.id)}>
                      {s.name}
                    </Chip>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <Field label="Siège social">
              <select value={form.regionName} onChange={(e) => update("regionName", e.target.value)} className="input">
                {regions.map((r) => (
                  <option key={r.id}>{r.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Zones d'intervention recherchées">
              <div className="flex flex-wrap gap-1.5">
                {regions.map((r) => (
                  <Chip key={r.id} active={form.zoneRegionNames.includes(r.name)} onClick={() => toggleInArray("zoneRegionNames", r.name)}>
                    {r.name}
                  </Chip>
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <Field label="Tranche de chiffre d'affaires annuel">
              <select value={form.revenueBand} onChange={(e) => update("revenueBand", e.target.value)} className="input">
                <option value="">Non renseigné</option>
                {["< 50M FCFA", "50M - 150M FCFA", "150M - 500M FCFA", "> 500M FCFA"].map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </Field>
            <Field label="Années d'expérience">
              <input type="number" min={0} value={form.experienceYears} onChange={(e) => update("experienceYears", Number(e.target.value))} className="input" />
            </Field>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <p className="text-xs text-ink-muted">Agréments détenus (facultatif, modifiable ensuite).</p>
            {form.licenses.map((l, i) => (
              <div key={i} className="grid grid-cols-2 gap-2">
                <input placeholder="Ex. Agrément technique informatique" value={l.label} onChange={(e) => update("licenses", form.licenses.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className="input col-span-2 sm:col-span-1" />
                <input type="date" value={l.expirationDate} onChange={(e) => update("licenses", form.licenses.map((x, j) => (j === i ? { ...x, expirationDate: e.target.value } : x)))} className="input" />
              </div>
            ))}
            <button type="button" className="text-xs text-brand hover:underline" onClick={() => update("licenses", [...form.licenses, { label: "", expirationDate: "" }])}>
              + Ajouter un agrément
            </button>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-3">
            <p className="text-xs text-ink-muted">Références de marchés déjà exécutés (facultatif).</p>
            {form.references.map((r, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 rounded-md border border-line p-2">
                <input placeholder="Objet du marché" value={r.marketTitle} onChange={(e) => update("references", form.references.map((x, j) => (j === i ? { ...x, marketTitle: e.target.value } : x)))} className="input col-span-2" />
                <input placeholder="Client" value={r.clientName} onChange={(e) => update("references", form.references.map((x, j) => (j === i ? { ...x, clientName: e.target.value } : x)))} className="input" />
                <input placeholder="Année" type="number" value={r.year ?? ""} onChange={(e) => update("references", form.references.map((x, j) => (j === i ? { ...x, year: Number(e.target.value) } : x)))} className="input" />
              </div>
            ))}
            <button type="button" className="text-xs text-brand hover:underline" onClick={() => update("references", [...form.references, { marketTitle: "", clientName: "", year: undefined, amount: undefined }])}>
              + Ajouter une référence
            </button>
          </div>
        )}

        {step === 7 && (
          <Field label="Mots-clés de marchés recherchés (séparés par des virgules)">
            <input
              placeholder="informatique, réseau, développement logiciel"
              onChange={(e) => update("targetCategories", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              className="input"
            />
          </Field>
        )}

        {step === 8 && (
          <Field label="Zones déjà sélectionnées à l'étape Localisation">
            <div className="flex flex-wrap gap-1.5">
              {form.zoneRegionNames.length === 0 ? <p className="text-xs text-ink-faint">Aucune zone — recherche nationale par défaut.</p> : form.zoneRegionNames.map((z) => <Chip key={z} active>{z}</Chip>)}
            </div>
          </Field>
        )}

        {step === 9 && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Montant minimum ciblé (FCFA)">
              <input type="number" onChange={(e) => update("budgetMin", e.target.value ? Number(e.target.value) : undefined)} className="input" />
            </Field>
            <Field label="Montant maximum ciblé (FCFA)">
              <input type="number" onChange={(e) => update("budgetMax", e.target.value ? Number(e.target.value) : undefined)} className="input" />
            </Field>
          </div>
        )}

        {step === 10 && (
          <div className="space-y-3">
            <Field label="Canaux d'alerte">
              <div className="flex flex-wrap gap-1.5">
                {["APP", "EMAIL", "WHATSAPP", "PUSH"].map((c) => (
                  <Chip key={c} active={form.alertChannels.includes(c)} onClick={() => toggleInArray("alertChannels", c)}>
                    {c}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="Fréquence du briefing">
              <select value={form.alertFrequency} onChange={(e) => update("alertFrequency", e.target.value as "QUOTIDIEN" | "HEBDOMADAIRE")} className="input">
                <option value="QUOTIDIEN">Quotidien</option>
                <option value="HEBDOMADAIRE">Hebdomadaire</option>
              </select>
            </Field>
          </div>
        )}

        {step === 11 && (
          <div className="space-y-3">
            <p className="text-sm text-ink-muted">Vérifiez votre profil avant de découvrir vos premières recommandations.</p>
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> {form.companyName || "—"} · {form.size}</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> {form.sectorIds.length} secteur(s) sélectionné(s)</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Siège : {form.regionName} · {form.zoneRegionNames.length || "toutes les"} zone(s) d&apos;intervention</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Alertes : {form.alertChannels.join(", ") || "aucune"} ({form.alertFrequency.toLowerCase()})</li>
            </ul>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Button variant="ghost" disabled={step === 0 || pending} onClick={() => setStep((s) => s - 1)}>
          Précédent
        </Button>
        {step < STEPS.length - 1 ? (
          <Button variant="primary" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            Suivant
          </Button>
        ) : (
          <Button variant="primary" disabled={pending} onClick={submit}>
            {pending ? "Création du profil…" : "Voir mes premières recommandations"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  );
}

function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs",
        active ? "border-brand bg-brand-soft text-brand" : "border-line text-ink-muted hover:bg-surface-elevated",
      )}
    >
      {children}
    </button>
  );
}

function groupLabel(group: string) {
  return { FOURNITURES_SERVICES: "Fournitures et services courants", TRAVAUX: "Travaux", PRESTATIONS_INTELLECTUELLES: "Prestations intellectuelles" }[group] ?? group;
}
