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
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
