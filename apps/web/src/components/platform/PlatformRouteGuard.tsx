"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchPlatformProtected,
  getPlatformAccessToken,
  isPlatformUnauthorizedError,
} from "@/core/platform-auth/client";

export function PlatformRouteGuard({ lang }: { lang: string }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;

    async function run() {
      const token = getPlatformAccessToken();
      if (!token) {
        router.replace(`/${lang}/platform-auth/login`);
        return;
      }

      try {
        await fetchPlatformProtected(token);
        if (alive) setChecking(false);
      } catch (e) {
        if (isPlatformUnauthorizedError(e)) {
          router.replace(`/${lang}/platform-auth/login`);
          return;
        }
        if (alive) setChecking(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [lang, router]);

  if (!checking) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/35 backdrop-blur-[2px]">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-sm text-slate-200 shadow-2xl">
        Checking platform access…
      </div>
    </div>
  );
}
