// Extraction PDF → texte, avec repli OCR (section 40, 94).
// « Retry automatique → OCR → fallback parser → validation humaine » :
// aucun document ne doit être silencieusement perdu.
import { PDFParse } from "pdf-parse";

export type PageText = { pageNumber: number; text: string; confidence: number };
export type ExtractionResult = { pages: PageText[]; method: "pdf-text" | "ocr" | "failed" };

export async function extractPdfText(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();

    const pages: PageText[] = (result.pages ?? []).map((p, i) => ({
      pageNumber: i + 1,
      text: p.text ?? "",
      confidence: 0.97,
    }));

    if (pages.length === 0 || pages.every((p) => p.text.trim().length === 0)) {
      return runOcrFallback(buffer);
    }
    return { pages, method: "pdf-text" };
  } catch {
    return runOcrFallback(buffer);
  }
}

/**
 * Repli OCR — aucun moteur OCR n'est installé dans cet environnement de
 * démonstration (Tesseract, etc. alourdiraient le bac à sable). L'interface
 * est prête : brancher un moteur réel ici ne change aucun appelant.
 */
async function runOcrFallback(_buffer: Buffer): Promise<ExtractionResult> {
  return { pages: [], method: "failed" };
}
