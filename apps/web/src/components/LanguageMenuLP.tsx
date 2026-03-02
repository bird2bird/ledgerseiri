"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Lang = "ja" | "en" | "zh-CN" | "zh-TW";

const ITEMS: Array<{ code: Lang; label: string; ccy: string }> = [
  { code: "ja", label: "日本語", ccy: "JPY" },
  { code: "en", label: "English", ccy: "USD" },
  { code: "zh-CN", label: "简体中文", ccy: "CNY" },
  { code: "zh-TW", label: "繁體中文", ccy: "TWD" },
];

function normalizePath(pathname: string | null) {
  const p = pathname || "/";
  return p.startsWith("/") ? p : `/${p}`;
}

function switchLangPath(pathname: string | null, nextLang: Lang) {
  const p = normalizePath(pathname);
  const segs = p.split("/");
  // segs[0] = "" , segs[1] = lang
  if (segs.length >= 2) {
    segs[1] = nextLang;
    const out = segs.join("/") || `/${nextLang}`;
    return out === "/" ? `/${nextLang}` : out;
  }
  return `/${nextLang}`;
}

export default function LanguageMenuLP({ current }: { current: Lang }) {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const currentItem = useMemo(() => {
    return ITEMS.find((x) => x.code === current) ?? { code: current, label: "日本語", ccy: "JPY" };
  }, [current]);

  // Always close on route/path change (prevents "menu stays open after navigation")
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Robust outside click + ESC close
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!open) return;
      const el = rootRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
    };

    // capture phase prevents "first click swallowed"
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur hover:bg-white/80 active:scale-[0.99]"
      >
        <span className="text-slate-500">🌐</span>
        <span className="font-medium">{currentItem.label}</span>
        <span className="ml-1 rounded-md bg-black/[0.04] px-2 py-0.5 text-[11px] font-semibold text-slate-600">{currentItem.ccy}</span>
        <span className="text-slate-400">▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-[220px] overflow-hidden rounded-2xl border border-black/10 bg-white/80 shadow-xl backdrop-blur z-50"
        >
          {ITEMS.map((it) => {
            const target = switchLangPath(pathname, it.code);
            const isCurrent = it.code === current;

            return (
              <button
                key={it.code}
                type="button"
                role="menuitem"
                onClick={() => {
                  // Always close (including selecting current lang)
                  setOpen(false);
                  if (isCurrent) return;
                  // Hard fix: push after close in next frame
                  requestAnimationFrame(() => router.push(target));
                }}
                className="group relative block w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-black/[0.04]"
              >
                <span className="absolute left-0 top-0 h-full w-1 bg-[#2b5cff] opacity-0 group-hover:opacity-100" />
                <span className="flex items-center justify-between gap-6">
                  <span>{it.label}</span>
                  <span className="ml-auto mr-2 rounded-md bg-black/[0.04] px-2 py-0.5 text-[11px] font-semibold text-slate-600">{it.ccy}</span>
                  {isCurrent && (
                    <svg className="h-4 w-4 text-[#2b5cff]" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.29a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 111.414-1.414l2.793 2.793 6.543-6.543a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
