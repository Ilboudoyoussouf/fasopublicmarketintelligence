import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-sunken px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-sm font-bold text-white">FP</div>
          <span className="text-sm font-semibold text-ink">FASO Market Intelligence</span>
        </Link>
        <div className="rounded-xl border border-line bg-paper p-6 shadow-sm">{children}</div>
        <p className="mt-4 text-center text-[11px] text-ink-faint">
          Les informations proviennent de sources officielles et sont restructurées à des fins de veille et d&apos;analyse.
          Voir <Link href="/conditions-utilisation" className="underline">Conditions d&apos;utilisation</Link> et{" "}
          <Link href="/confidentialite" className="underline">Politique de confidentialité</Link>.
        </p>
      </div>
    </div>
  );
}
