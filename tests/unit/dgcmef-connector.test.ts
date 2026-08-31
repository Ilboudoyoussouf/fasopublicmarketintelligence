import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { parseListingHtml } from "@/lib/ingestion/connectors/dgcmef";

const fixture = readFileSync(
  path.join(__dirname, "../../src/lib/ingestion/fixtures/dgcmef-listing.sample.html"),
  "utf-8",
);

describe("connecteur DGCMEF — parsing de la liste des quotidiens (Annexe D)", () => {
  const publications = parseListingHtml(fixture, "https://www.dgcmef.gov.bf");

  it("détecte les 5 publications de l'échantillon", () => {
    expect(publications.map((p) => p.numero).sort()).toEqual(["4468", "4473-4474", "4475", "4476", "4477"].sort());
  });

  it("reconnaît le numéro double 4473-4474 comme une seule publication", () => {
    const double = publications.find((p) => p.numero === "4473-4474");
    expect(double?.isDoubleIssue).toBe(true);
    expect(double?.documents).toHaveLength(1);
  });

  it("regroupe le fichier principal et le fichier bis du n°4468", () => {
    const n4468 = publications.find((p) => p.numero === "4468");
    expect(n4468?.documents).toHaveLength(2);
    expect(n4468?.documents.some((d) => d.isBis)).toBe(true);
    expect(n4468?.documents.some((d) => d.isPrincipal)).toBe(true);
  });

  it("résout les URLs de documents en URLs absolues", () => {
    for (const pub of publications) {
      for (const doc of pub.documents) {
        expect(doc.url.startsWith("https://www.dgcmef.gov.bf/")).toBe(true);
      }
    }
  });
});
