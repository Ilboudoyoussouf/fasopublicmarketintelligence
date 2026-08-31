import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    testTimeout: 20000,
    // Les tests d'intégration partagent l'état du tenant de démonstration en
    // base réelle (pas de mocks Prisma) : exécution séquentielle des fichiers
    // pour éviter les conditions de course entre suites.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
