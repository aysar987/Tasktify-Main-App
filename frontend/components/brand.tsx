import Image from "next/image";
import Link from "next/link";

export function Brand({ compact = false, showLogo = true }: { compact?: boolean; showLogo?: boolean }) {
  return (
    <Link
      href="/dashboard"
      aria-label="Tasktify — buka dashboard"
      className="inline-flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200"
    >
      {showLogo && (
        <Image
          src="/images/logo-tasktify.svg"
          alt=""
          width={391}
          height={335}
          priority
          className="h-10 w-auto shrink-0"
        />
      )}
      {!compact && (
        <Image
          src="/images/wordmark-tasktify.svg"
          alt="Tasktify"
          width={511}
          height={131}
          priority
          className="h-7 w-auto"
        />
      )}
    </Link>
  );
}
