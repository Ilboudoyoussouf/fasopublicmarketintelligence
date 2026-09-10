import { cn } from "@/lib/utils";
import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand/90 border-brand",
  secondary: "bg-paper text-ink border-line-strong hover:bg-paper-sunken",
  ghost: "bg-transparent text-ink-muted border-transparent hover:bg-paper-sunken",
  danger: "bg-critical text-white hover:bg-critical/90 border-critical",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "text-xs px-2.5 py-1.5",
  md: "text-sm px-3.5 py-2",
};

const base = "inline-flex items-center justify-center gap-1.5 rounded-lg border font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button className={cn(base, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)} {...props} />;
}

export function LinkButton({
  variant = "secondary",
  size = "md",
  className,
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; size?: Size; href: string }) {
  return <Link href={href} className={cn(base, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)} {...props} />;
}
