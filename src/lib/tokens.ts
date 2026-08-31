import jwt from "jsonwebtoken";

const SECRET = process.env.AUTH_SECRET ?? "dev-secret";

export function createActionToken(purpose: "verify-email" | "reset-password", email: string, expiresInMinutes = 60 * 24) {
  return jwt.sign({ purpose, email }, SECRET, { expiresIn: `${expiresInMinutes}m` });
}

export function readActionToken(token: string, purpose: "verify-email" | "reset-password"): { email: string } | null {
  try {
    const payload = jwt.verify(token, SECRET) as { purpose: string; email: string };
    if (payload.purpose !== purpose) return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}
