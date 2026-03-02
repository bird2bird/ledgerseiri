"use client";

import React, { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Lang = "ja" | "en" | "zh-CN" | "zh-TW";

const ITEMS: Array<{ code: Lang; label: string }> = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁體中文" },
];

function switchLangPath(pathname: string | null, nextLang: Lang) {
  const p = pathname || "/";
  const segs = p.split("/");
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

  const currentLabel = useMemo(() => {
    return ITEMS.find((x) => x.code === current)?.label ?? "日本語";
  }, [current]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-white/80 active:scale-[0.99]"
      >
        <span className="text-slate-500">🌐</span>
        <span className="font-medium">{currentLabel}</span>
        <span className="text-slate-400">▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-[220px] overflow-hidden rounded-2xl border border-black/10 bg-white/90 shadow-xl backdrop-blur z-50"
        >
          {ITEMS.map((it) => {
            const target = switchLangPath(pathname, it.code);
            const isCurrent = it.code === current;

            const go = () => {
              if (isCurrent) return;
              // Hard navigation: guarantees 1-click language switch even if App Router push is swallowed.
              if (typeof window !== "undefined") {
                window.location.assign(target);
                return;
              }
              // Fallback (shouldn't happen in browser)
              router.push(target);
            };

            return (
              <button
                key={it.code}
                type="button"
                role="menuitem"
                // pointerdown fires earlier than click; avoids any focus/drag/click-cancel edge cases.
                onPointerDown={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  go();
                }}
                onClick={(e) => {
                  // fallback in case pointerdown doesn't fire (very rare)
                  e.preventDefault();
                  setOpen(false);
                  go();
                }}
                className="group relative block w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-black/[0.04]"
              >
                <span className="absolute left-0 top-0 h-full w-1 bg-[#2b5cff] opacity-0 group-hover:opacity-100" />
                <span className="flex items-center justify-between gap-6">
                  <span>{it.label}</span>
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
