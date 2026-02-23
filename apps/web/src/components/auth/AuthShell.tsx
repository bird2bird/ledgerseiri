"use client";

import Link from "next/link";
import React from "react";
import type { Lang } from "@/lib/i18n/lang";
import { LANGS } from "@/lib/i18n/lang";
import { authDict } from "@/lib/i18n/auth";
import { usePathname, useRouter } from "next/navigation";

function labelFor(lang: Lang, t: ReturnType<typeof authDict>) {
  if (lang === "ja") return t.langJA;
  if (lang === "en") return t.langEN;
  if (lang === "zh-CN") return t.langZHCN;
  return t.langZHTW;
}

export function AuthShell({
  lang,
  title,
  subtitle,
  children,
}: {
  lang: Lang;
  title: string;
  subtitle: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = authDict(lang);
  const router = useRouter();
  const pathname = usePathname();

  function switchTo(target: Lang) {
    try {
      localStorage.setItem("ls_lang", target);
      document.cookie = `ls_lang=${encodeURIComponent(target)}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
    } catch {}
    // Keep same route name when switching language
    const parts = pathname.split("/");
    // pathname like /ja/login...
    if (parts.length > 2) {
      parts[1] = target;
      router.push(parts.join("/"));
    } else {
      router.push(`/${target}/login`);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link href={`/${lang}`} className="inline-flex items-center gap-3 no-underline">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-semibold">LS</div>
            <div className="leading-tight">
              <div className="font-semibold text-slate-900">LedgerSeiri</div>
              <div className="text-xs text-slate-500">{t.brandSub}</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-500">{t.langLabel}:</div>
            <div className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-1">
              {LANGS.map((x) => (
                <button
                  key={x}
                  onClick={() => switchTo(x)}
                  className={
                    "text-sm px-2 py-0.5 rounded-lg " +
                    (x === lang ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100")
                  }
                  type="button"
                >
                  {labelFor(x, t)}
                </button>
              ))}
            </div>

            <Link href={`/${lang}/help`} className="text-sm text-slate-600 hover:underline">ヘルプ</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mx-auto max-w-xl rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900 text-center">{title}</h1>
          <div className="mt-2 text-center text-slate-600">{subtitle}</div>
          <div className="mt-8">{children}</div>
        </div>

        <div className="mt-10 text-center text-sm text-slate-500">
          <Link href={`/${lang}/privacy`} className="hover:underline">{t.footerPrivacy}</Link>
          <span className="mx-2">|</span>
          <Link href={`/${lang}/terms`} className="hover:underline">{t.footerTerms}</Link>
          <span className="mx-2">|</span>
          <Link href={`/${lang}/status`} className="hover:underline">{t.footerStatus}</Link>
        </div>
      </main>
    </div>
  );
}
