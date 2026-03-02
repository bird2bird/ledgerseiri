"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/i18n/lang";
import { footerDict } from "@/lib/i18n/footer";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

export default function MarketingFooter({ lang }: { lang: Lang }) {
  const t = footerDict[lang] ?? footerDict.ja;
  const year = new Date().getFullYear();

  const href = useMemo(() => {
    return {
      support: `/${lang}/support`,
      commerce: `/${lang}/commerce`,
      terms: `/${lang}/terms`,
      privacy: `/${lang}/privacy`,
    };
  }, [lang]);

  // freee-like structure, but LP-consistent skin; no 採用情報 / アクセシビリティ
  return (
    <footer className="mt-16 border-t border-black/5 bg-white/70 backdrop-blur">
      <div className="mx-auto max-w-7xl px-5 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#2b5cff] text-white grid place-items-center font-black">
                LS
              </div>
              <div className="leading-tight">
                <div className="text-sm font-bold text-slate-900">LedgerSeiri</div>
                <div className="text-xs text-slate-500">{t.company.name}</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">{t.company.addr}</div>
          </div>

          <div className="flex items-center gap-3 md:justify-end">
            <a
              href="#"
              aria-label={t.social.facebook}
              className={cn(
                "h-10 w-10 rounded-full border border-black/10 bg-white shadow-sm",
                "grid place-items-center text-slate-700 hover:bg-black/[0.03] active:scale-[0.99]"
              )}
            >
              f
            </a>
            <a
              href="#"
              aria-label={t.social.youtube}
              className={cn(
                "h-10 w-10 rounded-full border border-black/10 bg-white shadow-sm",
                "grid place-items-center text-slate-700 hover:bg-black/[0.03] active:scale-[0.99]"
              )}
            >
              ▶
            </a>
            <a
              href="#"
              aria-label={t.social.x}
              className={cn(
                "h-10 w-10 rounded-full border border-black/10 bg-white shadow-sm",
                "grid place-items-center text-slate-700 hover:bg-black/[0.03] active:scale-[0.99]"
              )}
            >
              𝕏
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-black/5 pt-6">
          <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold text-slate-700">
            <Link className="hover:text-slate-900" href={href.support}>{t.links.support}</Link>
            <Link className="hover:text-slate-900" href={href.commerce}>{t.links.commerce}</Link>
            <Link className="hover:text-slate-900" href={href.terms}>{t.links.terms}</Link>
            <Link className="hover:text-slate-900" href={href.privacy}>{t.links.privacy}</Link>
          </nav>

          <div className="mt-6 text-center text-xs text-slate-500">
            {t.copyright(year)}
          </div>
        </div>
      </div>
    </footer>
  );
}
