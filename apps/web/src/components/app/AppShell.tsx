"use client";

import React, { Suspense, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { getAppT } from "@/lib/i18n/app";
import { DashboardTopbar } from "@/components/app/DashboardTopbar";
import { DashboardSidebar } from "@/components/app/DashboardSidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const params = useParams<{ lang: string }>();
  const router = useRouter();

  const currentLang = useMemo<Lang>(() => normalizeLang(params?.lang), [params?.lang]);
  const t = useMemo(() => getAppT(currentLang), [currentLang]);

  function logout() {
    localStorage.removeItem("ls_token");
    router.push(`/${currentLang}/login`);
  }

  return (
    <div className="min-h-screen ls-bg">
      <DashboardTopbar
        appName={t("appName")}
        companyName={t("demoCompany")}
        onLogout={logout}
      />

      <div className="grid min-h-[calc(100vh-78px)] grid-cols-1 lg:grid-cols-[292px_minmax(0,1fr)] gap-0">
        <Suspense
          fallback={
            <aside className="hidden lg:block border-r border-black/5 bg-white/65 px-4 py-5">
              <div className="ls-nav-card min-h-[calc(100vh-118px)] p-4" />
            </aside>
          }
        >
          <DashboardSidebar />
        </Suspense>

        <main className="min-w-0 px-5 py-5 lg:px-6 lg:py-6 xl:px-7 xl:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
