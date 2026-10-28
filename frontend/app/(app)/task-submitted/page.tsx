import Image from "next/image";
import Link from "next/link";

const planeIllustrationClass =
  "pointer-events-none absolute right-0 top-0 z-0 h-[170vw] w-auto max-w-none object-contain md:right-[calc(50%-200px)] md:h-[82%]";

const buttonClass =
  "inline-flex min-h-12 items-center justify-center rounded-xl px-6 py-3 font-[var(--font-poppins)] font-semibold shadow-[0_4px_6px_rgba(0,0,0,0.25)] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#3F93F5]/40 active:translate-y-0.5";

export default function TaskSubmittedPage() {
  return (
    <section className="-mx-4 -mt-7 -mb-[calc(6rem+env(safe-area-inset-bottom))] flex min-h-dvh items-center justify-center overflow-hidden bg-white px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:-mx-6 sm:-mb-7 sm:px-6 lg:-mx-10 lg:-mt-10 lg:-mb-10 lg:px-10 lg:pb-0">
      <Image
        src="/images/task-submitted-plane.png"
        alt=""
        aria-hidden="true"
        width={871}
        height={1281}
        priority
        className={planeIllustrationClass}
      />
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center">
        <h1 className="whitespace-nowrap font-[var(--font-poppins)] text-[clamp(1.25rem,4.5vw,4rem)] font-bold leading-none text-[#3F93F5]">
          Taskmu Berhasil Terkirim!
        </h1>
        <p className="mt-1 font-[var(--font-poppins)] text-[clamp(0.9rem,2.1vw,1.8rem)] font-medium leading-tight text-[#3F93F5]">
          kami sedang mencari ahlinya
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <Link
            href="/activity"
            className={`${buttonClass} bg-[#3F93F5] text-white hover:bg-[#2879D8]`}
          >
            Pantau aktifitas
          </Link>
          <Link
            href="/market"
            className={`${buttonClass} border-[1.5px] border-[#8DC2F3] bg-[#D6E9FD] text-[#2879D8] hover:bg-[#C4DFFC]`}
          >
            Marketplace
          </Link>
        </div>
      </div>
    </section>
  );
}
