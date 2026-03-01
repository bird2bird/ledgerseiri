"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Lang } from "@/lib/i18n/lang";
import { LANGS } from "@/lib/i18n/lang";
import { authDict } from "@/lib/i18n/auth";
import { usePathname, useRouter } from "next/navigation";

function displayLabel(lang: Lang) {
  if (lang === "en") return "English";
  if (lang === "zh-CN") return "简体中文";
  if (lang === "zh-TW") return "繁體中文";
  return "日本語";
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
  const pathname = usePathname() || `/${lang}/login`;

  // dropdown open/close (ESC / outside click)
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const currentLabel = useMemo(() => displayLabel(lang), [lang]);

  function switchTo(target: Lang) {
    try {
      localStorage.setItem("ls_lang", target);
      document.cookie = `ls_lang=${encodeURIComponent(target)}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
    } catch {}

    // Keep same route name when switching language
    const parts = pathname.split("/");
    if (parts.length > 2) {
      parts[1] = target;
      router.push(parts.join("/"));
    } else {
      router.push(`/${target}/login`);
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onDocMouseDown(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onDocMouseDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onDocMouseDown);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* LP-like subtle gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#2b5cff]/10 via-sky-100/40 to-transparent blur-2xl" />
        <div className="absolute top-[520px] left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-gradient-to-br from-emerald-100/35 via-white to-transparent blur-2xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-5 py-3 flex items-center justify-between">
          <Link href={`/${lang}`} className="flex items-center gap-3 no-underline">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#2b5cff] text-white text-sm font-bold shadow-sm">
              LS
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">LedgerSeiri</div>
              <div className="text-[12px] text-slate-500">{t.brandSub}</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {/* Language dropdown */}
            <div ref={rootRef} className="relative">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/75 px-4 py-2 text-sm text-slate-700 shadow-sm backdrop-blur hover:bg-white"
                aria-haspopup="menu"
                aria-expanded={open}
              >
                🌐 <span className="font-medium">{currentLabel}</span>
                <span className="text-slate-400">▾</span>
              </button>

              {open && (
                <div
                  className="absolute right-0 mt-2 min-w-[220px] overflow-hidden rounded-2xl border border-black/10 bg-white/70 shadow-xl backdrop-blur"
                  role="menu"
                >
                  {LANGS.map((x) => {
                    const label = displayLabel(x);
                    return (
                      <button
                        key={x}
                        type="button"
                        onClick={() => {
                          // click same language should also close
                          setOpen(false);
                          if (x !== lang) switchTo(x);
                        }}
                        className="group relative flex w-full items-center justify-between px-4 py-2 text-left text-sm text-slate-700 hover:bg-black/[0.04]"
                        role="menuitem"
                      >
                        <span className="absolute left-0 top-0 h-full w-1 bg-[#2b5cff] opacity-0 group-hover:opacity-100" />
                        <span>{label}</span>
                        {x === lang && (
                          <svg className="h-4 w-4 text-[#2b5cff]" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 111.414-1.414l2.793 2.793 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              href={`/${lang}/help`}
              className="inline-flex items-center rounded-full border border-black/10 bg-white/75 px-4 py-2 text-sm text-slate-700 shadow-sm backdrop-blur hover:bg-white"
            >
              ヘルプ
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">
        {/* Card */}
        <div className="mx-auto max-w-xl rounded-[32px] border border-black/10 bg-white/80 p-8 shadow-sm backdrop-blur">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 text-center">{title}</h1>
          <div className="mt-2 text-center text-sm text-slate-600">{subtitle}</div>
          <div className="mt-8">{children}</div>
        </div>

        <div className="mt-10 text-center text-sm text-slate-500">
          <Link href={`/${lang}/privacy`} className="hover:text-slate-700">{t.footerPrivacy}</Link>
          <span className="mx-2">|</span>
          <Link href={`/${lang}/terms`} className="hover:text-slate-700">{t.footerTerms}</Link>
          <span className="mx-2">|</span>
          <Link href={`/${lang}/status`} className="hover:text-slate-700">{t.footerStatus}</Link>
        </div>
      </main>
    </div>
  );
}
