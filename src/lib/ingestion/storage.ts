// Stockage brut (section 41 — « Raw data »). Implémentation disque local,
// isolée derrière une interface simple pour permettre un provider objet
// (S3-compatible) en production sans changer les appelants.
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const RAW_DIR = path.join(process.cwd(), "storage", "raw");

export interface RawStorage {
  save(filename: string, content: Buffer): Promise<{ path: string; hash: string; sizeBytes: number }>;
}

class LocalRawStorage implements RawStorage {
  async save(filename: string, content: Buffer) {
    await fs.mkdir(RAW_DIR, { recursive: true });
    const hash = crypto.createHash("sha256").update(content).digest("hex");
    const safeName = `${hash.slice(0, 12)}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const fullPath = path.join(RAW_DIR, safeName);
    await fs.writeFile(fullPath, content);
    return { path: fullPath, hash, sizeBytes: content.byteLength };
  }
}

export function getRawStorage(): RawStorage {
  return new LocalRawStorage();
}
