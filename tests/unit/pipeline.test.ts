import { describe, it, expect } from "vitest";
import { guessNumeroFromFilename } from "@/lib/ingestion/pipeline";

describe("guessNumeroFromFilename", () => {
  it("lit le numéro après le mot « quotidien »", () => {
    expect(guessNumeroFromFilename("Quotidien_n_4485.pdf")).toBe("4485");
    expect(guessNumeroFromFilename("quotidien-4477.pdf")).toBe("4477");
  });

  it("ignore un préfixe de hash/horodatage ajouté par un widget de dépôt", () => {
    // Cas réel constaté : le nom de fichier tel qu'uploadé par le navigateur
    // conserve un préfixe numérique (ex. hash) devant le nom d'origine —
    // une simple recherche du premier groupe de chiffres capterait "8808"
    // au lieu du vrai numéro du quotidien.
    expect(guessNumeroFromFilename("c8808c3b-Quotidien_N_4483.pdf")).toBe("4483");
    expect(guessNumeroFromFilename("1757570362-Quotidien_n_4486_0.pdf")).toBe("4486");
  });

  it("gère un numéro double (numéro-numéro)", () => {
    expect(guessNumeroFromFilename("quotidien-4473-4474.pdf")).toBe("4473-4474");
  });

  it("retombe sur le dernier groupe de chiffres si « quotidien » est absent du nom", () => {
    expect(guessNumeroFromFilename("a1b2c3-4485.pdf")).toBe("4485");
  });

  it("retombe sur un identifiant horodaté si aucun chiffre exploitable n'est trouvé", () => {
    expect(guessNumeroFromFilename("document-sans-numero.pdf")).toMatch(/^manuel-\d+$/);
  });
});
