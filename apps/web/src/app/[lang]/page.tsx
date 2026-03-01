import ScrollToTop from "@/components/ScrollToTop";
import LanguageMenuLP from "@/components/LanguageMenuLP";
import FAQAccordion from "@/components/FAQAccordion";
import type { Metadata } from "next";
import Link from "next/link";


export const metadata: Metadata = {
  title: "LedgerSeiri | 経営級クラウド記帳（クロスボーダーEC向け）",
  description:
    "Amazonなど複数ストアの取引・手数料・広告・返金をまとめて記帳。ダッシュボードで経営を見える化するクラウドSaaS。",
};

type Lang = "ja" | "en" | "zh-CN" | "zh-TW";

const I18N: Record<
  Lang,
  {
    nav: { features: string; usecases: string; pricing: string; faq: string; login: string; trial: string };
    hero: {
      eyebrow: string;
      title1: string;
      title2: string;
      lead: string;
      ctaPrimary: string;
      ctaSecondary: string;
      note: string;
      badges: string[];
    };
    value: { title: string; items: { title: string; desc: string }[] };
    blocks: {
      a: { title: string; desc: string; bullets: string[] };
      b: { title: string; desc: string; bullets: string[] };
      c: { title: string; desc: string; bullets: string[] };
    };
    grid: { title: string; lead: string; cards: { title: string; desc: string }[] };
    usecases: { title: string; lead: string; items: { title: string; desc: string }[] };
    pricing: { title: string; lead: string; hint: string; plans: { name: string; price: string; items: string[] }[] };
    faq: { title: string; items: { q: string; a: string }[] };
    final: { title: string; lead: string; cta: string; sub: string };
  }
