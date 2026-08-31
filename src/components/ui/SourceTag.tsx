import { FileText } from "lucide-react";
import Link from "next/link";

// Traçabilité obligatoire : Source → Publication → Quotidien → Page → Document (section 2.1).
export function SourceTag({
  numero,
  page,
  documentId,
  publishedAt,
}: {
  numero?: string | null;
  page?: number | null;
  documentId?: string | null;
  publishedAt?: string | Date | null;
}) {
  if (!numero && !documentId) return null;
  const label = [
    numero ? `Quotidien n°${numero}` : null,
    page ? `p.${page}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const content = (
    <span className="inline-flex items-center gap-1 text-[11px] text-ink-faint hover:text-brand">
      <FileText className="h-3 w-3" />
      Source : {label || "document officiel"}
      {publishedAt ? ` — ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(publishedAt))}` : ""}
    </span>
  );

  if (!documentId) return content;
  return <Link href={`/documents/${documentId}`}>{content}</Link>;
}
