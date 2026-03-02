"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageMenuLP from "@/components/LanguageMenuLP";

type Lang = "ja" | "en" | "zh-CN" | "zh-TW";

export type MarketingNav = {
  features: string;
  pricing: string;
  resources: string;
  usecases: string;
  cases: string;
  support: string;
  login: string;
  trial: string;
};

type ActiveKey = "features" | "pricing" | "resources" | "usecases" | "cases" | "support" | "none" | "auto";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

export default function MarketingTopBar({
  lang,
  nav,
  active = "auto",
  subtitle,
}: {
  lang: Lang;
  nav: MarketingNav;
  active?: ActiveKey;
  subtitle?: string;
}) {
  const pathname = usePathname() || "";

  const activeKey = useMemo<Exclude<ActiveKey, "auto">>(() => {
    if (active !== "auto") return active;
    // pathname: "/zh-CN/pricing" -> seg="pricing"
    const seg = pathname.split("/").filter(Boolean)[1] || "";
    const map: Record<string, Exclude<ActiveKey, "auto">> = {
      features: "features",
      pricing: "pricing",
      resources: "resources",
      usecases: "usecases",
      cases: "cases",
      support: "support",
    };
    return map[seg] ?? "none";
  }, [active, pathname]);

  const href = {
    features: `/${lang}/features`,
    pricing: `/${lang}/pricing`,
    resources: `/${lang}/resources`,
    usecases: `/${lang}/usecases`,
    cases: `/${lang}/cases`,
    support: `/${lang}/support`,
    login: `/${lang}/login`,
    trial: `/${lang}/register`,
    home: `/${lang}`,
  };

  const Item = ({ k, label }: { k: Exclude<ActiveKey, "none" | "auto">; label: string }) => {
    const isActive = activeKey === k;
    return (
      <Link
        href={href[k]}
        className={cn(
          "h-9 px-3 inline-flex items-center rounded-full text-sm font-semibold transition",
          isActive ? "bg-black/[0.06] text-slate-900" : "text-slate-700 hover:bg-black/[0.04]"
        )}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/75 backdrop-blur">
      <div className="mx-auto max-w-7xl px-5">
        <div className="h-16 flex items-center gap-4">
          {/* Left: Brand */}
          <Link href={href.home} className="flex items-center gap-3 shrink-0">
            <div className="h-10 w-10 rounded-2xl bg-[#2b5cff] text-white grid place-items-center font-black">
              LS
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-slate-900">LedgerSeiri</div>
              <div className="text-xs text-slate-500">{subtitle ?? "Official"}</div>
            </div>
          </Link>

          {/* Center: LP-style pill menu (centered, never overlap right) */}
          <div className="flex-1 min-w-0 flex justify-center">
            <nav className="max-w-[560px] w-full">
              <div className="mx-auto w-fit rounded-full border border-black/10 bg-white shadow-sm px-2 py-1 flex items-center gap-1">
                <Item k="features" label={nav.features} />
                <Item k="pricing" label={nav.pricing} />
                <Item k="resources" label={nav.resources} />
                <Item k="usecases" label={nav.usecases} />
                <Item k="cases" label={nav.cases} />
                <Item k="support" label={nav.support} />
              </div>
            </nav>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0">
            <LanguageMenuLP current={lang} />
            <Link
              href={href.login}
              className="h-10 px-4 inline-flex items-center rounded-full border border-black/[0.10] bg-white text-sm font-semibold text-slate-900 shadow-sm hover:bg-black/[0.03] active:scale-[0.99]"
            >
              {nav.login}
            </Link>
            <Link
              href={href.trial}
              className="h-10 px-4 inline-flex items-center rounded-full bg-[#ff1b55] text-sm font-semibold text-white shadow-sm hover:opacity-95 active:scale-[0.99]"
            >
              {nav.trial}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
