// Extraction PDF → texte, avec repli OCR (section 40, 94).
// « Retry automatique → OCR → fallback parser → validation humaine » :
// aucun document ne doit être silencieusement perdu.
import "./pdf-canvas-polyfill";
import fs from "node:fs";
import path from "node:path";
import { PDFParse } from "pdf-parse";
import { createWorker, OEM } from "tesseract.js";

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
  } catch (err) {
    // Jamais de perte silencieuse (section 94) : un échec d'extraction texte
    // doit être visible dans les logs serveur, pas seulement se traduire en
    // repli OCR indisponible côté appelant.
    console.error("[extractPdfText] échec de l'extraction texte, repli OCR :", err);
    return runOcrFallback(buffer);
  }
}

// Modèle français embarqué dans le dépôt (tessdata/fra.traineddata.gz,
// ~600 Ko) plutôt que téléchargé à l'exécution depuis le CDN par défaut de
// Tesseract.js — un quotidien scanné doit pouvoir être traité même si
// l'hébergement bloque ou limite les accès réseau sortants au moment de
// l'exécution (constaté par ailleurs sur cet hébergement pour d'autres
// dépendances, section pdf-canvas-polyfill.ts). Dossier source, jamais
// écrit à l'exécution.
const TESSDATA_LANG_DIR = path.join(process.cwd(), "tessdata");
// Tesseract.js décompresse le modèle au premier usage et met en cache la
// version décompressée à côté — dans un dossier distinct et ignoré de git
// (storage/, comme le reste des données écrites à l'exécution) pour ne
// jamais polluer le dossier source versionné ci-dessus.
const TESSDATA_CACHE_DIR = path.join(process.cwd(), "storage", "tessdata-cache");

/**
 * Repli OCR pour les quotidiens numérisés (page scannée, sans couche de
 * texte exploitable par pdf-parse) : chaque page est d'abord rendue en
 * image (PDFParse.getScreenshot, qui s'appuie sur @napi-rs/canvas déjà
 * utilisé en interne par pdf-parse — aucune nouvelle dépendance de rendu),
 * puis reconnue par Tesseract.
 *
 * Best-effort et strictement sans régression : si le rendu image ou
 * Tesseract lui-même échoue (ex. @napi-rs/canvas indisponible sur un
 * hébergement donné), on retombe sur l'échec déjà existant avant l'ajout de
 * l'OCR plutôt que de faire planter tout le dépôt (section 94).
 */
async function runOcrFallback(buffer: Buffer): Promise<ExtractionResult> {
  let images: { pageNumber: number; data: Buffer }[];
  try {
    const parser = new PDFParse({ data: buffer });
    const screenshots = await parser.getScreenshot({ scale: 2, imageDataUrl: false, imageBuffer: true });
    await parser.destroy();
    images = screenshots.pages.map((p) => ({ pageNumber: p.pageNumber, data: Buffer.from(p.data) }));
  } catch (err) {
    console.error("[extractPdfText] rendu image impossible, OCR indisponible :", err);
    return { pages: [], method: "failed" };
  }

  if (images.length === 0) return { pages: [], method: "failed" };

  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  try {
    fs.mkdirSync(TESSDATA_CACHE_DIR, { recursive: true });
    worker = await createWorker("fra", OEM.LSTM_ONLY, { langPath: TESSDATA_LANG_DIR, cachePath: TESSDATA_CACHE_DIR });
    const pages: PageText[] = [];
    for (const image of images) {
      const { data } = await worker.recognize(image.data);
      pages.push({ pageNumber: image.pageNumber, text: data.text ?? "", confidence: (data.confidence ?? 0) / 100 });
    }
    if (pages.every((p) => p.text.trim().length === 0)) return { pages: [], method: "failed" };
    return { pages, method: "ocr" };
  } catch (err) {
    console.error("[extractPdfText] échec Tesseract, OCR indisponible :", err);
    return { pages: [], method: "failed" };
  } finally {
    await worker?.terminate().catch(() => {});
  }
}
