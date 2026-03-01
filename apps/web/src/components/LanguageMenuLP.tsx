"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Lang = "ja" | "en" | "zh-CN" | "zh-TW";

const ITEMS: Array<{ code: Lang; label: string; short: string }> = [
  { code: "en", label: "English", short: "EN" },
  { code: "zh-CN", label: "简体中文", short: "简" },
  { code: "zh-TW", label: "繁體中文", short: "繁" },
  { code: "ja", label: "日本語", short: "JA" },
];

function cn(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

export default function LanguageMenuLP({ current }: { current: Lang }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const currentLabel = useMemo(() => {
    const hit = ITEMS.find((x) => x.code === current);
    return hit?.label ?? "日本語";
  }, [current]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

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
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-full border border-black/10 bg-white/70",
          "px-3 text-sm text-slate-700 shadow-sm backdrop-blur hover:bg-white/80 active:scale-[0.99]"
        )}
      >
        <span className="text-slate-500">🌐</span>
        <span className="font-medium">{currentLabel}</span>
        <span className="text-slate-400">▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 mt-2 w-[220px] overflow-hidden rounded-2xl border border-black/10",
            "bg-white/70 shadow-xl backdrop-blur z-50"
          )}
        >
          {ITEMS.map((it) => (
            <Link
              key={it.code}
              href={`/${it.code}`}
              role="menuitem"
              onClick={(e) => {
                if (it.code === current) e.preventDefault();
                setOpen(false);
              }}
              className="group relative flex items-center justify-between gap-4 px-4 py-2.5 text-sm text-slate-700 hover:bg-black/[0.04]"
            >
              <span className="absolute left-0 top-0 h-full w-1 bg-[#2b5cff] opacity-0 group-hover:opacity-100" />
              <span>{it.label}</span>
              <span className="inline-flex h-10 h-6 min-w-6 items-center justify-center rounded-full border border-black/10 bg-white/70 text-[12px] text-slate-600">
                {it.short}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
