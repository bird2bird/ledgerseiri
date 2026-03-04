"use client";

import React, { useMemo } from "react";
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
      <DashboardTopbar appName={t("appName")} companyName={t("demoCompany")} onLogout={logout} />

      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-4 py-7 items-stretch">
        <DashboardSidebar t={t} />
        <main className="col-span-12 lg:col-span-9 space-y-5">{children}</main>
      </div>
    </div>
  );
}
