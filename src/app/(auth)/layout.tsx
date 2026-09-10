import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-sunken px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-brand text-sm font-bold text-white">FP</div>
          <span className="text-base font-semibold text-ink">
            Intelligence des
            <br />
            marchés publics
          </span>
        </Link>
        <div className="rounded-[var(--radius-lg)] border border-line bg-paper p-6">{children}</div>
        <p className="mt-4 text-center text-[11px] text-ink-faint">
          Les informations proviennent de sources officielles et sont restructurées à des fins de veille et d&apos;analyse.
          Voir <Link href="/conditions-utilisation" className="underline">Conditions d&apos;utilisation</Link> et{" "}
          <Link href="/confidentialite" className="underline">Politique de confidentialité</Link>.
        </p>
      </div>
    </div>
  );
}
