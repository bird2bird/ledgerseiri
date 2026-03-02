"use client";

import { useMemo, useState } from "react";
import LanguageMenuLP from "@/components/LanguageMenuLP";

type Lang = "ja" | "en" | "zh-CN" | "zh-TW";
type Billing = "monthly" | "yearly";
type PlanKey = "starter" | "standard" | "ai";

function cn(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function getLangFromPath(pathname: string): Lang {
  const seg = (pathname.split("/")[1] || "ja") as Lang;
  return seg === "ja" || seg === "en" || seg === "zh-CN" || seg === "zh-TW" ? seg : "ja";
}

function fmtJPY(n: number) {
  return new Intl.NumberFormat("ja-JP").format(Math.round(n));
}

const YEARLY_DISCOUNT = 0.25; // 25% OFF
const YEARLY_FACTOR = 1 - YEARLY_DISCOUNT; // 0.75

function yearlyTotalFromMonthly(m: number) {
  return m * 12 * YEARLY_FACTOR;
}
function yearlyEqMonthly(m: number) {
  return m * YEARLY_FACTOR;
}
function yearlySave(m: number) {
  return m * 12 - yearlyTotalFromMonthly(m);
}

type Plan = {
  key: PlanKey;
  name: string;
  monthly: number;
  tagline: string;
  items: string[];
  fit: string[];
  recommended?: boolean;
};

type Badge = { k: string; v: string; sub: string };
type QA = { q: string; a: string };
type T = {
  nav: { home: string; login: string; trial: string };
  hero: { eyebrow: string; h1: string; h2: string; note: string };
  billing: { monthly: string; yearly: string; yearlyOff: string; save: string; annualTotal: string; eqMonthly: string };
  slider: { title: string; hint: string; left: string; right: string };
  simulator: { title: string; lead: string; input: string; placeholder: string; rec: string; why: string; tip: string };
  compare: { title: string; left: string; right: string; leftItems: string[]; rightItems: string[] };
  plans: { title: string; lead: string; disclaimer: string; ctaTrial: string; ctaLogin: string; recommended: string };
  trust: { title: string; badges: Badge[]; voices: string; note: string; samples: { name: string; role: string; title: string; quote: string }[] };
  ai: { title: string; lead: string; items: string[]; note: string };
  faq: { title: string; items: QA[] };
  bottom: { title: string; lead: string; cta: string; sub: string };
};

const I18N: Record<Lang, T> = {
  ja: {
    nav: { home: "ホーム", login: "ログイン", trial: "無料で体験" },
    hero: {
      eyebrow: "料金プラン（クロスボーダーEC向け）",
      h1: "まずは無料で。必要になったら、賢くアップグレード。",
      h2: "年契約は 25%OFF。売上規模に合わせて“無理なく続く価格”で。",
      note: "※ 本サービスは経営参考ツールです。最終申告は税理士判断に基づいてください。",
    },
    billing: {
      monthly: "月契約",
      yearly: "年契約",
      yearlyOff: "年契約 25%OFF",
      save: "節約",
      annualTotal: "年額合計",
      eqMonthly: "月換算",
    },
    slider: {
      title: "価格対比スライダー（弥生風）",
      hint: "右にスライドすると、年契約の“お得さ”が見えます。",
      left: "月契約",
      right: "年契約（25%OFF）",
    },
    simulator: {
      title: "经营规模シミュレーター",
      lead: "月の売上規模から、あなたに合うプランをおすすめします（目安）。",
      input: "月の売上（JPY）",
      placeholder: "例）1500000",
      rec: "おすすめプラン",
      why: "おすすめ理由",
      tip: "※ あくまで目安です（店舗数/SKU/広告運用でも最適は変わります）。",
    },
    compare: {
      title: "「ある」vs「ない」：経営の見え方が変わる",
      left: "LedgerSeiri なし",
      right: "LedgerSeiri あり",
      leftItems: [
        "売上は見えるが、利益の正体がわからない",
        "広告費・送料・税が各所に散在",
        "年末に焦って資料集め→判断が遅れる",
        "税理士が来て初めて現実を知る",
      ],
      rightItems: [
        "販売・費用・利益が同じ画面で一貫して見える",
        "“何にいくら使ったか”が一目でわかる",
        "月次で改善点が見える→手を打てる",
        "税理士との共有がスムーズ（出力/証憑整理）",
      ],
    },
    plans: {
      title: "料金プラン",
      lead: "無料で始めて、必要に応じてアップグレード。年契約なら 25%OFF。",
      disclaimer:
        "※ 表示は経営参考です。AI は税務/法律助言ではありません。最終申告は税理士判断に基づいてください。",
      ctaTrial: "無料で体験",
      ctaLogin: "ログイン",
      recommended: "おすすめ",
    },
    trust: {
      title: "信頼背書き（転化を支える理由）",
      badges: [
        { k: "月次整理", v: "迷いを減らす導線", sub: "取引・費用・証憑を同じ導線で整理" },
        { k: "見える化", v: "数字→判断", sub: "売上・費用・在庫・利益をつなぐ" },
        { k: "税理士連携", v: "渡しやすい出力", sub: "明細＋証憑＋在庫参考を想定" },
      ],
      voices: "Amazon Seller 画像（サンプル）",
      note: "※ 画像/推薦文はサンプル（後で実ユーザー/ロゴに差し替え可能）",
      samples: [
        { name: "Sato", role: "Amazon個人事業主", title: "月次の“盲点”が減った", quote: "手数料と広告の影響が月次で見えると、打ち手が早い。" },
        { name: "Chen", role: "越境EC（小規模法人）", title: "証憑が揃って安心", quote: "費用と領収書が紐づくと、年末の地獄が減る。" },
        { name: "Yamada", role: "複数ストア運用", title: "比較がラク", quote: "店ごとの利益感覚が揃い、投資判断が速くなった。" },
      ],
    },
    ai: {
      title: "AI Premium 専属强化（上位プラン）",
      lead: "数字を“解釈できる情報”へ。経営判断を速くします。",
      items: ["AI 月度经营解读", "异常与风险提示", "对话式查询", "发票智能识别与匹配（计划）"],
      note: "※ AI は経営参考の支援機能です。税務/法律の最終判断は専門家へ。",
    },
    faq: {
      title: "FAQ（価格/契約）",
      items: [
        { q: "無料体験のあと、自動課金されますか？", a: "現状は自動課金しません。あなたの明示操作でのみ課金が開始される設計です。" },
        { q: "年契約はどれくらいお得ですか？", a: "年契約は月額換算で 25%OFF（0.75倍）です。節約額は自動計算します。" },
        { q: "途中でプラン変更できますか？", a: "はい。アップグレード/ダウングレードを分かりやすく提供します（予定）。" },
      ],
    },
    bottom: {
      title: "まずは無料で。10分で“最初の利益概览”へ。",
      lead: "売上規模に合わせて、最適なプランにスムーズに移行できます。",
      cta: "無料で体験を開始",
      sub: "最終申告は税理士判断に基づいてください（本サービスは経営参考）。",
    },
  },

  en: {
    nav: { home: "Home", login: "Login", trial: "Start free" },
    hero: { eyebrow: "Pricing", h1: "Start free. Upgrade only when it pays off.", h2: "Yearly is 25% off. Pick what matches your scale.", note: "* Business insights tool. Final filing by professionals." },
    billing: { monthly: "Monthly", yearly: "Yearly", yearlyOff: "Yearly 25% off", save: "Save", annualTotal: "Annual total", eqMonthly: "Per month" },
    slider: { title: "Savings slider", hint: "Slide right to see yearly savings.", left: "Monthly", right: "Yearly (25% off)" },
    simulator: { title: "Scale simulator", lead: "Estimate the best plan from monthly sales (rough guide).", input: "Monthly sales (JPY)", placeholder: "e.g. 1500000", rec: "Recommended", why: "Why", tip: "* Guideline only; store/SKU/ads can change the best fit." },
    compare: { title: "With vs without LedgerSeiri", left: "Without", right: "With", leftItems: ["Revenue looks good, profit unclear", "Costs scattered", "Year-end scramble", "Learn the truth too late"], rightItems: ["Sales/costs/profit in one view", "Clear cost mix", "Monthly improvement loop", "Easier handoff to accountants"] },
    plans: { title: "Plans", lead: "Start free, upgrade as needed. Yearly is 25% off.", disclaimer: "* AI is not legal/tax advice. Final filing by professionals.", ctaTrial: "Start free", ctaLogin: "Login", recommended: "Recommended" },
    trust: { title: "Trust signals", badges: [{ k: "Workflow", v: "Designed for clarity", sub: "Transactions + expenses + receipts in one flow" }, { k: "Visibility", v: "From data to decisions", sub: "Sales, costs, inventory, profit connected" }, { k: "Accountant-ready", v: "Export-friendly", sub: "Details + receipts + inventory references" }], voices: "Amazon seller profiles (sample)", note: "* Placeholders. Replace with real users/logos later.", samples: [{ name: "Sato", role: "Amazon seller", title: "Fewer blind spots", quote: "Seeing fees and ads together speeds up decisions." }, { name: "Chen", role: "Cross-border SME", title: "Receipts under control", quote: "Linking expenses with receipts prevents year-end panic." }, { name: "Yamada", role: "Multi-store operator", title: "Easy comparisons", quote: "Comparable profitability changes how we invest." }] },
    ai: { title: "AI Premium", lead: "Turn numbers into actionable insights.", items: ["Monthly AI summary", "Anomaly & risk alerts", "Chat-style queries", "Receipt OCR & matching (planned)"], note: "* AI provides business insights only; not legal/tax advice." },
    faq: { title: "FAQ", items: [{ q: "Auto-charge after trial?", a: "No. Billing will be explicit and opt-in." }, { q: "How much do I save yearly?", a: "Yearly is 25% off. Savings are calculated automatically." }, { q: "Can I change plans?", a: "Yes. Upgrade/downgrade will be supported (planned)." }] },
    bottom: { title: "Start free. Get your first profit overview in ~10 minutes.", lead: "Switch plans smoothly as your business grows.", cta: "Start free", sub: "* Final filing by professionals." },
  },

  "zh-CN": {
    nav: { home: "首页", login: "登录", trial: "免费体验" },
    hero: { eyebrow: "价格方案", h1: "从免费开始，用得上再升级。", h2: "年付 25% 优惠。按经营规模选择最合适方案。", note: "※ 经营参考工具，最终申告以税理士判断为准。" },
    billing: { monthly: "月付", yearly: "年付", yearlyOff: "年付 25% 优惠", save: "节省", annualTotal: "年付总价", eqMonthly: "月换算" },
    slider: { title: "价格对比滑块", hint: "往右滑动，直观看到年付能省多少。", left: "月付", right: "年付（25%OFF）" },
    simulator: { title: "经营规模模拟器", lead: "输入月销售额，推荐合适方案（仅供参考）。", input: "月销售额（JPY）", placeholder: "例如：1500000", rec: "推荐方案", why: "推荐理由", tip: "※ 仅供参考；店铺数/SKU/广告规模会影响最优选择。" },
    compare: { title: "有 vs 没有 LedgerSeiri", left: "没有", right: "有", leftItems: ["只看到销售额，看不清利润结构", "广告/运费/税分散", "年底才补资料，决策滞后", "税理士来了才发现问题"], rightItems: ["销售/成本/费用/利润一体化", "成本结构一眼可见", "按月复盘、及时调整", "税理士协作更顺畅（导出/证凭整理）"] },
    plans: { title: "价格方案", lead: "免费开始，按需要升级。年付 25% 优惠。", disclaimer: "※ AI 不构成税务/法律意见。最终申告以税理士判断为准。", ctaTrial: "免费体验", ctaLogin: "登录", recommended: "推荐" },
    trust: { title: "信任背书", badges: [{ k: "月度整理", v: "更快更清楚", sub: "交易+支出+证凭同一路径" }, { k: "经营看板", v: "把钱看懂", sub: "销售/成本/库存/利润连接起来" }, { k: "税理士协作", v: "交付更省事", sub: "明细+证凭+库存参考更好给" }], voices: "Amazon seller 画像（示例）", note: "※ 示例文案/头像可替换成真实用户/Logo", samples: [{ name: "佐藤", role: "Amazon 个人卖家", title: "少了很多经营盲区", quote: "统一看板后，调整更快。" }, { name: "陈", role: "跨境小团队", title: "证凭更安心", quote: "费用和证凭绑定后，沟通成本下降。" }, { name: "山田", role: "多店铺运营", title: "对比更轻松", quote: "店铺利润结构统一后，判断更快。" }] },
    ai: { title: "AI Premium 专属强化", lead: "把数字变成能用的信息。", items: ["AI 月度经营解读", "异常与风险提示", "对话式查询", "发票识别与匹配（计划）"], note: "※ AI 仅提供经营参考，不构成税务/法律意见。" },
    faq: { title: "FAQ", items: [{ q: "免费体验后会自动扣费吗？", a: "目前不会。未来上线订阅也会由你确认后才开始计费。" }, { q: "年付能省多少？", a: "年付按月换算 25%OFF（0.75 倍），节省额自动计算。" }, { q: "可以随时升级/降级吗？", a: "可以（规划）。" }] },
    bottom: { title: "先免费开始，10 分钟看到第一份利润概览。", lead: "规模变大再升级，不浪费。", cta: "现在开始免费体验", sub: "※ 最终申告以税理士判断为准（本服务仅供经营参考）。" },
  },

  "zh-TW": {
    nav: { home: "首頁", login: "登入", trial: "免費體驗" },
    hero: { eyebrow: "價格方案", h1: "從免費開始，用得上再升級。", h2: "年付 25% 優惠。依規模選最合適方案。", note: "※ 經營參考工具，最終申告以稅理士判斷為準。" },
    billing: { monthly: "月付", yearly: "年付", yearlyOff: "年付 25% 優惠", save: "節省", annualTotal: "年付總價", eqMonthly: "月換算" },
    slider: { title: "價格對比滑塊", hint: "往右滑，直觀看到年付省多少。", left: "月付", right: "年付（25%OFF）" },
    simulator: { title: "經營規模模擬器", lead: "輸入月銷售額，推薦合適方案（僅供參考）。", input: "月銷售額（JPY）", placeholder: "例如：1500000", rec: "推薦方案", why: "推薦理由", tip: "※ 僅供參考；店舖/SKU/廣告規模會影響最適選擇。" },
    compare: { title: "有 vs 沒有 LedgerSeiri", left: "沒有", right: "有", leftItems: ["只看得到營收，看不懂利潤", "廣告/運費/稅分散", "年末才補資料", "稅理士來了才發現問題"], rightItems: ["銷售/成本/費用/利潤一體化", "成本結構一眼可見", "按月復盤、即時調整", "稅理士協作更順（導出/證憑整理）"] },
    plans: { title: "價格方案", lead: "免費開始，按需要升級。年付 25% 優惠。", disclaimer: "※ AI 不構成稅務/法律意見。最終申告以稅理士判斷為準。", ctaTrial: "免費體驗", ctaLogin: "登入", recommended: "推薦" },
    trust: { title: "信任背書", badges: [{ k: "月度整理", v: "更快更清楚", sub: "交易+支出+證憑同一路徑" }, { k: "經營看板", v: "把錢看懂", sub: "銷售/成本/庫存/利潤連起來" }, { k: "稅理士協作", v: "交付更省事", sub: "明細+證憑+庫存參考更好給" }], voices: "Amazon seller 画像（示例）", note: "※ 示例可替換為真實用戶/Logo", samples: [{ name: "佐藤", role: "Amazon 個人賣家", title: "少了很多盲區", quote: "統一看板後，調整更快。" }, { name: "陳", role: "跨境小團隊", title: "證憑更安心", quote: "費用與證憑綁定後，溝通成本下降。" }, { name: "山田", role: "多店舖運營", title: "對比更輕鬆", quote: "利潤結構統一後，判斷更快。" }] },
    ai: { title: "AI Premium 專屬強化", lead: "把數字變成能用的資訊。", items: ["AI 月度經營解讀", "異常與風險提示", "對話式查詢", "發票識別與匹配（計畫）"], note: "※ AI 僅提供經營參考，不構成稅務/法律意見。" },
    faq: { title: "FAQ", items: [{ q: "免費體驗後會自動扣費嗎？", a: "目前不會。未來訂閱也會由你確認後才計費。" }, { q: "年付能省多少？", a: "年付按月換算 25%OFF（0.75 倍），節省額自動計算。" }, { q: "可以隨時升級/降級嗎？", a: "可以（規劃）。" }] },
    bottom: { title: "先免費開始，10 分鐘看到第一份利潤概覽。", lead: "規模變大再升級，不浪費。", cta: "現在開始免費體驗", sub: "※ 最終申告以稅理士判斷為準（本服務僅供經營參考）。" },
  },
};

const PLANS: Record<Lang, Plan[]> = {
  ja: [
    { key: "starter", name: "Starter", monthly: 980, tagline: "まずはここから（個人〜小規模）", items: ["単一ストア", "基本ダッシュボード", "取引/費用の基本管理"], fit: ["月商〜100万円目安", "SKU 少なめ", "広告運用は軽め"] },
    { key: "standard", name: "Standard", monthly: 1980, tagline: "一番おすすめ（経営の見える化）", items: ["複数ストア", "推移/集計の強化", "証憑（領収書/請求書）紐付け"], fit: ["月商100万〜500万円目安", "広告運用あり", "月次で改善したい"], recommended: true },
    { key: "ai", name: "AI Pro", monthly: 4980, tagline: "AIで“経営の解釈”まで", items: ["AI 月次サマリー（計画）", "異常/リスク検知（計画）", "対話式検索（計画）"], fit: ["月商500万円〜", "複数担当/外注あり", "意思決定を速くしたい"] },
  ],
  en: [
    { key: "starter", name: "Starter", monthly: 980, tagline: "Start simple", items: ["Single store", "Basic dashboard", "Transactions & expenses"], fit: ["~¥1M/mo", "Few SKUs", "Light ads"] },
    { key: "standard", name: "Standard", monthly: 1980, tagline: "Recommended for most", items: ["Multi-store", "Trends & summaries", "Receipt linking"], fit: ["¥1M–¥5M/mo", "Running ads", "Monthly loop"], recommended: true },
    { key: "ai", name: "AI Pro", monthly: 4980, tagline: "AI insights", items: ["Monthly AI summary (planned)", "Anomaly alerts (planned)", "Chat queries (planned)"], fit: ["¥5M+/mo", "Teams", "Faster decisions"] },
  ],
  "zh-CN": [
    { key: "starter", name: "Starter", monthly: 980, tagline: "从这里开始（个人/小规模）", items: ["单店铺", "基础看板", "交易/支出管理"], fit: ["月销~100万日元", "SKU 较少", "广告较轻"] },
    { key: "standard", name: "Standard", monthly: 1980, tagline: "最推荐（经营可视化）", items: ["多店铺", "趋势/汇总增强", "证凭上传与绑定"], fit: ["月销100万〜500万", "有广告投放", "需要月度复盘"], recommended: true },
    { key: "ai", name: "AI Pro", monthly: 4980, tagline: "AI 把数字变成信息", items: ["AI 月度解读（计划）", "异常/风险提示（计划）", "对话式查询（计划）"], fit: ["月销500万以上", "多人协作/外包", "更快决策"] },
  ],
  "zh-TW": [
    { key: "starter", name: "Starter", monthly: 980, tagline: "從這裡開始（個人/小規模）", items: ["單店舖", "基礎看板", "交易/支出管理"], fit: ["月銷~100萬日圓", "SKU 較少", "廣告較輕"] },
    { key: "standard", name: "Standard", monthly: 1980, tagline: "最推薦（經營可視化）", items: ["多店舖", "趨勢/彙總增強", "證憑上傳與綁定"], fit: ["月銷100萬〜500萬", "有廣告投放", "需要月度復盤"], recommended: true },
    { key: "ai", name: "AI Pro", monthly: 4980, tagline: "AI 把數字變成資訊", items: ["AI 月度解讀（計畫）", "異常/風險提示（計畫）", "對話式查詢（計畫）"], fit: ["月銷500萬以上", "多人協作/外包", "更快決策"] },
  ],
} as any;

// Fix the Python-like True above (in case build tools grep). This is runtime TS, so we normalize below.
(Object.keys(PLANS) as Lang[]).forEach((lg) => {
  PLANS[lg] = PLANS[lg].map((p: any) => ({ ...p, recommended: p.recommended === true || p.recommended === "true" }));
});

function recommendBySales(sales: number): { key: PlanKey; why: string[] } {
  // simple thresholds, adjust later
  if (!Number.isFinite(sales) || sales <= 0) {
    return { key: "standard", why: ["入力値が不正のため、Standard を基準におすすめします。"] };
  }
  if (sales < 1_000_000) {
    return { key: "starter", why: ["規模が小さめ → まずは基本の見える化で十分", "固定費を抑えつつ運用の型を作れる"] };
  }
  if (sales < 5_000_000) {
    return { key: "standard", why: ["広告/費用が増えやすい → 集計と証憑が効く", "月次で改善サイクルを回しやすい"] };
  }
  return { key: "ai", why: ["規模が大きい → 解釈/異常検知の費用対効果が高い", "意思決定を速くしたい"] };
}

function Avatar({ name }: { name: string }) {
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/);
    const a = (parts[0] || "U")[0]?.toUpperCase() || "U";
    const b = (parts[1] || "")[0]?.toUpperCase() || "";
    return (a + b).slice(0, 2);
  }, [name]);

  return (
    <div className="h-11 w-11 rounded-2xl border border-black/10 bg-white/80 shadow-sm flex items-center justify-center font-semibold text-slate-700">
      {initials}
    </div>
  );
}

