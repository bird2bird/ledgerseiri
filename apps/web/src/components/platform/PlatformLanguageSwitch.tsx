"use client";

import Link from "next/link";

type Props = {
  lang: string;
  path: string;
};

export function PlatformLanguageSwitch({ lang, path }: Props) {
  const current = lang === "zh-CN" ? "zh-CN" : "en";

  const buildHref = (nextLang: string) => `/${nextLang}${path}`;

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-300">
      <span className="text-slate-500">ZH / EN</span>
      <Link
        href={buildHref("zh-CN")}
        className={current === "zh-CN" ? "font-semibold text-cyan-300" : "hover:text-slate-100"}
      >
        中文
      </Link>
      <span className="text-slate-700">|</span>
      <Link
        href={buildHref("en")}
        className={current === "en" ? "font-semibold text-cyan-300" : "hover:text-slate-100"}
      >
        English
      </Link>
    </div>
  );
}
