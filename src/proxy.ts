import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/reinitialisation",
  "/conditions-utilisation",
  "/confidentialite",
  "/verification-email",
  "/aide",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/api/auth") ||
    // Le robot d'ingestion quotidien (cron Vercel) s'authentifie par
    // CRON_SECRET dans son propre handler, pas par session utilisateur.
    pathname.startsWith("/api/cron/") ||
    pathname === "/";

  if (!req.auth && !isPublic) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    const url = new URL("/connexion", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (req.auth && (pathname === "/connexion" || pathname === "/inscription")) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