> = {
  ja: {
    nav: { features: "特長", usecases: "活用シーン", pricing: "料金", faq: "FAQ", login: "ログイン", trial: "無料で始める"},
    hero: {
      eyebrow: "クロスボーダーEC向け 経営級SaaS",
      title1: "会計・広告・返金・FBA手数料。",
      title2: "全部つなげて、経営を見える化。",
      lead: "Amazon/複数ストアの取引データをまとめて取り込み、ダッシュボードで収益構造を把握。記帳の手間を減らし、意思決定を速くします。",
      ctaPrimary: "無料で体験する",
      ctaSecondary: "資料をダウンロード",
      note: "無料体験後、自動課金はありません（予定）。",
      badges: ["Amazon/FBA対応", "多言語（JP/EN/中文）", "経営ダッシュボード", "AI分類（計画）"],
    },
    value: {
      title: "LedgerSeiri の特長",
      items: [
        { title: "誰でもカンタン", desc: "最小ステップで初期設定。迷わないUIで日々の記帳をスムーズに。" },
        { title: "まとめて効率化", desc: "売上・広告・返金・手数料を一元化。月次の締め作業を短縮。" },
        { title: "経営が見える", desc: "粗利・コスト構成・推移をダッシュボードで確認。改善点がわかる。" },
      ],
    },
    blocks: {
      a: {
        title: "記帳の「面倒」を減らす",
        desc: "FBA/広告/返金など、EC特有の取引をまとめて扱える設計。必要な数字が一箇所に集まります。",
        bullets: ["取引インポート（CSV/拡張）", "売上・手数料・広告・返金の統合", "月次集計を自動化（計画）"],
      },
      b: {
        title: "経営判断を速くするダッシュボード",
        desc: "売上と利益だけでなく「どこにコストが出ているか」を直感的に把握。",
        bullets: ["コスト構成（Top3）", "推移チャート（売上/純利益）", "ヘルススコア（ルール/AI）"],
      },
      c: {
        title: "将来：AIで仕訳・証憑まで",
        desc: "OCR/分類/異常検知など、AIで“経理の自動運転”へ。まずは経営データの整流化から。",
        bullets: ["領収書OCR（計画）", "勘定科目の自動提案（計画）", "異常値アラート（計画）"],
      },
    },
    grid: {
      title: "主要な機能（V0.3〜V0.5）",
      lead: "まずは「EC経営の数字」を整えることに集中。必要な機能から順に追加していきます。",
      cards: [
        { title: "複数ストア管理", desc: "Amazonなど複数店舗を切り替えて集計。" },
        { title: "取引管理", desc: "追加・削除・月次でフィルタ。CSVインポート拡張予定。" },
        { title: "経営ダッシュボード", desc: "売上/費用/純利益、コスト構成、推移を表示。" },
        { title: "多言語UI", desc: "日本語/英語/简体/繁體を切替。" },
        { title: "ロール/権限（計画）", desc: "経理/経営/外部税理士などの権限を分離。" },
        { title: "サブスク（計画）", desc: "無料体験→プラン課金へ。Stripe連携準備中。" },
      ],
    },
    usecases: {
      title: "活用シーン",
      lead: "小規模でも“経営レベルの数字”を毎月見える化したい人向け。",
      items: [
        { title: "Amazon運用を標準化したい", desc: "月次の数字を同じ型で揃えて、比較しやすくする。" },
        { title: "広告費の効き方を知りたい", desc: "広告比率・返金率・粗利のバランスで改善点を特定。" },
        { title: "複数ストアを一本化したい", desc: "店舗別・月別の損益をまとめて確認。" },
      ],
    },
    pricing: {
      title: "料金（予定）",
      lead: "初期は“使い続けやすい価格”を重視。必要な機能で段階的に。",
      hint: "※正式な料金は近日公開。まずは無料体験でフィードバックをください。",
      plans: [
        { name: "Starter", price: "¥980/月〜（案）", items: ["単一ストア", "基本ダッシュボード", "CSVインポート（基本）"] },
        { name: "Standard", price: "¥1,980/月〜（案）", items: ["複数ストア", "高度な集計", "優先サポート"] },
        { name: "AI Pro", price: "¥4,980/月〜（案）", items: ["AI分類/提案（計画）", "OCR（計画）", "自動チェック（計画）"] },
      ],
    },
    faq: {
      title: "よくある質問",
      items: [
        { q: "無料体験後に自動課金されますか？", a: "現状は自動課金しません（将来サブスク導入時も明確に案内します）。" },
        { q: "対応プラットフォームは？", a: "まずは Amazon を中心に設計しています。順次拡張予定です。" },
        { q: "税務申告までできますか？", a: "当面は“経営数字の整流化”に集中。申告は連携/出力で支援する方針です。" },
      ],
    },
    final: {
      title: "経営の数字、今日から整えよう。",
      lead: "まずはダッシュボードを触って、必要な機能の優先順位を一緒に決めましょう。",
      cta: "無料で体験する",
      sub: "フィードバック歓迎。最短でプロダクトに反映します。",
    },
  },

  en: {
    nav: { features: "Features", usecases: "Use cases", pricing: "Pricing", faq: "FAQ", login: "Login", trial: "Start free"},
    hero: {
      eyebrow: "Business-grade SaaS for cross-border e-commerce",
      title1: "Sales, ads, refunds, FBA fees —",
      title2: "unified into one dashboard.",
      lead: "Import multi-store transactions and understand your profit structure fast. Less bookkeeping. Faster decisions.",
      ctaPrimary: "Try for free",
      ctaSecondary: "Download brochure",
      note: "No auto-charge after trial (planned).",
      badges: ["Amazon/FBA ready", "Multilingual UI", "Business dashboard", "AI categorization (planned)"],
    },
    value: {
      title: "Why LedgerSeiri",
      items: [
        { title: "Simple by design", desc: "Quick setup and a UI that stays out of your way." },
        { title: "Unified workflow", desc: "Bring sales/fees/ads/refunds together and reduce month-end work." },
        { title: "See the business", desc: "Profit, cost mix, and trends in one place." },
      ],
    },
    blocks: {
      a: { title: "Reduce bookkeeping overhead", desc: "Built for e-commerce specifics (FBA/ads/refunds).", bullets: ["CSV import (extensible)", "Unified transaction types", "Automated monthly summaries (planned)"] },
      b: { title: "A dashboard for decisions", desc: "Not just revenue — understand where costs are.", bullets: ["Cost mix (Top 3)", "Trend charts", "Health score (rules/AI)"] },
      c: { title: "Next: AI for categorization & receipts", desc: "OCR, suggestions, anomaly alerts — step by step.", bullets: ["Receipt OCR (planned)", "Auto category suggestion (planned)", "Anomaly alerts (planned)"] },
    },
    grid: {
      title: "Key capabilities",
      lead: "We focus on getting your business numbers clean first — then automate.",
      cards: [
        { title: "Multi-store", desc: "Switch stores and compare months." },
        { title: "Transactions", desc: "Add/delete, filter by month. CSV import grows over time." },
        { title: "Dashboard", desc: "Sales/expense/net profit, mix and trends." },
        { title: "Languages", desc: "JP/EN/中文 supported." },
        { title: "Roles (planned)", desc: "Owner/accountant/tax advisor roles." },
        { title: "Subscription (planned)", desc: "Trial → paid plans. Stripe ready." },
      ],
    },
    usecases: {
      title: "Use cases",
      lead: "For solo founders and small teams who want business-grade visibility.",
      items: [
        { title: "Standardize monthly reporting", desc: "A consistent template for every month." },
        { title: "Understand ad efficiency", desc: "Spot the balance between ads/refunds/margin." },
        { title: "Unify multiple stores", desc: "One view for store-by-store P&L." },
      ],
    },
    pricing: {
      title: "Pricing (planned)",
      lead: "Designed to be affordable for early-stage users.",
      hint: "Final pricing coming soon. Try the demo and tell us what you need.",
      plans: [
        { name: "Starter", price: "from ¥980/mo", items: ["Single store", "Basic dashboard", "Basic CSV import"] },
        { name: "Standard", price: "from ¥1,980/mo", items: ["Multi-store", "Advanced aggregation", "Priority support"] },
        { name: "AI Pro", price: "from ¥4,980/mo", items: ["AI suggestions (planned)", "OCR (planned)", "Auto checks (planned)"] },
      ],
    },
    faq: {
      title: "FAQ",
      items: [
        { q: "Will I be charged automatically after trial?", a: "No, not at the moment. Future billing will be clearly communicated." },
        { q: "Which platforms are supported?", a: "Amazon-first for now; more integrations planned." },
        { q: "Does it file taxes for me?", a: "We focus on business bookkeeping and exports/assists, not full filing (for now)." },
      ],
    },
    final: { title: "Get your numbers clean, starting today.", lead: "Try the dashboard. We'll iterate fast based on your feedback.", cta: "Try for free", sub: "We ship improvements quickly." },
  },

  "zh-CN": {
    nav: { features: "特长", usecases: "场景", pricing: "价格", faq: "FAQ", login: "登录", trial: "免费体验"},
    hero: {
      eyebrow: "面向跨境电商卖家的经营级 SaaS",
      title1: "销售、广告、退款、FBA 费用——",
      title2: "一站式汇总成经营仪表盘。",
      lead: "把多店铺交易导入到同一个系统里，快速看清利润结构与成本构成。减少记账负担，加速经营决策。",
      ctaPrimary: "免费体验",
      ctaSecondary: "下载资料",
      note: "免费体验结束后不会自动扣费（计划）。",
      badges: ["Amazon/FBA 适配", "多语言界面", "经营 Dashboard", "AI 分类（规划）"],
    },
    value: {
      title: "LedgerSeiri 的特长",
      items: [
        { title: "谁都能上手", desc: "少步骤完成配置，界面清晰，日常记账更顺滑。" },
        { title: "整合更省事", desc: "销售/广告/退款/费用统一口径，月度结算更快。" },
        { title: "经营更清楚", desc: "利润、成本结构、趋势一眼看到，知道该优化哪里。" },
      ],
    },
    blocks: {
      a: { title: "减少“记账麻烦”", desc: "针对跨境电商常见交易类型设计，数字集中在一处。", bullets: ["CSV 导入（可扩展）", "销售/费用/广告/退款统一", "月度自动汇总（规划）"] },
      b: { title: "更快做经营判断", desc: "不仅看销售额，更要看“钱花在哪里”。", bullets: ["成本结构（Top3）", "趋势图（销售/净利润）", "健康提示（规则/AI）"] },
      c: { title: "未来：AI 让经理更自动", desc: "OCR、自动分类、异常提醒……先把经营数据做“整流”。", bullets: ["票据 OCR（规划）", "科目/分类建议（规划）", "异常波动提醒（规划）"] },
    },
    grid: {
      title: "主要功能（V0.3〜V0.5）",
      lead: "先把跨境电商的经营数字整理成标准形，再逐步自动化。",
      cards: [
        { title: "多店铺管理", desc: "切换店铺、按月查看汇总数据。" },
        { title: "交易管理", desc: "新增/删除/按月过滤，CSV 导入持续增强。" },
        { title: "经营 Dashboard", desc: "销售/费用/净利润、结构与趋势展示。" },
        { title: "多语言", desc: "日/英/简/繁切换。" },
        { title: "权限（规划）", desc: "老板/会计/税理士等角色权限分离。" },
        { title: "订阅（规划）", desc: "免费试用→套餐收费，Stripe 接入准备中。" },
      ],
    },
    usecases: {
      title: "适用场景",
      lead: "适合希望“每月看懂经营数字”的个人卖家与小团队。",
      items: [
        { title: "把 Amazon 经营标准化", desc: "用同一套口径做月报，方便比较与复盘。" },
        { title: "看清广告效率", desc: "广告占比、退款率、利润率一起看，快速定位问题。" },
        { title: "多店铺一体化", desc: "店铺别/月份别损益统一查看。" },
      ],
    },
    pricing: {
      title: "价格（规划）",
      lead: "以“容易持续使用”为目标，功能分层循序升级。",
      hint: "※正式价格即将公布。先体验，再按你的需求决定优先级。",
      plans: [
        { name: "Starter", price: "¥980/月起（拟）", items: ["单店铺", "基础 Dashboard", "基础 CSV 导入"] },
        { name: "Standard", price: "¥1,980/月起（拟）", items: ["多店铺", "更强汇总能力", "优先支持"] },
        { name: "AI Pro", price: "¥4,980/月起（拟）", items: ["AI 建议（规划）", "OCR（规划）", "自动检查（规划）"] },
      ],
    },
    faq: {
      title: "常见问题",
      items: [
        { q: "免费体验后会自动扣费吗？", a: "目前不会。未来如引入订阅，也会清晰提示并由你确认。" },
        { q: "支持哪些平台？", a: "优先 Amazon，后续逐步扩展其它平台/支付/物流数据。" },
        { q: "能直接报税吗？", a: "短期聚焦经营记账与数据整合，报税以导出/协助为主。" },
      ],
    },
    final: { title: "从今天开始，把经营数字整理清楚。", lead: "先体验 Dashboard，我们会根据反馈快速迭代。", cta: "免费体验", sub: "欢迎你告诉我：你最想先解决哪一类“记账痛点”。" },
  },

  "zh-TW": {
    nav: { features: "特長", usecases: "場景", pricing: "價格", faq: "FAQ", login: "登入", trial: "免費體驗"},
    hero: {
      eyebrow: "面向跨境電商賣家的經營級 SaaS",
      title1: "銷售、廣告、退款、FBA 費用——",
      title2: "一站式匯總成經營儀表板。",
      lead: "把多店舖交易導入到同一個系統裡，快速看清利潤結構與成本構成。減少記帳負擔，加速經營決策。",
      ctaPrimary: "免費體驗",
      ctaSecondary: "下載資料",
      note: "免費體驗結束後不會自動扣費（規劃）。",
      badges: ["Amazon/FBA 適配", "多語言介面", "經營 Dashboard", "AI 分類（規劃）"],
    },
    value: {
      title: "LedgerSeiri 的特長",
      items: [
        { title: "誰都能上手", desc: "少步驟完成設定，介面清晰，日常記帳更順。" },
        { title: "整合更省事", desc: "銷售/廣告/退款/費用統一口徑，月結更快。" },
        { title: "經營更清楚", desc: "利潤、成本結構、趨勢一眼看懂。" },
      ],
    },
    blocks: {
      a: { title: "降低記帳麻煩", desc: "針對電商常見交易型態設計，數字集中一處。", bullets: ["CSV 導入（可擴充）", "交易型態統一", "月度自動彙總（規劃）"] },
      b: { title: "更快做經營判斷", desc: "不只看營收，也要看成本流向。", bullets: ["成本結構（Top3）", "趨勢圖", "健康提示（規則/AI）"] },
      c: { title: "未來：AI 自動化", desc: "OCR、分類建議、異常提醒逐步上線。", bullets: ["OCR（規劃）", "分類建議（規劃）", "異常提醒（規劃）"] },
    },
    grid: {
      title: "主要功能（V0.3〜V0.5）",
      lead: "先把經營數字整理成標準，再逐步自動化。",
      cards: [
        { title: "多店舖管理", desc: "切換店舖、按月查看彙總。" },
        { title: "交易管理", desc: "新增/刪除/按月篩選，CSV 持續增強。" },
        { title: "經營 Dashboard", desc: "營收/費用/淨利、結構與趨勢。" },
        { title: "多語言", desc: "日/英/簡/繁切換。" },
        { title: "權限（規劃）", desc: "老闆/會計/稅理士角色分離。" },
        { title: "訂閱（規劃）", desc: "免費試用→方案收費，Stripe 準備中。" },
      ],
    },
    usecases: {
      title: "適用場景",
      lead: "適合想要每月看懂經營數字的個人與小團隊。",
      items: [
        { title: "Amazon 經營標準化", desc: "用同一套口徑做月報，便於比較。" },
        { title: "看清廣告效率", desc: "廣告占比、退款率、利潤率一起看。" },
        { title: "多店舖一體化", desc: "店舖別/月份別損益統一查看。" },
      ],
    },
    pricing: {
      title: "價格（規劃）",
      lead: "以可持續使用的價格為導向，分層升級。",
      hint: "※正式價格即將公布。先體驗，再按需求決定優先級。",
      plans: [
        { name: "Starter", price: "¥980/月起（擬）", items: ["單店舖", "基礎 Dashboard", "基礎 CSV"] },
        { name: "Standard", price: "¥1,980/月起（擬）", items: ["多店舖", "進階彙總", "優先支援"] },
        { name: "AI Pro", price: "¥4,980/月起（擬）", items: ["AI 建議（規劃）", "OCR（規劃）", "自動檢查（規劃）"] },
      ],
    },
    faq: {
      title: "常見問題",
      items: [
        { q: "免費體驗後會自動扣費嗎？", a: "目前不會。未來導入訂閱也會明確提示。" },
        { q: "支援哪些平台？", a: "優先 Amazon，後續擴展中。" },
        { q: "能直接報稅嗎？", a: "短期聚焦記帳與整合，報稅以導出/協助為主。" },
      ],
    },
    final: { title: "今天就把經營數字整理清楚。", lead: "先體驗 Dashboard，我們會快速迭代。", cta: "免費體驗", sub: "歡迎回饋：你最在意哪個功能？" },
  },
};

