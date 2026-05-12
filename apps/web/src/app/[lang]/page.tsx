import ScrollToTop from "@/components/ScrollToTop";
import LanguageMenuLP from "@/components/LanguageMenuLP";
import FAQAccordion from "@/components/FAQAccordion";
import type { Metadata } from "next";
import Link from "next/link";
import MarketingFooter from "@/components/MarketingFooter";


export const metadata: Metadata = {
  title: "LedgerSeiri | Amazon出品者向け 売上・注文・在庫・照合管理SaaS",
  description:
    "LedgerSeiriは、日本の中小企業・EC事業者向けに、Amazon注文データの取込、売上確認、SKU別販売分析、在庫管理、銀行明細との照合を支援するクラウドSaaSです。",
};

type Lang = "ja" | "en" | "zh-CN" | "zh-TW";

const I18N: Record<
  Lang,
  {
    nav: { features: string; usecases: string; pricing: string; faq: string; plans: string; login: string; trial: string; resources: string; cases: string; support: string; };
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
    nav: { features: "特長", usecases: "適合/不適合", pricing: "料金", faq: "FAQ", plans: "料金プラン", login: "ログイン", trial: "無料体験",
        resources: "資料一覧",
        cases: "導入事例",
        support: "サポート",},

    hero: {
      eyebrow: "Amazon出品者向け 経営管理SaaS",
      title1: "Amazonの注文・売上・在庫を、",
      title2: "経営管理の形に整理",
      lead: "Amazon注文データの取り込み、SKU別販売分析、在庫管理、銀行明細との照合を支援します。Seller CentralのログインID・パスワードは取得しません。",
      ctaPrimary: "👉 無料で始める",
      ctaSecondary: "👉 解決できる課題を見る",
      note: "※ 本サービスは経営管理を支援するツールです。最終的な申告は税理士等の専門家にご確認ください",
      badges: ["Amazon SP-API連携", "注文データ取込", "SKU別販売分析", "在庫管理", "銀行明細照合"],
    },

    value: {
      title: "売上はあるのに、利益が見えにくいことはありませんか？",
      items: [
        { title: "売上は高いのに、手元に残る利益が見えにくい", desc: "Amazonの売上は確認できても、実際の利益や入金状況が分かりにくいことがあります。" },
        { title: "原価・広告費・運賃などが分散している", desc: "仕入原価、広告費、運賃、税区分などが別々のシステムやCSVに分散しがちです。" },
        { title: "月末・年末まで実態に気づきにくい", desc: "税理士に渡す段階で初めて状況を把握すると、改善判断が遅れます。" },
      ],
    },

    blocks: {
      a: {
        title: "LedgerSeiriは会計ソフトではなく、経営管理を支援するツールです",
        desc: "LedgerSeiriは、EC事業者が分散した注文・売上・在庫・銀行明細データを整理し、日々の経営状況を把握しやすくするクラウドサービスです。会計知識を前提とせず、税理士を代替するものではありません。",
        bullets: ["会計知識を前提にしない", "税理士を代替しない", "日々の経営状況を把握"],
      },
      b: {
        title: "Amazon注文データを整理し、表面的な売上だけでなく販売状況を確認",
        desc: "Amazon注文データを取り込み、注文別・SKU別の売上確認と販売数量の整理を支援します。",
        bullets: ["どの商品が売れたかを確認", "注文・SKU単位で販売数量を整理", "売上だけでなく運営状況を確認"],
      },
      c: {
        title: "在庫数量だけでなく、在庫と販売数量の関係を確認",
        desc: "注文データと在庫データを組み合わせ、販売数量に応じた在庫確認や原価管理を補助します。",
        bullets: ["販売数量に応じた在庫確認", "在庫状況の見える化", "月次で経営状況を確認"],
      },
    },

    grid: {
      title: "主な機能",
      lead: "Amazon出品者の経営管理に必要なデータ整理を支援します。",
      cards: [
        { title: "支出・証憑管理", desc: "支出を記録し、請求書・証憑と紐づけて管理できます。" },
        { title: "経営ダッシュボード", desc: "売上、支出、在庫、インポート履歴を確認し、経営状況を把握します。" },
        { title: "税理士連携用のデータ整理", desc: "売上集計、支出明細、証憑、在庫関連データの整理を支援します。" },
        { title: "AI経営サポート（予定）", desc: "月次状況の確認、異常検知、証憑整理などを段階的に拡張予定です。" },
        { title: "変動要因の確認", desc: "売上や支出の変動要因を確認し、意思決定を補助します。" },
        { title: "税務判断に関する注意", desc: "本サービスの情報は経営管理の参考情報です。最終的な申告は税理士等の専門家にご確認ください。" },
      ],
    },

    usecases: {
      title: "向いている事業者・向いていない事業者",
      lead: "日々の経営データを把握したいAmazon出品者に向いています。",
      items: [
        { title: "向いている：EC事業者・個人事業主", desc: "売上、在庫、支出、入金状況を継続的に把握したい事業者。" },
        { title: "向いている：税理士へ資料を渡す事業者", desc: "月次資料や証憑整理の負担を減らしたい事業者。" },
        { title: "向いていない：申告だけを最低限で済ませたい事業者", desc: "システムが税理士業務を完全に代替することを期待する場合には向きません。" },
      ],
    },

    pricing: {
      title: "料金プラン",
      lead: "Amazon出品者の規模に合わせて段階的に利用できます。",
      hint: "表示価格は税込です。正式な提供条件は特定商取引法に基づく表示および申込画面に従います。",
      plans: [
        { name: "Starter", price: "¥1,980/月", items: ["単一ストア", "注文データ取込", "基本ダッシュボード"] },
        { name: "Standard", price: "¥4,980/月", items: ["SKU別販売分析", "在庫管理", "銀行明細との照合"] },
        { name: "Business", price: "¥9,980/月", items: ["複数ストア", "詳細なインポート履歴", "チーム利用を想定"] },
      ],
    },

    faq: {
      title: "よくある質問",
      items: [
        { q: "LedgerSeiriは会計ソフトですか？", a: "いいえ。LedgerSeiriは会計データ整理と経営管理を支援するSaaSです。" },
        { q: "税理士の代わりになりますか？", a: "いいえ。最終的な申告や税務判断は税理士等の専門家にご確認ください。" },
        { q: "データは何に利用できますか？", a: "売上確認、SKU別販売分析、在庫管理、銀行明細との照合、会計資料整理の補助に利用できます。" },
        { q: "Amazonのパスワードを預ける必要がありますか？", a: "いいえ。LedgerSeiriはSeller CentralのログインID・パスワードを取得しません。Amazon OAuthを通じて承認された範囲でSP-APIを利用します。" },
      ],
    },

    final: {
      title: "税理士に渡す前に、経営状況を把握する",
      lead: "注文、売上、SKU、在庫、銀行明細を整理し、日々の経営判断と資料整理を効率化します。",
      cta: "👉 LedgerSeiriを始める",
      sub: "事後確認ではなく、運営中に数字を確認できる状態を目指します。",
    },
  },

  en: {

    nav: { features: "Features", usecases: "Use cases", pricing: "Pricing", faq: "FAQ", plans: "Plans", login: "Login", trial: "Start free",
        resources: "Resources",
        cases: "Case studies",
        support: "Support",},
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
    nav: { features: "特长", usecases: "场景", pricing: "价格", faq: "FAQ", plans: "价格方案", login: "登录", trial: "免费体验",
        resources: "资料一览",
        cases: "导入事例",
        support: "支持",},
    hero: {
      eyebrow: "面向跨境电商卖家的经营级 SaaS",
      title1: "销售、广告、退款、Amazon注文データ——",
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
      title: "よくある質問",
      items: [
        { q: "免费体验后会自动扣费吗？", a: "目前不会。未来如引入订阅，也会清晰提示并由你确认。" },
        { q: "支持哪些平台？", a: "优先 Amazon，后续逐步扩展其它平台/支付/物流数据。" },
        { q: "能直接报税吗？", a: "短期聚焦经营记账与数据整合，报税以导出/协助为主。" },
      ],
    },
    final: { title: "从今天开始，把经营数字整理清楚。", lead: "先体验 Dashboard，我们会根据反馈快速迭代。", cta: "免费体验", sub: "欢迎你告诉我：你最想先解决哪一类“记账痛点”。" },
  },

  "zh-TW": {
    nav: { features: "特長", usecases: "場景", pricing: "價格", faq: "FAQ", plans: "價格方案", login: "登入", trial: "免費體驗",
        resources: "資料一覽",
        cases: "導入事例",
        support: "支援",},
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

    const featuresHref = `/${lang}/features`;
    const pricingHref = `/${lang}/pricing`;
    const resourcesHref = `/${lang}/resources`;
    const usecasesHref = `/${lang}/usecases`;
    const casesHref = `/${lang}/cases`;
    const supportHref = `/${lang}/support`;

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
    <a href={`/${lang}`} className="flex items-center gap-3">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#2b5cff] text-white text-sm font-bold shadow-sm">
        LS
      </span>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">LedgerSeiri</div>
        <div className="text-[12px] text-slate-500">Seller Operations SaaS</div>
      </div>
    </a>

    {/* Center menu (desktop) */}
    <nav className="hidden lg:flex items-center gap-1 rounded-full border border-black/10 bg-white/60 px-2 py-1 shadow-sm backdrop-blur">
      <a href={featuresHref} className="rounded-full px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-black/[0.04]">
        {t.nav.features}
      </a>
      <a href={pricingHref} className="rounded-full px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-black/[0.04]">
        {t.nav.pricing}
      </a>
      <a href={resourcesHref} className="rounded-full px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-black/[0.04]">
        {t.nav.resources}
      </a>
      <a href={usecasesHref} className="rounded-full px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-black/[0.04]">
        {t.nav.usecases}
      </a>
      <a href={casesHref} className="rounded-full px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-black/[0.04]">
        {t.nav.cases}
      </a>
      <a href={supportHref} className="rounded-full px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-black/[0.04]">
        {t.nav.support}
      </a>
    </nav>

    {/* Right actions (keep) */}
    <div className="flex items-center gap-2">
      <LanguageMenuLP current={lang} />
      <a
        href={ctaHref}
        className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-black/10 bg-white/70 px-4 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur hover:bg-white/80 active:scale-[0.99]"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[#2b5cff]" aria-hidden="true">
          <path d="M10 7h8m0 0v10m0-10-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.65" />
        </svg>
        <span>{t.nav.login}</span>
      </a>
      <a
        href={registerHref}
        className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full bg-rose-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-rose-600 active:scale-[0.99]"
      >
        {t.nav.trial}
      </a>
    </div>
  </div>

  {/* Mobile menu (simple chips) */}
  <div className="lg:hidden border-t border-black/5 bg-white/60 backdrop-blur">
    <div className="mx-auto max-w-6xl px-5 py-2 flex gap-2 overflow-x-auto">
      <a href={featuresHref} className="shrink-0 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-sm font-semibold text-slate-700">{t.nav.features}</a>
      <a href={pricingHref} className="shrink-0 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-sm font-semibold text-slate-700">{t.nav.pricing}</a>
      <a href={resourcesHref} className="shrink-0 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-sm font-semibold text-slate-700">{t.nav.resources}</a>
      <a href={usecasesHref} className="shrink-0 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-sm font-semibold text-slate-700">{t.nav.usecases}</a>
      <a href={casesHref} className="shrink-0 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-sm font-semibold text-slate-700">{t.nav.cases}</a>
      <a href={supportHref} className="shrink-0 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-sm font-semibold text-slate-700">{t.nav.support}</a>
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
                <div className="text-[12px] text-slate-500">Orders / Sales / SKU / Inventory</div>
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
                  ※ 画面は機能説明用のイメージです。実際の表示内容は利用状況により異なります。
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
                  <div className="text-[12px] text-slate-500">機能イメージ</div>
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
      <ScrollToTop />
    
      {/* Amazon Public Developer review support: keep existing LP layout, append compliance cards */}
      <section id="amazon-sp-api" className="mx-auto max-w-7xl px-5 py-16">
        <div className="rounded-[2rem] border border-[#2b5cff]/15 bg-white/85 p-6 shadow-[var(--sh-md)] backdrop-blur md:p-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="text-sm font-bold text-[#2b5cff]">Amazon SP-API / OAuth</div>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Amazon連携について
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              LedgerSeiriは、出品者がAmazon OAuthを通じて明示的に承認した場合にのみ、
              Amazon Selling Partner API（SP-API）を通じて出品者自身の注文データへアクセスします。
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-black/10 bg-slate-50 p-5">
              <h3 className="text-base font-black text-slate-950">OAuthによる明示的な承認</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Amazon連携は、出品者本人が承認した場合にのみ開始されます。Seller CentralのログインID・パスワードは取得しません。
              </p>
            </div>

            <div className="rounded-3xl border border-black/10 bg-slate-50 p-5">
              <h3 className="text-base font-black text-slate-950">取得するAmazonデータ</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                注文ID、注文日時、注文ステータス、マーケットプレイスID、SKU、ASIN、商品名、販売数量、商品価格など、注文管理に必要な範囲に限定します。
              </p>
            </div>

            <div className="rounded-3xl border border-black/10 bg-slate-50 p-5">
              <h3 className="text-base font-black text-slate-950">利用目的</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                売上確認、SKU別販売分析、在庫管理、銀行明細との照合、インポート履歴管理、会計資料整理の補助に利用します。
              </p>
            </div>

            <div className="rounded-3xl border border-black/10 bg-slate-50 p-5">
              <h3 className="text-base font-black text-slate-950">データ保護</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Amazon連携トークンはサーバー側で管理し、refresh token等は暗号化して保存します。access token、refresh token、client secretをブラウザへ返却しません。
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-black/10 bg-white p-5">
              <h3 className="text-base font-black text-slate-950">取得しない情報</h3>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
                <li>・Seller CentralのログインID・パスワード</li>
                <li>・クレジットカード情報</li>
                <li>・初期連携では購入者の氏名・住所・電話番号などの購入者個人情報を利用目的の対象外とします</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white p-5">
              <h3 className="text-base font-black text-slate-950">第三者販売・広告利用なし</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                取得したAmazonデータを第三者に販売せず、広告目的で利用せず、利用目的の範囲を超えて共有しません。
              </p>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white p-5">
              <h3 className="text-base font-black text-slate-950">連携解除・削除</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                出品者はいつでもAmazon連携の解除を依頼できます。不要になった連携情報は削除または無効化できます。
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm font-bold">
            <Link className="rounded-full border border-black/10 bg-white px-5 py-3 text-slate-800 hover:bg-slate-50" href={`/${lang}/privacy`}>
              プライバシーポリシー
            </Link>
            <Link className="rounded-full border border-black/10 bg-white px-5 py-3 text-slate-800 hover:bg-slate-50" href={`/${lang}/security`}>
              セキュリティ
            </Link>
            <Link className="rounded-full border border-black/10 bg-white px-5 py-3 text-slate-800 hover:bg-slate-50" href={`/${lang}/commerce`}>
              特定商取引法に基づく表示
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter lang={lang} />
</main>
  );
}