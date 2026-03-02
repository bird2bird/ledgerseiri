import LanguageMenuLP from "@/components/LanguageMenuLP";
import MarketingTopBar from "@/components/MarketingTopBar";

type Lang = "ja" | "en" | "zh-CN" | "zh-TW";

function getLang(params: any): Lang {
  const lang = (params?.lang ?? "ja") as Lang;
  return lang === "ja" || lang === "en" || lang === "zh-CN" || lang === "zh-TW" ? lang : "ja";
}

function cn(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

type NavT = {
  menu: {
    features: string;
    pricing: string;
    resources: string;
    usecases: string;
    cases: string;
    support: string;
  };
  right: { login: string; trial: string; };
  title: string;
  lead: string;
  ctaTrial: string;
};

const I18N: Record<Lang, NavT> = {
  ja: {
    menu: { features: "機能", pricing: "Pricing", resources: "資料一覧", usecases: "活用シーン", cases: "導入事例", support: "support" },
    right: { login: "ログイン", trial: "無料で体験" },
    title: "主要機能",
    lead: "LedgerSeiri の主要機能を、1ページで把握できます。",
    ctaTrial: "無料で体験を開始",
  },
  en: {
    menu: { features: "Features", pricing: "Pricing", resources: "Resources", usecases: "Use cases", cases: "Case studies", support: "Support" },
    right: { login: "Login", trial: "Start free" },
    title: "Features",
    lead: "See what LedgerSeiri can do for your business.",
    ctaTrial: "Start free",
  },
  "zh-CN": {
    menu: { features: "功能", pricing: "价格", resources: "资料一览", usecases: "使用场景", cases: "导入事例", support: "支持" },
    right: { login: "登录", trial: "免费体验" },
    title: "核心功能",
    lead: "一页看懂 LedgerSeiri 的主要功能。",
    ctaTrial: "开始免费体验",
  },
  "zh-TW": {
    menu: { features: "功能", pricing: "價格", resources: "資料一覽", usecases: "活用情境", cases: "導入事例", support: "支援" },
    right: { login: "登入", trial: "免費體驗" },
    title: "核心功能",
    lead: "一頁看懂 LedgerSeiri 的主要功能。",
    ctaTrial: "開始免費體驗",
  },
};

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const p = await params;
  const lang = getLang(p);
  const t = (I18N[lang] as any);
  
  const nav = { ...(t.menu || {}), login: t.right?.login, trial: t.right?.trial };
const topNav = { ...(t.menu || {}), login: t.right?.login, trial: t.right?.trial };
const homeHref = `/${lang}`;
  const featuresHref = `/${lang}/features`;
  const pricingHref = `/${lang}/pricing`;
  const resourcesHref = `/${lang}/resources`;
  const usecasesHref = `/${lang}/usecases`;
  const casesHref = `/${lang}/cases`;
  const supportHref = `/${lang}/support`;

  const loginHref = `/${lang}/login`;
  const trialHref = `/${lang}/register`;

  return (
      <>
        <MarketingTopBar active="auto" lang={lang} nav={topNav as any} subtitle="Features" />
        <main className="min-h-screen ls-bg text-slate-900">
      {/* Subtle gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#2b5cff]/10 via-sky-100/40 to-transparent blur-2xl" />
        <div className="absolute top-[520px] left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-gradient-to-br from-emerald-100/35 via-white to-transparent blur-2xl" />
      </div>

      {/* Top nav */}
      {/* Page content */}
      <section className="mx-auto max-w-6xl px-5 pt-12 pb-10">
        <h1 className="text-4xl leading-[1.1] tracking-tight font-semibold md:text-5xl">{t.title}</h1>
        <p className="mt-4 text-base text-slate-600 md:text-lg">{t.lead}</p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-black/10 bg-white/85 p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Section 1</div>
            <div className="mt-2 text-sm text-slate-600">（ここに内容を追加していきます）</div>
          </div>
          <div className="rounded-3xl border border-black/10 bg-white/85 p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Section 2</div>
            <div className="mt-2 text-sm text-slate-600">（ここに内容を追加していきます）</div>
          </div>
          <div className="rounded-3xl border border-black/10 bg-white/85 p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Section 3</div>
            <div className="mt-2 text-sm text-slate-600">（ここに内容を追加していきます）</div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a href={trialHref} className="ls-btn ls-btn-primary inline-flex items-center justify-center px-5 py-3">
            {t.ctaTrial}
          </a>
          <a href={pricingHref} className="ls-btn ls-btn-ghost inline-flex items-center justify-center px-5 py-3 text-slate-900">
            {t.menu.pricing}
          </a>
        </div>
      </section>
    </main>
    </>
  );

}