export default function PricingPage() {
  const lang = typeof window !== "undefined" ? getLangFromPath(window.location.pathname) : "ja";
  const t = I18N[lang];
  const plans = PLANS[lang];

  const homeHref = `/${lang}`;
  const loginHref = `/${lang}/login`;
  const trialHref = `/${lang}/register`;

  // ① Slider + billing sync
  const [slider, setSlider] = useState<number>(80); // default: yearly side
  const billing: Billing = slider >= 50 ? "yearly" : "monthly";

  // ② Simulator
  const [salesInput, setSalesInput] = useState<string>("1500000");
  const sales = useMemo(() => {
    const v = Number((salesInput || "").replace(/,/g, ""));
    return Number.isFinite(v) ? v : 0;
  }, [salesInput]);

  const rec = useMemo(() => recommendBySales(sales), [sales]);
  const recPlan = useMemo(() => plans.find((p) => p.key === rec.key) || plans[1], [plans, rec.key]);

  const priceLabel = (monthly: number) => {
    if (billing === "monthly") return `¥${fmtJPY(monthly)}/mo`;
    return `¥${fmtJPY(yearlyEqMonthly(monthly))}/mo`;
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#2b5cff]/14 via-sky-100/55 to-transparent blur-2xl" />
        <div className="absolute top-[520px] left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-gradient-to-br from-emerald-100/45 via-white to-transparent blur-2xl" />
        <div className="absolute top-[980px] left-1/2 h-[420px] w-[920px] -translate-x-1/2 rounded-full bg-gradient-to-br from-rose-100/35 via-white to-transparent blur-2xl" />
      </div>

      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <a href={homeHref} className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#2b5cff] text-white text-sm font-bold shadow-sm">
              LS
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">LedgerSeiri</div>
              <div className="text-[12px] text-slate-500">Pricing</div>
            </div>
          </a>

          <div className="flex items-center gap-2">
            <LanguageMenuLP current={lang} />
            <a
              href={loginHref}
              className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-black/10 bg-white/70 px-4 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur hover:bg-white/80 active:scale-[0.99]"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[#2b5cff]" aria-hidden="true">
                <path d="M10 7h8m0 0v10m0-10-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.65" />
              </svg>
              <span>{t.nav.login}</span>
            </a>

            <a
              href={trialHref}
              className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full bg-rose-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-rose-600 active:scale-[0.99]"
            >
              {t.nav.trial}
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pt-12 pb-10">
        <div className="grid grid-cols-12 gap-8 items-start">
          <div className="col-span-12 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[12px] text-slate-700 shadow-sm">
              <span className="inline-flex h-2 w-2 rounded-full bg-[#2b5cff]" />
              <span className="font-medium">{t.hero.eyebrow}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">{t.billing.yearlyOff}</span>
            </div>

            <h1 className="mt-4 text-4xl leading-[1.1] tracking-tight font-semibold md:text-5xl">{t.hero.h1}</h1>
            <p className="mt-4 text-base text-slate-600 md:text-lg">{t.hero.h2}</p>
            <div className="mt-3 text-[12px] text-slate-500">{t.hero.note}</div>

            {/* ① Pricing slider */}
            <div className="mt-7 rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="text-sm font-semibold">{t.slider.title}</div>
                  <div className="mt-1 text-sm text-slate-600">{t.slider.hint}</div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] text-slate-500">{billing === "yearly" ? t.slider.right : t.slider.left}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{billing === "yearly" ? t.billing.yearlyOff : t.billing.monthly}</div>
                </div>
              </div>

              <div className="mt-5">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={slider}
                  onChange={(e) => setSlider(Number(e.target.value))}
                  className="w-full accent-[#2b5cff]"
                  aria-label="billing slider"
                />
                <div className="mt-2 flex justify-between text-[12px] text-slate-500">
                  <span>{t.slider.left}</span>
                  <span>{t.slider.right}</span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSlider(0)}
                  className={cn(
                    "inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold transition border shadow-sm",
                    billing === "monthly"
                      ? "bg-[#2b5cff] text-white border-[#2b5cff]"
                      : "bg-white/70 text-slate-700 border-black/10 hover:bg-white"
                  )}
                >
                  {t.billing.monthly}
                </button>
                <button
                  type="button"
                  onClick={() => setSlider(100)}
                  className={cn(
                    "inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-semibold transition border shadow-sm",
                    billing === "yearly"
                      ? "bg-[#2b5cff] text-white border-[#2b5cff]"
                      : "bg-white/70 text-slate-700 border-black/10 hover:bg-white"
                  )}
                >
                  {t.billing.yearly}
                </button>

                <div className="ml-auto flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 h-9 text-[12px] text-slate-700 shadow-sm">
                  <span className="font-medium">{t.billing.yearlyOff}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600">
                    {t.billing.save}: <span className="font-semibold text-emerald-700">25%</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ② Simulator */}
          <div className="col-span-12 lg:col-span-5">
            <div className="rounded-3xl border border-black/10 bg-white/85 p-6 shadow-sm">
              <div className="text-sm font-semibold">{t.simulator.title}</div>
              <div className="mt-2 text-sm text-slate-600">{t.simulator.lead}</div>

              <div className="mt-5">
                <div className="text-[12px] text-slate-500">{t.simulator.input}</div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={salesInput}
                    onChange={(e) => setSalesInput(e.target.value)}
                    placeholder={t.simulator.placeholder}
                    inputMode="numeric"
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-[#2b5cff]/40 focus:ring-2 focus:ring-[#2b5cff]/10"
                  />
                  <span className="text-sm text-slate-500">JPY</span>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-black/10 bg-gradient-to-br from-[#2b5cff]/10 via-white to-emerald-50 p-5">
                <div className="text-[12px] text-slate-600">{t.simulator.rec}</div>
                <div className="mt-1 text-xl font-semibold">{recPlan.name}</div>

                <div className="mt-3 text-[12px] text-slate-600">{t.simulator.why}</div>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {rec.why.map((x) => (
                    <li key={x} className="flex gap-2">
                      <span className="mt-2 inline-flex h-2 w-2 rounded-full bg-[#2b5cff]" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 text-[12px] text-slate-500">{t.simulator.tip}</div>
              </div>

              <div className="mt-5 flex gap-2">
                <a
                  href={trialHref}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-rose-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-rose-600 active:scale-[0.99]"
                >
                  {t.nav.trial}
                </a>
                <a
                  href={loginHref}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-black/10 bg-white/70 px-5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-white active:scale-[0.99]"
                >
                  {t.nav.login}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ③ Compare */}
      <section className="mx-auto max-w-6xl px-5 py-8">
        <h2 className="text-2xl font-semibold tracking-tight">{t.compare.title}</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-black/10 bg-white/85 p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-800">{t.compare.left}</div>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {t.compare.leftItems.map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/[0.05] text-slate-500">–</span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-[#2b5cff]/25 bg-gradient-to-br from-[#2b5cff]/10 via-white to-emerald-50 p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">{t.compare.right}</div>
            <ul className="mt-4 space-y-2 text-sm text-slate-800">
              {t.compare.rightItems.map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#2b5cff] text-white">✓</span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <h2 className="text-2xl font-semibold tracking-tight">{t.plans.title}</h2>
        <p className="mt-2 text-sm text-slate-600">{t.plans.lead}</p>
        <div className="mt-3 text-[12px] text-slate-500">{t.plans.disclaimer}</div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {plans.map((pl) => {
            const isRec = !!pl.recommended;
            const yTotal = yearlyTotalFromMonthly(pl.monthly);
            const yEq = yearlyEqMonthly(pl.monthly);
            const save = yearlySave(pl.monthly);

            return (
              <div
                key={pl.key}
                className={cn(
                  "relative rounded-3xl border border-black/10 bg-white/85 p-6 shadow-sm transition hover:shadow-lg",
                  isRec && "border-[#2b5cff]/25 bg-gradient-to-br from-[#2b5cff]/10 via-white to-emerald-50",
                  isRec && billing === "yearly" && "ring-2 ring-[#2b5cff]/30 scale-[1.02]"
                )}
              >
                {isRec && (
                  <div className="absolute -top-3 left-6 inline-flex items-center gap-2 rounded-full bg-[#2b5cff] px-3 py-1 text-[12px] font-semibold text-white shadow-sm">
                    {t.plans.recommended}
                  </div>
                )}

                <div className="text-sm font-semibold">{pl.name}</div>
                <div className="mt-1 text-[12px] text-slate-600">{pl.tagline}</div>

                <div className="mt-4">
                  <div className="text-[12px] text-slate-500">{billing === "yearly" ? t.billing.eqMonthly : t.billing.monthly}</div>
                  <div className="mt-1 text-3xl font-semibold tracking-tight">{priceLabel(pl.monthly)}</div>
                {billing === "yearly" && (
                  <div className="mt-4 rounded-2xl border border-[#2b5cff]/20 bg-gradient-to-br from-white via-sky-50 to-emerald-50 px-5 py-4 shadow-sm">
                    {/* YAYOI_COMPARE_BLOCK */}
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      
                      {/* Monthly side */}
                      <div>
                        <div className="text-slate-500">{t.billing.monthly}</div>
                        <div className="mt-1 text-base font-semibold text-slate-900">
                          ¥{fmtJPY(pl.monthly)}/mo
                        </div>
                      </div>

                      {/* Yearly side */}
                      <div className="text-right">
                        <div className="text-[#2b5cff] font-semibold">{t.billing.yearly}</div>
                        <div className="mt-1 text-base font-semibold text-[#2b5cff]">
                          ¥{fmtJPY(yEq)}/mo
                        </div>
                        <div className="mt-1 text-[12px] text-slate-500">
                          {t.billing.annualTotal} ¥{fmtJPY(yTotal)}
                        </div>
                      </div>

                    </div>

                    <div className="mt-3 flex justify-center">
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1 text-[12px] font-semibold text-emerald-800 border border-emerald-300">
                        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        <span>{t.billing.save} ¥{fmtJPY(save)}</span>
                      </div>
                    </div>
                  </div>
                )}
                {billing === "yearly" && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-800 border border-emerald-200 shadow-sm">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    <span>
                      {t.billing.save} ¥{fmtJPY(save)}
                    </span>
                  </div>
                )}

                  <div className="mt-2 text-[12px] text-slate-600">
                    {billing === "yearly"
                      ? `${t.billing.annualTotal}: ¥${fmtJPY(yTotal)} · ${t.billing.save}: ¥${fmtJPY(save)}/年`
                      : `${t.billing.annualTotal}: ¥${fmtJPY(pl.monthly * 12)}（参考）`}
                  </div>
                </div>

                <ul className="mt-5 space-y-2 text-sm text-slate-800">
                  {pl.items.map((x) => (
                    <li key={x} className="flex gap-2">
                      <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#2b5cff]" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 rounded-2xl border border-black/10 bg-white/70 p-4">
                  <div className="text-[12px] text-slate-500">Fit</div>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {pl.fit.map((x) => (
                      <li key={x} className="flex gap-2">
                        <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-black/[0.12]" />
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 flex gap-2">
                  <a
                    href={trialHref}
                    className={cn(
                      "inline-flex h-10 flex-1 items-center justify-center rounded-full px-5 text-sm font-semibold shadow-sm active:scale-[0.99]",
                      isRec ? "bg-rose-500 text-white hover:bg-rose-600" : "bg-[#2b5cff] text-white hover:opacity-95"
                    )}
                  >
                    {t.plans.ctaTrial}
                  </a>
                  <a
                    href={loginHref}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-black/10 bg-white/70 px-5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-white active:scale-[0.99]"
                  >
                    {t.plans.ctaLogin}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI Premium */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="rounded-[32px] border border-black/10 bg-gradient-to-br from-[#2b5cff]/18 via-white to-emerald-100 p-8 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight">{t.ai.title}</h2>
          <p className="mt-2 text-sm text-slate-700">{t.ai.lead}</p>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            {t.ai.items.map((x) => (
              <div key={x} className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm">
                <div className="flex gap-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#2b5cff] text-white text-[12px]">✦</span>
                  <div className="text-sm font-medium text-slate-900">{x}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-[12px] text-slate-600">{t.ai.note}</div>
        </div>
      </section>

      {/* ④ Trust module */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <h2 className="text-2xl font-semibold tracking-tight">{t.trust.title}</h2>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {t.trust.badges.map((b) => (
            <div key={b.k} className="rounded-3xl border border-black/10 bg-white/85 p-6 shadow-sm">
              <div className="text-[12px] text-slate-500">{b.k}</div>
              <div className="mt-2 text-xl font-semibold tracking-tight">{b.v}</div>
              <div className="mt-2 text-sm text-slate-600">{b.sub}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-end justify-between gap-6">
          <div>
            <div className="text-xl font-semibold tracking-tight">{t.trust.voices}</div>
            <div className="mt-1 text-[12px] text-slate-500">{t.trust.note}</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {t.trust.samples.map((x) => (
            <div key={x.title} className="rounded-3xl border border-black/10 bg-white/85 p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar name={x.name} />
                <div className="leading-tight">
                  <div className="text-sm font-semibold">{x.name}</div>
                  <div className="text-[12px] text-slate-500">{x.role}</div>
                </div>
              </div>
              <div className="mt-4 text-sm font-semibold text-slate-900">{x.title}</div>
              <div className="mt-2 text-sm text-slate-700">“{x.quote}”</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <h2 className="text-2xl font-semibold tracking-tight">{t.faq.title}</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {t.faq.items.map((f) => (
            <details key={f.q} className="group rounded-3xl border border-black/10 bg-white/85 p-6 shadow-sm open:bg-white">
              <summary className="cursor-pointer list-none">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-sm font-semibold">{f.q}</div>
                  <div className="mt-0.5 text-slate-400 group-open:rotate-180 transition">▾</div>
                </div>
              </summary>
              <div className="mt-3 text-sm text-slate-600">{f.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="rounded-[32px] border border-black/10 bg-gradient-to-br from-[#2b5cff]/20 via-white to-emerald-100 p-10 shadow-sm">
          <h2 className="text-3xl font-semibold tracking-tight">{t.bottom.title}</h2>
          <p className="mt-3 text-sm text-slate-700">{t.bottom.lead}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href={trialHref} className="inline-flex items-center justify-center rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-rose-600 active:scale-[0.99]">
              {t.bottom.cta}
            </a>
            <a href={homeHref} className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-white active:scale-[0.99]">
              {t.nav.home}
            </a>
          </div>
          <div className="mt-3 text-[12px] text-slate-600">{t.bottom.sub}</div>
        </div>
      </section>

      <footer className="border-t border-black/5 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-10 text-sm text-slate-500">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>© {new Date().getFullYear()} LedgerSeiri</div>
            <div className="flex gap-4">
              <a className="hover:text-slate-700" href={homeHref}>{t.nav.home}</a>
              <a className="hover:text-slate-700" href={loginHref}>{t.nav.login}</a>
              <a className="hover:text-slate-700" href={trialHref}>{t.nav.trial}</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
