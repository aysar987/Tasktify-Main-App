"use client";

import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-white px-6 py-10 font-[var(--font-poppins)] md:px-8 md:py-16">
      <div className="absolute left-6 top-5 hidden md:block lg:left-10 lg:top-8">
        <Image
          src="/images/wordmark-tasktify.svg"
          alt="Tasktify."
          width={140}
          height={39}
          priority
          className="h-[39px] w-[140px] object-contain object-left"
        />
      </div>
      <div className="w-full max-w-[420px] md:rounded-[32px] md:border-2 md:border-[#4A90E2] md:bg-white md:p-8 md:shadow-[6px_8px_0_rgba(0,0,0,0.2)]">
        {children}
      </div>
    </main>
  );
}