function cls(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function getLang(params: any): Lang {
  const lang = (params?.lang ?? "ja") as Lang;
  return lang === "ja" || lang === "en" || lang === "zh-CN" || lang === "zh-TW" ? lang : "ja";
}

export default async function LangLanding({ params }: { params: Promise<{ lang: string }> }) {
  const p = await params;
  const lang = getLang(p);
  const t = I18N[lang];

  const ctaHref = `/${lang}/login`;
  const registerHref = `/${lang}/register`;
  const brochureHref = `/${lang}/lp`; // 先指向你原来的 LP 或后续做下载页

  // pick "Standard" as recommended (index 1)
  const recommendedIndex = 1;

  return (
    <main className="min-h-screen ls-bg text-slate-900">
      {/* Subtle gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#2b5cff]/10 via-sky-100/40 to-transparent blur-2xl" />
        <div className="absolute top-[520px] left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-gradient-to-br from-emerald-100/35 via-white to-transparent blur-2xl" />
      </div>

      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          {/* Brand */}
          <a href={`/${lang}`} className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#2b5cff] text-white text-sm font-bold shadow-sm">
              LS
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">LedgerSeiri</div>
              <div className="text-[12px] text-slate-500">Business Ledger for Cross-border Sellers</div>
            </div>
          </a>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a className="hover:text-slate-900" href="#features">{t.nav.features}</a>
            <a className="hover:text-slate-900" href="#usecases">{t.nav.usecases}</a>
            <a className="hover:text-slate-900" href="#pricing">{t.nav.pricing}</a>
            <a className="hover:text-slate-900" href="#faq">{t.nav.faq}</a>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <LanguageMenuLP current={lang} />

            {/* Login (with icon) */}
            <a
              href={ctaHref}
              className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-black/10 bg-white/70 px-4 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur hover:bg-white/80 active:scale-[0.99]"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M10 7h8m0 0v10m0-10-9 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{t.nav.login}</span>
            </a>

            {/* Trial button */}
            <a
              href={registerHref}
              className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full bg-rose-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-rose-600 active:scale-[0.99]"
            >
              {t.nav.trial}
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pt-12 pb-8">
        <div className="grid grid-cols-12 gap-8 items-center">
          <div className="col-span-12 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[12px] text-slate-700 shadow-sm">
              <span className="inline-flex h-2 w-2 rounded-full bg-[#2b5cff]" />
              <span className="font-medium">{t.hero.eyebrow}</span>
            </div>

            <h1 className="mt-4 text-4xl leading-[1.1] tracking-tight font-semibold md:text-5xl">
              {t.hero.title1}
              <br />
              <span className="text-slate-900">{t.hero.title2}</span>
            </h1>

            <p className="mt-4 text-base text-slate-600 md:text-lg">{t.hero.lead}</p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href={ctaHref} className="ls-btn ls-btn-primary inline-flex items-center justify-center px-5 py-3">
                {t.hero.ctaPrimary}
              </a>
              <a href={brochureHref} className="ls-btn ls-btn-ghost inline-flex items-center justify-center px-5 py-3 text-slate-900">
                {t.hero.ctaSecondary}
              </a>
            </div>

            <div className="mt-3 text-[12px] text-slate-500">{t.hero.note}</div>

            <div className="mt-6 flex flex-wrap gap-2">
              {t.hero.badges.map((b) => (
                <span key={b} className="rounded-full bg-black/[0.03] px-3 py-1 text-[12px] text-slate-700">
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Hero visual placeholder */}
          <div className="col-span-12 lg:col-span-5">
            <div className="ls-card overflow-hidden">
              <div className="border-b border-black/5 px-5 py-4">
                <div className="text-sm font-semibold">LedgerSeiri Dashboard</div>
                <div className="text-[12px] text-slate-500">Sales / Fees / Ads / Refunds / Net</div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-black/10 bg-white p-4">
                    <div className="text-[12px] text-slate-500">Monthly Net</div>
                    <div className="mt-2 text-2xl font-semibold text-emerald-600">¥36,200</div>
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-white p-4">
                    <div className="text-[12px] text-slate-500">Sales</div>
                    <div className="mt-2 text-2xl font-semibold text-[#2b5cff]">¥40,000</div>
                  </div>
                  <div className="col-span-2 rounded-2xl border border-black/10 bg-white p-4">
                    <div className="text-[12px] text-slate-500">Cost mix</div>
                    <div className="mt-3 h-2 w-full rounded-full bg-black/[0.05] overflow-hidden">
                      <div className="h-2 w-[68%] bg-[#2b5cff]" />
                    </div>
                    <div className="mt-2 text-[12px] text-slate-500">FBA <span className="text-amber-600 font-semibold">8%</span> · Ads <span className="text-amber-600 font-semibold">3%</span> · Refund <span className="text-amber-600 font-semibold">1%</span></div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-dashed border-black/15 bg-white/50 p-4 text-[12px] text-slate-500">
                  ※ This is a visual mock. Replace with real screenshots later.
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="ls-card px-4 py-4">
                <div className="text-[12px] text-slate-500">Trusted by</div>
                <div className="mt-2 text-sm font-semibold">Cross-border sellers</div>
              </div>
              <div className="ls-card px-4 py-4">
                <div className="text-[12px] text-slate-500">Built for</div>
                <div className="mt-2 text-sm font-semibold">Japan market</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value props (3 cols) */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-10">
        <h2 className="text-2xl font-semibold tracking-tight">{t.value.title}</h2>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {t.value.items.map((it, i) => {
            const tint =
              i === 0
                ? "from-[#2b5cff]/10 via-white/70 to-white/70"
                : i === 1
                ? "from-emerald-500/10 via-white/70 to-white/70"
                : "from-amber-500/10 via-white/70 to-white/70";

            const icon =
              i === 0 ? "✓" : i === 1 ? "⇄" : "◉";

            const iconBg =
              i === 0 ? "bg-[#2b5cff]/10 text-[#2b5cff]" :
              i === 1 ? "bg-emerald-500/10 text-emerald-600" :
                        "bg-amber-500/10 text-amber-600";

            return (
              <div key={it.title} className={`ls-card p-6 bg-gradient-to-br ${tint}`}>
                <div className="flex items-start gap-3">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${iconBg}`}>{icon}</span>
                  <div>
                    <div className="text-sm font-semibold">{it.title}</div>
                    <div className="mt-2 text-sm text-slate-600">{it.desc}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3 feature blocks (alternating) */}
      <section className="mx-auto max-w-6xl px-5 pb-12">
        {(["a", "b", "c"] as const).map((k, idx) => {
          const b = t.blocks[k];
          const reverse = idx % 2 === 1;
          return (
            <div key={k} className={cls("grid grid-cols-12 gap-6 items-center py-8", reverse && "lg:[&>*:first-child]:order-2")}>
              <div className="col-span-12 lg:col-span-6">
                <div className="ls-card p-6">
                  <div className="text-lg font-semibold tracking-tight">{b.title}</div>
                  <div className="mt-2 text-sm text-slate-600">{b.desc}</div>
                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    {b.bullets.map((x) => (
                      <li key={x} className="flex gap-2">
                        <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#2b5cff]" />
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="col-span-12 lg:col-span-6">
                <div className="ls-card p-6">
                  <div className="text-[12px] text-slate-500">Visual placeholder</div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="h-20 rounded-2xl border border-black/10 bg-white" />
                    <div className="h-20 rounded-2xl border border-black/10 bg-white" />
                    <div className="col-span-2 h-28 rounded-2xl border border-black/10 bg-white" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Capability grid */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <h2 className="text-2xl font-semibold tracking-tight">{t.grid.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{t.grid.lead}</p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {t.grid.cards.map((c) => (
            <div key={c.title} className="ls-card-solid p-6 transition hover:shadow-[var(--sh-md)]">
              <div className="text-sm font-semibold">{c.title}</div>
              <div className="mt-2 text-sm text-slate-600">{c.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section id="usecases" className="mx-auto max-w-6xl px-5 py-10">
        <div className="ls-card p-8">
          <h2 className="text-2xl font-semibold tracking-tight">{t.usecases.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{t.usecases.lead}</p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {t.usecases.items.map((u) => (
              <div key={u.title} className="rounded-2xl border border-black/10 bg-white p-5">
                <div className="text-sm font-semibold">{u.title}</div>
                <div className="mt-2 text-sm text-slate-600">{u.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-10 ls-section rounded-[32px]">
        <h2 className="text-2xl font-semibold tracking-tight">{t.pricing.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{t.pricing.lead}</p>
        <div className="mt-2 text-[12px] text-slate-500">{t.pricing.hint}</div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {t.pricing.plans.map((p, idx) => {
            const isRec = idx === recommendedIndex;
            return (
              <div
                key={p.name}
                className={cls(
                  "relative rounded-3xl border bg-white p-6",
                  isRec ? "border-[#2b5cff]/35 shadow-[var(--sh-lg)]" : "border-black/10 shadow-[var(--sh-sm)]"
                )}
              >
                {isRec && (
                  <div className="absolute -top-3 left-6 inline-flex items-center rounded-full bg-[#2b5cff] px-3 py-1 text-[12px] font-semibold text-white shadow-sm">
                    Recommended
                  </div>
                )}

                <div className="text-sm font-semibold">{p.name}</div>
                <div className="mt-2 text-xl font-semibold tracking-tight">{p.price}</div>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {p.items.map((x) => (
                    <li key={x} className="flex gap-2">
                      <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#2b5cff]" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={ctaHref}
                  className={cls(
                    "mt-6 inline-flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold shadow-sm",
                    isRec ? "bg-[#2b5cff] text-white hover:opacity-95" : "bg-black/[0.03] text-slate-900 hover:bg-black/[0.06]"
                  )}
                >
                  {t.hero.ctaPrimary}
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-6xl px-5 py-10">
        <h2 className="text-2xl font-semibold tracking-tight">{t.faq.title}</h2>
        <div className="mt-6">
          <FAQAccordion items={t.faq.items} defaultOpenIndex={-1} twoColumn />
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="rounded-[32px] border border-black/10 bg-gradient-to-br from-[#2b5cff]/10 via-white to-emerald-50 p-10 shadow-sm">
          <h2 className="text-3xl font-semibold tracking-tight">{t.final.title}</h2>
          <p className="mt-3 text-sm text-slate-600">{t.final.lead}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href={ctaHref} className="ls-btn ls-btn-primary inline-flex items-center justify-center px-6 py-3">
              {t.final.cta}
            </a>
            <a href={brochureHref} className="ls-btn ls-btn-ghost inline-flex items-center justify-center px-6 py-3 text-slate-900">
              {t.hero.ctaSecondary}
            </a>
          </div>
          <div className="mt-3 text-[12px] text-slate-500">{t.final.sub}</div>
        </div>
      </section>

      <footer className="border-t border-black/5 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-10 text-sm text-slate-500">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>© {new Date().getFullYear()} LedgerSeiri</div>
            <div className="flex gap-4">
              <a className="hover:text-slate-700" href={`/${lang}/lp`}>LP</a>
              <a className="hover:text-slate-700" href={ctaHref}>Login</a>
              <a className="hover:text-slate-700" href={`/${lang}/app`}>App</a>
            </div>
          </div>
        </div>
      </footer>

      <ScrollToTop />
    </main>
  );
}