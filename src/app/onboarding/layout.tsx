export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper-sunken">
      <header className="flex h-14 items-center gap-2 border-b border-line bg-paper px-6">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-xs font-bold text-white">FP</div>
        <span className="text-sm font-semibold text-ink">FASO Market Intelligence</span>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
    </div>
  );
}
