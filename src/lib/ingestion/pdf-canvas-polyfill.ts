// pdfjs-dist (utilisé en interne par pdf-parse) référence au chargement du
// module des API canvas navigateur (DOMMatrix, ImageData, Path2D), même en
// « legacy build » Node, pour son rendu optionnel — jamais utilisé ici,
// seule l'extraction de texte (getText()) l'est. Sans polyfill, l'import
// seul fait planter tout runtime Node dépourvu de @napi-rs/canvas (cas de
// l'hébergement Node.js Hostinger) avec `ReferenceError: DOMMatrix is not
// defined`. À importer AVANT "pdf-parse" — les imports statiques s'exécutent
// dans l'ordre du fichier, avant tout code non-import.
/* eslint-disable @typescript-eslint/no-explicit-any */
const g = globalThis as any;
if (typeof g.DOMMatrix === "undefined") g.DOMMatrix = class DOMMatrixPolyfill {};
if (typeof g.ImageData === "undefined") g.ImageData = class ImageDataPolyfill {};
if (typeof g.Path2D === "undefined") g.Path2D = class Path2DPolyfill {};
