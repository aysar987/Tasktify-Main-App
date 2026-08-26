"use client";

import { LoaderCircle } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      else setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
      else setReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, [pathname, router]);

  if (!ready) {
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Image src="/images/icon-tasktify.svg" alt="Tasktify" width={64} height={64} priority className="size-16 rounded-2xl shadow-md" />
          <div className="flex items-center gap-3 font-semibold text-slate-600">
            <LoaderCircle className="size-5 animate-spin text-orange-600" /> Memeriksa sesi...
          </div>
        </div>
      </main>
    );
  }
  return children;
}
