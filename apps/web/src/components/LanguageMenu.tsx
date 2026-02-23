"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { MenuPopover } from "@/components/ui/MenuPopover";

type LangCode = "ja" | "en" | "zh-CN" | "zh-TW";

const LANGS: { code: LangCode; label: string }[] = [
  { code: "en", label: "English" },
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁體中文" },
  { code: "ja", label: "日本語" },
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
  const currentLabel = useMemo(() => LANGS.find((x) => x.code === current)?.label ?? current, [current]);

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
          <span className="text-slate-400">▾</span>
        </button>
      )}
      items={LANGS.map((l) => ({
        key: l.code,
        label: l.label,
        selected: l.code === current,
        href: withLang(pathname, "", l.code),
      }))}
    />
  );
}
