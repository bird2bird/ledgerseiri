'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import MarketingFooter from "@/components/MarketingFooter";
import { trackLpEvent } from "@/core/lp-tracking";

type Lang = 'ja' | 'en' | 'zh-CN' | 'zh-TW';

const CTA_OPTIONS = ["register", "login", "language_select"] as const;

function normalizeLang(value: string | null): Lang {
  if (value === "en" || value === "zh-CN" || value === "zh-TW" || value === "ja") return value;
  return "ja";
}

function LPContent() {
  const [lang, setLang] = useState<Lang>('ja');
  const searchParams = useSearchParams();

  const activeFilter = useMemo(() => {
    const cta = searchParams.get("cta") || "";
    const source = searchParams.get("source") || "";
    const locale = searchParams.get("locale") || "";
    const referrer = searchParams.get("referrer") || "";

    return {
      cta,
      source,
      locale,
      referrer,
      hasAny: Boolean(cta || source || locale || referrer),
    };
  }, [searchParams]);

  useEffect(() => {
    const saved = localStorage.getItem('ls_lang') || localStorage.getItem('app_lang');
    const resolvedLang = normalizeLang(saved);
    if (saved) setLang(resolvedLang);

    trackLpEvent({
      path: window.location.pathname,
      locale: resolvedLang,
      eventType: 'view',
      ctaName: activeFilter.cta || null,
    });
  }, [activeFilter.cta]);

  function changeLang(l: Lang) {
    setLang(l);
    localStorage.setItem('ls_lang', l);
    localStorage.setItem('app_lang', l);
    trackLpEvent({
      path: window.location.pathname,
      locale: l,
      eventType: 'lang_switch',
      ctaName: 'language_select',
    });
  }

  const clearHref = `/${lang}/lp`;

  const quickFilterLinks = CTA_OPTIONS.map((cta) => ({
    cta,
    href: `/${lang}/lp?cta=${encodeURIComponent(cta)}`,
    active: activeFilter.cta === cta,
  }));

  const registerHref = activeFilter.hasAny
    ? `/${lang}/register?cta=${encodeURIComponent(activeFilter.cta || "register")}&source=${encodeURIComponent(activeFilter.source || "")}&locale=${encodeURIComponent(activeFilter.locale || "")}&referrer=${encodeURIComponent(activeFilter.referrer || "")}`
    : `/${lang}/register`;

  const loginHref = activeFilter.hasAny
    ? `/${lang}/login?cta=${encodeURIComponent(activeFilter.cta || "login")}&source=${encodeURIComponent(activeFilter.source || "")}&locale=${encodeURIComponent(activeFilter.locale || "")}&referrer=${encodeURIComponent(activeFilter.referrer || "")}`
    : `/${lang}/login`;

  return (
    <main className="min-h-screen flex flex-col items-center justify-start gap-6 px-6 py-12">
      <div className="absolute top-4 right-4">
        <select
          value={lang}
          onChange={(e) => changeLang(e.target.value as Lang)}
          className="border px-3 py-2 rounded-xl"
        >
          <option value="en">English</option>
          <option value="zh-CN">简体中文</option>
          <option value="zh-TW">繁體中文</option>
          <option value="ja">日本語</option>
        </select>
      </div>

      <div className="w-full max-w-5xl rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
              {lang === 'ja' && 'LP Detail Workspace'}
              {lang === 'en' && 'LP Detail Workspace'}
              {lang === 'zh-CN' && 'LP 详情工作台'}
              {lang === 'zh-TW' && 'LP 詳情工作台'}
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {lang === 'ja' && '流入・CTA フィルター状況'}
              {lang === 'en' && 'Traffic / CTA Filter Context'}
              {lang === 'zh-CN' && '流量 / CTA 筛选上下文'}
              {lang === 'zh-TW' && '流量 / CTA 篩選上下文'}
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs text-slate-500">CTA</div>
              <div className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                {activeFilter.cta || "-"}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs text-slate-500">Source</div>
              <div className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                {activeFilter.source || "-"}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs text-slate-500">Locale</div>
              <div className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                {activeFilter.locale || "-"}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs text-slate-500">Referrer</div>
              <div className="mt-1 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                {activeFilter.referrer || "-"}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickFilterLinks.map((item) => (
              <Link
                key={item.cta}
                href={item.href}
                className={
                  item.active
                    ? "rounded-full border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700"
                    : "rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                }
              >
                {item.cta}
              </Link>
            ))}
            <Link
              href={clearHref}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              {lang === 'ja' && 'フィルター解除'}
              {lang === 'en' && 'Clear Filters'}
              {lang === 'zh-CN' && '清除筛选'}
              {lang === 'zh-TW' && '清除篩選'}
            </Link>
          </div>

          {activeFilter.hasAny ? (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              {lang === 'ja' && '現在は LP drill-down モードです。上のフィルター条件を維持したまま CTA 反応を確認できます。'}
              {lang === 'en' && 'You are in LP drill-down mode. The current filter context is preserved for CTA review.'}
              {lang === 'zh-CN' && '当前为 LP drill-down 模式。你可以在保留筛选条件的同时查看 CTA 反应。'}
              {lang === 'zh-TW' && '目前為 LP drill-down 模式。你可以在保留篩選條件的同時查看 CTA 反應。'}
            </div>
          ) : null}
        </div>
      </div>

      <h1 className="text-4xl font-bold">LedgerSeiri</h1>
      <p className="text-lg">
        {lang === 'ja' && '越境EC事業者向け経営SaaS'}
        {lang === 'en' && 'Business SaaS for Cross-border E-commerce'}
        {lang === 'zh-CN' && '跨境电商经营级SaaS'}
        {lang === 'zh-TW' && '跨境電商經營級SaaS'}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href={registerHref}
          onClick={() =>
            trackLpEvent({
              path: window.location.pathname,
              locale: lang,
              eventType: 'cta_click',
              ctaName: activeFilter.cta || 'register',
            })
          }
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          {lang === 'ja' && '無料登録'}
          {lang === 'en' && 'Start Free'}
          {lang === 'zh-CN' && '免费注册'}
          {lang === 'zh-TW' && '免費註冊'}
        </Link>
        <Link
          href={loginHref}
          onClick={() =>
            trackLpEvent({
              path: window.location.pathname,
              locale: lang,
              eventType: 'cta_click',
              ctaName: activeFilter.cta || 'login',
            })
          }
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900"
        >
          {lang === 'ja' && 'ログイン'}
          {lang === 'en' && 'Login'}
          {lang === 'zh-CN' && '登录'}
          {lang === 'zh-TW' && '登入'}
        </Link>
      </div>

      <MarketingFooter lang={lang} />
    </main>
  );
}


export default function LPPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center px-6 py-12">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            Loading LP workspace...
          </div>
        </main>
      }
    >
      <LPContent />
    </Suspense>
  );
}
