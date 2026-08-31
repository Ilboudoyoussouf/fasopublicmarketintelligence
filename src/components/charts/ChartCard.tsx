import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Download } from "lucide-react";
import type { ReactNode } from "react";

// Règles de visualisation obligatoires — section 25 : titre, période, unité,
// source, date de mise à jour, export. « Un graphique sans source ou période
// est interdit. »
export function ChartCard({
  title,
  period,
  unit,
  source,
  updatedAt,
  action,
  children,
  height = 260,
}: {
  title: string;
  period: string;
  unit?: string;
  source: string;
  updatedAt?: string;
  action?: ReactNode;
  children: ReactNode;
  height?: number;
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="text-[11px] text-ink-faint">
            {period}
            {unit ? ` · ${unit}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {action}
          <button type="button" className="rounded-md p-1.5 text-ink-faint hover:bg-paper-sunken" aria-label="Exporter">
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </CardHeader>
      <CardBody>
        <div style={{ height }}>{children}</div>
        <p className="mt-2 text-[11px] text-ink-faint">
          Source : {source}
          {updatedAt ? ` · Mise à jour : ${updatedAt}` : ""}
        </p>
      </CardBody>
    </Card>
  );
}
