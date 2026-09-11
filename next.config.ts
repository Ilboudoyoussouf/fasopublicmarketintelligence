import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Les quotidiens DGCMEF déposés manuellement (import PDF, section admin)
    // pèsent plusieurs Mo (33 pages ou plus) — au-delà de la limite par
    // défaut (1 Mo) des Server Actions.
    serverActions: { bodySizeLimit: "15mb" },
  },
  // pdf-parse (pdfjs-dist) résout dynamiquement son fichier worker
  // (pdf.worker.mjs) par un chemin relatif à son propre module — le bundler
  // (Turbopack/webpack) casse ce chemin en regroupant tout dans un chunk
  // unique ("Setting up fake worker failed"). Exclure le package du bundling
  // serveur préserve son arborescence réelle dans node_modules.
  // tesseract.js (repli OCR, extract-text.ts) fait de même : son worker
  // Node tourne dans un vrai `worker_threads.Worker(workerPath)`, qui exige
  // un fichier réel sur disque au chemin attendu — même risque de rupture
  // si le bundler le déplace.
  serverExternalPackages: ["pdf-parse", "tesseract.js"],
};

export default nextConfig;
