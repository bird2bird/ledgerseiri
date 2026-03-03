"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { MenuPopover } from "@/components/ui/MenuPopover";

type LangCode = "ja" | "en" | "zh-CN" | "zh-TW";

const LANGS: { code: LangCode; label: string; ccy: string }[] = [
  { code: "en", label: "English", ccy: "USD" },
  { code: "zh-CN", label: "简体中文", ccy: "CNY" },
  { code: "zh-TW", label: "繁體中文", ccy: "TWD" },
  { code: "ja", label: "日本語", ccy: "JPY" },
];

function getLangFromPath(pathname: string): LangCode {
  const seg = (pathname.split("/")[1] || "ja") as LangCode;
  return seg === "ja" || seg === "en" || seg === "zh-CN" || seg === "zh-TW" ? seg : "ja";
}

function withLang(pathname: string, target: string, lang: LangCode): string {
  // keep current path but replace lang segment
  const parts = pathname.split("/");
  if (parts.length <= 1) return `/${lang}${target}`;
  parts[1] = lang;
  return parts.join("/") || `/${lang}${target}`;
}

export default function LanguageMenu() {
  const pathname = usePathname() || "/ja";
  const current = useMemo(() => getLangFromPath(pathname), [pathname]);
  const currentItem = useMemo(() => LANGS.find((x) => x.code === current), [current]);
const currentLabel = useMemo(() => currentItem?.label ?? current, [currentItem, current]);

  return (
    <MenuPopover
      width="match-button"
      withCheck
      button={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm shadow-sm hover:bg-black/[0.03]"
        >
          <span className="text-slate-500">🌐</span>
          <span className="font-medium">{currentLabel}</span>
            <span className="ml-1 rounded-md bg-black/[0.04] px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-200">{currentItem?.ccy}</span>
<span className="text-slate-400">▾</span>
        </button>
      )}
      items={LANGS.map((l) => ({
  key: l.code,
  label: (
    <span className="flex w-full items-center justify-between gap-3 pr-2">
      <span>{l.label}</span>
      <span className="ml-auto rounded-md bg-black/[0.04] px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-200">{l.ccy}</span>
    </span>
  ),
  selected: l.code === current,
  href: withLang(pathname, "", l.code),
}))}
    />
  );
}
