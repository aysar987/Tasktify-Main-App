import { ArrowLeft, Star } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Provider } from "@/types";

export const buttonPrimary =
  "flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700 active:scale-[.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50";

export const buttonSecondary =
  "flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-600 bg-white px-4 py-3 font-bold text-blue-700 transition hover:bg-blue-50 active:scale-[.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200";

export const fieldClass =
  "min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100";

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  const sizes = {
    sm: "size-9 text-xs",
    md: "size-11 text-sm",
    lg: "size-20 text-xl",
  };
  return (
    <div
      aria-hidden="true"
      className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-800 font-bold text-white`}
    >
      {initials}
    </div>
  );
}

export function Topbar({
  title,
  onBack,
  action,
}: {
  title: string;
  onBack?: () => void;
  action?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 bg-slate-50/95 px-5 py-3 backdrop-blur">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Kembali"
          className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-white text-slate-800 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
        >
          <ArrowLeft className="size-5" />
        </button>
      )}
      <h1 className="flex-1 text-lg font-bold text-slate-950">{title}</h1>
      {action}
    </header>
  );
}

export function ProviderCard({
  provider,
  onClick,
}: {
  provider: Provider;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-w-0 cursor-pointer rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
    >
      <div className="mb-3 flex h-20 items-center justify-center rounded-xl bg-blue-50">
        <Avatar name={provider.name} size="lg" />
      </div>
      <strong className="block truncate text-sm text-slate-950">
        {provider.name}
      </strong>
      <span className="mt-1 block truncate text-xs text-slate-500">
        {provider.role}
      </span>
      <span className="mt-2 flex items-center gap-1 text-xs font-bold text-amber-600">
        <Star className="size-3.5 fill-current" /> {provider.rating.toFixed(1)}
      </span>
    </button>
  );
}

export function ActionButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${buttonPrimary} ${className}`} {...props}>
      {children}
    </button>
  );
}
