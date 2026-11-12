import { BackButton } from "@/components/back-button";
import { RequestTaskForm } from "@/components/request-task-form";
import { ServiceOrderForm } from "@/components/service-order-form";

export default async function RequestTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string; listing?: string; service?: string }>;
}) {
  const { provider, listing, service } = await searchParams;
  const serviceIndex = Number(service);
  // Opened from a service's "+" button on a lapak page: order that service.
  const isServiceOrder = Boolean(listing) && Number.isInteger(serviceIndex) && serviceIndex >= 0;
  const fallbackHref = listing ? `/market/${encodeURIComponent(listing)}` : provider ? `/penyedia/${encodeURIComponent(provider)}` : "/dashboard";

  return (
    <div className="-mx-4 -my-7 min-h-[calc(100dvh+3.5rem)] bg-[#34A4F2] px-4 pb-28 pt-7 sm:-mx-6 sm:-my-10 sm:px-6 lg:-mx-10 lg:px-10 lg:pb-12">
      <header className="mx-auto mb-8 max-w-6xl">
        <BackButton
          fallbackHref={fallbackHref}
          className="grid size-11 cursor-pointer place-items-center rounded-full bg-white/95 text-slate-900 shadow-lg transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
        />
        <h1 className="mt-2 max-w-2xl font-[var(--font-manrope)] text-3xl font-extrabold tracking-tight text-white md:text-5xl">
          {isServiceOrder ? "Pesan Jasa" : "Buat Taskmu Sekarang!"}
        </h1>
      </header>
      <div className="mx-auto max-w-6xl">
        {isServiceOrder && listing ? <ServiceOrderForm listingId={listing} serviceIndex={serviceIndex} /> : <RequestTaskForm providerId={provider} />}
      </div>
    </div>
  );
}
