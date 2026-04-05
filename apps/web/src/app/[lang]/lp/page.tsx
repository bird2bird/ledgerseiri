'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import MarketingFooter from "@/components/MarketingFooter";
import { trackLpEvent } from "@/core/lp-tracking";

type Lang = 'ja' | 'en' | 'zh-CN' | 'zh-TW';

export default function LP() {
  const [lang, setLang] = useState<Lang>('ja');

  useEffect(() => {
    const saved = localStorage.getItem('ls_lang') || localStorage.getItem('app_lang');
    if (saved) setLang(saved as Lang);
    trackLpEvent({ path: window.location.pathname, locale: saved || 'ja', eventType: 'view' });
  }, []);

  function changeLang(l: Lang) {
    setLang(l);
    localStorage.setItem('ls_lang', l);
    localStorage.setItem('app_lang', l);
    trackLpEvent({ path: window.location.pathname, locale: l, eventType: 'lang_switch', ctaName: 'language_select' });
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">
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

      <h1 className="text-4xl font-bold">LedgerSeiri</h1>
      <p className="text-lg">
        {lang === 'ja' && '越境EC事業者向け経営SaaS'}
        {lang === 'en' && 'Business SaaS for Cross-border E-commerce'}
        {lang === 'zh-CN' && '跨境电商经营级SaaS'}
        {lang === 'zh-TW' && '跨境電商經營級SaaS'}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href={`/${lang}/register`}
          onClick={() => trackLpEvent({ path: window.location.pathname, locale: lang, eventType: 'cta_click', ctaName: 'register' })}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          {lang === 'ja' && '無料登録'}
          {lang === 'en' && 'Start Free'}
          {lang === 'zh-CN' && '免费注册'}
          {lang === 'zh-TW' && '免費註冊'}
        </Link>
        <Link
          href={`/${lang}/login`}
          onClick={() => trackLpEvent({ path: window.location.pathname, locale: lang, eventType: 'cta_click', ctaName: 'login' })}
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
