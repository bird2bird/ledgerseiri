"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Lang = "ja" | "en" | "zh-CN" | "zh-TW";

const ITEMS: Array<{ code: Lang; label: string }> = [
  { code: "en", label: "English" },
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁體中文" },
  { code: "ja", label: "日本語" },
];

export default function LanguageMenuLP({ current }: { current: Lang }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const currentLabel = useMemo(() => {
    const hit = ITEMS.find((x) => x.code === current);
    return hit?.label ?? "日本語";
  }, [current]);

  // Close on outside click + ESC
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!el) return;
      // 点击到菜单之外 -> 关闭
      if (!el.contains(e.target as Node)) setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    // 用 capture，更不容易被其它组件拦截
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
        className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm text-slate-700 shadow-sm backdrop-blur hover:bg-white/80 active:scale-[0.99]"
      >
        🌐 <span className="font-medium">{currentLabel}</span>
        <span className="text-slate-400">▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 min-w-full w-max overflow-hidden rounded-2xl border border-black/10 bg-white/65 shadow-xl backdrop-blur z-50"
        >
          {ITEMS.map((it) => (
            <Link
              key={it.code}
              href={`/${it.code}`}
              role="menuitem"
              onClick={(e) => {
                // 点同语言：只关闭，不跳转
                if (it.code === current) e.preventDefault();
                setOpen(false);
              }}
              className="group relative block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-black/[0.04]"
            >
              <span className="absolute left-0 top-0 h-full w-1 bg-[#2b5cff] opacity-0 group-hover:opacity-100" />
              <span className="flex items-center justify-between gap-6">
                <span>{it.label}</span>
                {current === it.code && (
                  <svg
                    className="h-4 w-4 text-[#2b5cff]"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 5.29a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 111.414-1.414l2.793 2.793 6.543-6.543a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
