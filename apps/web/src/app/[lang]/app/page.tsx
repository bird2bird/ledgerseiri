"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { Card, MiniStat, SparkCard, CostRow, QuickCard, NoticeItem } from "@/components/app/DashboardAtoms";
import { KpiRow, AiInsightCard } from "@/components/app/dashboard/DashboardStripeUI";
function cls(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

type Company = { id: string; name: string };
type Store = { id: string; name: string; platform: string; region: string };
type CompanyResp = { company: Company | null; stores: Store[] };

type Dashboard = {
  sales: number;
  fbaFees: number;
  ads: number;
  refunds: number;
  monthNet?: number;
  profit?: number;
  count: number;
};

type Tx = {
  id: string;
  storeId: string;
  type: "SALE" | "FBA_FEE" | "AD" | "REFUND" | "OTHER";
  amount: number;
  occurredAt: string;
  memo: string | null;
};

function fmtJPY(n: number) {
  try {
    return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `¥${Math.round(n)}`;
  }
}

function ymNowTokyo() {
  // quick and good enough for UI
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

function badgeForType(t: Tx["type"]) {
  // keep semantic; minimal styling, system tokens
  const base = "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium";
  if (t === "SALE") return `${base} border-emerald-200 bg-emerald-50 text-emerald-700`;
  if (t === "REFUND") return `${base} border-rose-200 bg-rose-50 text-rose-700`;
  if (t === "AD") return `${base} border-amber-200 bg-amber-50 text-amber-700`;
  if (t === "FBA_FEE") return `${base} border-slate-200 bg-slate-50 text-slate-700`;
  return `${base} border-slate-200 bg-white text-slate-700`;
}

// --- I18N (keep your existing content; truncated here to the keys used by UI)
const I18N: any = {
  ja: {
    appName: "LedgerSeiri",
    demoCompany: "LedgerSeiri Demo Company",
    menu: "メニュー",
    cloudLedger: "クラウド記帳",
    home: "ダッシュボード",
    ledgerList: "取引一覧",
    journalList: "仕訳一覧",
    purchase: "仕入一覧",
    payment: "支払一覧",
    expense: "経費一覧",
    otherIncome: "その他収入",
    otherExpense: "その他支出",
    financeReport: "財務レポート",
    profitReport: "損益",
    cashflow: "キャッシュフロー",
    detail: "明細",
    tax: "税務",
    vat: "消費税",
    incomeTax: "所得税",
    annual: "年次",
    storeOverview: "店舗概要",
    block2Sub: "Block 2 · 店舗 / 売上 / 利益",
    insights: "インサイト",
    block4Sub: "Block 4 · トレンド / 構造",
    monthIncome: "月間売上",
    monthExpense: "月間支出",
    block3SubIncome: "Sales + Positive adjustments",
    block3SubExpense: "FBA + Ads + Refunds + Negative adjustments",
    netProfitMonth: "今月の純利益",
    live: "Live",
    score: "Score",
    healthMessageTitle: "ヒント",
    healthMessage: "状態良好：このペースで、次はキャッシュフローの安定化。",
    profitRate: "利益率",
    refundRate: "返品率",
    adsRate: "広告比率",
    store: "店舗",
    month: "月",
    format: "形式：YYYY-MM",
    memo: "メモ",
    addTx: "取引追加",
    saving: "保存中...",
    transactions: "Transactions",
    csvImport: "CSV Import",
    date: "日付",
    type: "種別",
    amount: "金額",
    action: "操作",
    delete: "削除",
    noTx: "今月の取引はありません。",
    quickActions: "クイック",
    qaSub: "Block 6 · ショートカット",
    qaCsv: "CSV 取込",
    qaAdd: "手入力",
    qaExport: "出力",
    qaRecon: "照合",
    qaStores: "店舗",
    qaHelp: "ヘルプ",
    go: "開く →",
    todo: "ToDo",
    todoSub: "Block 7 · システム",
    todoEmpty: "重要なToDoはありません（良い状態）",
    todoHint: "推奨：1–2分で確認",
    low: "低",
    notice: "通知",
    noticeSub: "Block 8 · System / Product",
    markRead: "既読にする",
    notice1: "ダッシュボードUIを freee 風にアップデートしました。",
    notice2: "今月取引：9件に集計しました。",
    tips: "Tips: 費用（FBA/AD/REFUND）は原値でDB保存（負数で保存）。",
    logout: "ログアウト",
  },
  en: {
    appName: "LedgerSeiri",
    demoCompany: "LedgerSeiri Demo Company",
    menu: "Menu",
    cloudLedger: "Cloud Ledger",
    home: "Dashboard",
    ledgerList: "Ledger List",
    journalList: "Journal List",
    purchase: "Purchases",
    payment: "Payments",
    expense: "Expenses",
    otherIncome: "Other Income",
    otherExpense: "Other Expense",
    financeReport: "Finance Reports",
    profitReport: "P&L",
    cashflow: "Cashflow",
    detail: "Details",
    tax: "Tax",
    vat: "VAT",
    incomeTax: "Income Tax",
    annual: "Annual",
    storeOverview: "Store Overview",
    block2Sub: "Block 2 · Store / Sales / Profit",
    insights: "Insights",
    block4Sub: "Block 4 · Trends / Structure",
    monthIncome: "Monthly Income",
    monthExpense: "Monthly Expense",
    block3SubIncome: "Sales + Positive adjustments",
    block3SubExpense: "FBA + Ads + Refunds + Negative adjustments",
    netProfitMonth: "Net Profit (Month)",
    live: "Live",
    score: "Score",
    healthMessageTitle: "Health",
    healthMessage: "Looking good—keep the rhythm. Next: stabilize cashflow.",
    profitRate: "Profit",
    refundRate: "Refund",
    adsRate: "Ads",
    store: "Store",
    month: "Month",
    format: "Format: YYYY-MM",
    memo: "Memo",
    addTx: "Add Tx",
    saving: "Saving...",
    transactions: "Transactions",
    csvImport: "CSV Import",
    date: "Date",
    type: "Type",
    amount: "Amount",
    action: "Action",
    delete: "Delete",
    noTx: "No transactions this month.",
    quickActions: "Quick Actions",
    qaSub: "Block 6 · Shortcuts",
    qaCsv: "CSV Import",
    qaAdd: "Manual Entry",
    qaExport: "Export",
    qaRecon: "Reconcile",
    qaStores: "Stores",
    qaHelp: "Help",
    go: "Go →",
    todo: "To-do",
    todoSub: "Block 7 · System",
    todoEmpty: "No important tasks (nice!)",
    todoHint: "Tip: 1–2 min check",
    low: "Low",
    notice: "Notifications",
    noticeSub: "Block 8 · System / Product",
    markRead: "Mark all read",
    notice1: "Dashboard visual refreshed (freee-like).",
    notice2: "This month: 9 transactions summarized.",
    tips: "Tips: Costs (FBA/AD/REFUND) saved as negative values in DB.",
    logout: "Logout",
  },
  "zh-CN": {
    appName: "LedgerSeiri",
    demoCompany: "LedgerSeiri Demo Company",
    menu: "菜单",
    cloudLedger: "云记账",
    home: "记账商户首页",
    ledgerList: "记账列表",
    journalList: "关单列表",
    purchase: "进货单列表",
    payment: "付款单列表",
    expense: "费用单列表",
    otherIncome: "其他业务收入单",
    otherExpense: "其他业务支出单",
    financeReport: "财务报表",
    profitReport: "利润表",
    cashflow: "经营收支",
    detail: "往来明细",
    tax: "税务管理",
    vat: "增值税",
    incomeTax: "个人所得税",
    annual: "年度汇总清缴",
    storeOverview: "店铺概览",
    block2Sub: "Block 2 · 店铺 / 销售 / 利润",
    insights: "经营洞察",
    block4Sub: "Block 4 · 洞察（趋势 / 结构）",
    monthIncome: "月收入",
    monthExpense: "月支出",
    block3SubIncome: "Sales + Positive adjustments",
    block3SubExpense: "FBA + Ads + Refunds + Negative adjustments",
    netProfitMonth: "本月净利润",
    live: "Live",
    score: "Score",
    healthMessageTitle: "健康提示",
    healthMessage: "状态不错：保持节奏，下一步把现金流做稳。",
    profitRate: "利润率",
    refundRate: "退款率",
    adsRate: "广告占比",
    store: "店铺",
    month: "月份",
    format: "格式：YYYY-MM",
    memo: "备注",
    addTx: "新增交易",
    saving: "保存中...",
    transactions: "Transactions",
    csvImport: "CSV Import",
    date: "日期",
    type: "类型",
    amount: "金额",
    action: "操作",
    delete: "删除",
    noTx: "本月暂无交易。",
    quickActions: "快速入口",
    qaSub: "Block 6 · 快捷操作",
    qaCsv: "CSV 导入",
    qaAdd: "手工记账",
    qaExport: "导出",
    qaRecon: "对账",
    qaStores: "店铺",
    qaHelp: "帮助",
    go: "进入 →",
    todo: "待办事项",
    todoSub: "Block 7 · 系统任务",
    todoEmpty: "暂无重要待办（保持得很好）",
    todoHint: "建议：1–2 分钟确认",
    low: "低",
    notice: "消息通知",
    noticeSub: "Block 8 · 系统 / 产品",
    markRead: "全部已读",
    notice1: "已将仪表盘视觉升级为 freee 风格。",
    notice2: "本月交易：已汇总 9 笔。",
    tips: "Tips: 费用类（FBA/AD/REFUND）会按原值写入 DB（负数保存）。",
    logout: "退出登录",
  },
  "zh-TW": {
    appName: "LedgerSeiri",
    demoCompany: "LedgerSeiri Demo Company",
    menu: "選單",
    cloudLedger: "雲端記帳",
    home: "記帳商戶首頁",
    ledgerList: "記帳列表",
    journalList: "關單列表",
    purchase: "進貨單列表",
    payment: "付款單列表",
    expense: "費用單列表",
    otherIncome: "其他業務收入單",
    otherExpense: "其他業務支出單",
    financeReport: "財務報表",
    profitReport: "利潤表",
    cashflow: "經營收支",
    detail: "往來明細",
    tax: "稅務管理",
    vat: "增值稅",
    incomeTax: "個人所得稅",
    annual: "年度彙總清繳",
    storeOverview: "店鋪概覽",
    block2Sub: "Block 2 · 店鋪 / 銷售 / 利潤",
    insights: "經營洞察",
    block4Sub: "Block 4 · 洞察（趨勢 / 結構）",
    monthIncome: "月收入",
    monthExpense: "月支出",
    block3SubIncome: "Sales + Positive adjustments",
    block3SubExpense: "FBA + Ads + Refunds + Negative adjustments",
    netProfitMonth: "本月淨利潤",
    live: "Live",
    score: "Score",
    healthMessageTitle: "健康提示",
    healthMessage: "狀態不錯：維持節奏，下一步把現金流做穩。",
    profitRate: "利潤率",
    refundRate: "退款率",
    adsRate: "廣告佔比",
    store: "店鋪",
    month: "月份",
    format: "格式：YYYY-MM",
    memo: "備註",
    addTx: "新增交易",
    saving: "保存中...",
    transactions: "Transactions",
    csvImport: "CSV Import",
    date: "日期",
    type: "類型",
    amount: "金額",
    action: "操作",
    delete: "刪除",
    noTx: "本月暫無交易。",
    quickActions: "快速入口",
    qaSub: "Block 6 · 快捷操作",
    qaCsv: "CSV 匯入",
    qaAdd: "手動記帳",
    qaExport: "匯出",
    qaRecon: "對帳",
    qaStores: "店鋪",
    qaHelp: "幫助",
    go: "進入 →",
    todo: "待辦事項",
    todoSub: "Block 7 · 系統任務",
    todoEmpty: "暫無重要待辦（保持得很好）",
    todoHint: "建議：1–2 分鐘確認",
    low: "低",
    notice: "消息通知",
    noticeSub: "Block 8 · 系統 / 產品",
    markRead: "全部已讀",
    notice1: "已將儀表板視覺升級為 freee 風格。",
    notice2: "本月交易：已彙總 9 筆。",
    tips: "Tips: 費用類（FBA/AD/REFUND）會按原值寫入 DB（負數保存）。",
    logout: "登出",
  },
};

export default function AppHome() {
  const router = useRouter();
  const params = useParams<{ lang: string }>();
  const currentLang = normalizeLang(params?.lang as any) as Lang;

  const t = (key: string) => I18N[currentLang]?.[key] ?? I18N.ja?.[key] ?? key;

  const [token, setToken] = useState<string | null>(null);

  const [company, setCompany] = useState<CompanyResp["company"]>(null);
  const [stores, setStores] = useState<CompanyResp["stores"]>([]);
  const [storeId, setStoreId] = useState<string>("");

  const [month, setMonth] = useState<string>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("ls_month") : null;
    return saved || ymNowTokyo();
  });

  const [dash, setDash] = useState<Dashboard | null>(null);
  const [items, setItems] = useState<Tx[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [tab, setTab] = useState<"transactions" | "import">("transactions");

  const [type, setType] = useState<Tx["type"]>("SALE");
  const [amount, setAmount] = useState<number>(10000);
  const [memo, setMemo] = useState<string>("");
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [creating, setCreating] = useState(false);

  const monthStartISO = useMemo(() => `${month}-01T00:00:00.000Z`, [month]);

  useEffect(() => {
    const tkn = localStorage.getItem("ls_token");
    if (!tkn) {
      router.push(`/${currentLang}/login`);
      return;
    }
    setToken(tkn);
  }, [router, currentLang]);

  useEffect(() => {
    if (!month) return;
    localStorage.setItem("ls_month", month);
  }, [month]);

  async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(path, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${path} failed: ${res.status} ${text}`);
    }
    return (await res.json()) as T;
  }

  async function apiPost<T>(path: string, body: any): Promise<T> {
    const res = await fetch(path, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${path} failed: ${res.status} ${text}`);
    }
    return (await res.json()) as T;
  }

  async function apiDel<T>(path: string): Promise<T> {
    const res = await fetch(path, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${path} failed: ${res.status} ${text}`);
    }
    return (await res.json()) as T;
  }

  // load company + stores
  useEffect(() => {
    if (!token) return;
    (async () => {
      setErr(null);
      try {
        const data = await apiGet<CompanyResp>("/api/company");
        setCompany(data.company);
        setStores(data.stores || []);

        const savedStore = localStorage.getItem("ls_storeId");
        const auto =
          savedStore && (data.stores || []).some((s) => s.id === savedStore)
            ? savedStore
            : data.stores?.[0]?.id;

        if (!storeId && auto) setStoreId(auto);
      } catch (e: any) {
        setErr(e?.message ?? String(e));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (storeId) localStorage.setItem("ls_storeId", storeId);
  }, [storeId]);

  // load dashboard + transactions
  useEffect(() => {
    if (!token || !storeId || !month) return;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const d = await apiGet<Dashboard>(
          `/api/dashboard?storeId=${encodeURIComponent(storeId)}&month=${encodeURIComponent(month)}`
        );
        setDash(d);
        const t = await apiGet<{ items: Tx[] }>(
          `/api/transaction?storeId=${encodeURIComponent(storeId)}&month=${encodeURIComponent(month)}`
        );
        setItems(t.items || []);
      } catch (e: any) {
        setErr(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [token, storeId, month]);

  function logout() {
    localStorage.removeItem("ls_token");
    router.push(`/${currentLang}/login`);
  }

  async function refresh() {
    if (!token || !storeId || !month) return;
    const d = await apiGet<Dashboard>(
      `/api/dashboard?storeId=${encodeURIComponent(storeId)}&month=${encodeURIComponent(month)}`
    );
    setDash(d);
    const t = await apiGet<{ items: Tx[] }>(
      `/api/transaction?storeId=${encodeURIComponent(storeId)}&month=${encodeURIComponent(month)}`
    );
    setItems(t.items || []);
  }

  async function createTx() {
    if (!storeId) return;
    setCreating(true);
    setErr(null);
    try {
      const occurredAt = new Date(`${date}T00:00:00.000Z`).toISOString();
      await apiPost<Tx>("/api/transaction", {
        storeId,
        type,
        amount,
        occurredAt,
        memo: memo || null,
      });
      await refresh();
      setMemo("");
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setCreating(false);
    }
  }

  async function deleteTx(id: string) {
    setErr(null);
    try {
      await apiDel<{ ok: boolean }>(`/api/transaction/${id}`);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  }

  const net = dash?.monthNet ?? dash?.profit ?? 0;
  const score = dash
    ? Math.round(Math.min(100, Math.max(0, (dash.sales ? (net / Math.max(1, dash.sales)) : 0) * 100)))
    : 0;
  const profitRate = dash ? Math.round((net / Math.max(1, dash.sales)) * 100) : 0;
  const refundRate = dash ? Math.round((Math.abs(dash.refunds) / Math.max(1, dash.sales)) * 100) : 0;
  const adsRate = dash ? Math.round((Math.abs(dash.ads) / Math.max(1, dash.sales)) * 100) : 0;
    return (
      <div className="grid grid-cols-12 gap-4">
  {/* Main */}
<section className="col-span-12 lg:col-span-8 space-y-4">
{err && !String(err).includes("401") && !String(err).includes("UNAUTHORIZED") && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {err}
            </div>
          )}

          {/* Block 2 */}
          <section className="ls-card-solid p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">{t("storeOverview")}</div>
                <div className="text-[12px] text-slate-500">{t("block2Sub")}</div>
              </div>
              <span className={cls("ls-badge", "px-2 py-1 text-[11px] font-medium text-slate-700")}>{t("live")}</span>
            </div>

            <div className="mt-4 grid grid-cols-12 gap-3">
              <div className="col-span-12 md:col-span-7">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[12px] text-slate-500">{t("store")}</div>
                    <select
                      className="mt-2 w-full rounded-xl border px-3 py-2 text-sm bg-white"
                      value={storeId}
                      onChange={(e) => setStoreId(e.target.value)}
                    >
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.platform}-{s.region})
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 break-all text-[11px] text-slate-500">storeId: {storeId || "(none)"}</div>
                  </div>

                  <div>
                    <div className="text-[12px] text-slate-500">{t("month")}</div>
                    <input
                      className="mt-2 w-full rounded-xl border px-3 py-2 text-sm bg-white"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      placeholder="2026-02"
                    />
                    <div className="mt-2 text-[11px] text-slate-500">{t("format")}</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  <select
                    className="col-span-1 rounded-xl border px-3 py-2 text-sm bg-white"
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                  >
                    <option value="SALE">SALE</option>
                    <option value="FBA_FEE">FBA_FEE</option>
                    <option value="AD">AD</option>
                    <option value="REFUND">REFUND</option>
                    <option value="OTHER">OTHER</option>
                  </select>

                  <input
                    className="col-span-1 rounded-xl border px-3 py-2 text-sm bg-white"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                  />

                  <input
                    className="col-span-1 rounded-xl border px-3 py-2 text-sm bg-white"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />

                  <input
                    className="col-span-1 rounded-xl border px-3 py-2 text-sm bg-white"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder={t("memo")}
                  />
                </div>

                <button
                  className={cls("ls-btn", "ls-btn-primary", "mt-3 w-full px-4 py-2 text-sm font-semibold")}
                  disabled={!storeId || !month || creating}
                  onClick={createTx}
                >
                  {creating ? t("saving") : t("addTx")}
                </button>
              </div>

              <div className="col-span-12 md:col-span-5">
                <div className="ls-card p-4">
                  <div className="text-[12px] text-slate-500">{t("netProfitMonth")}</div>
                  <div className="mt-1 text-2xl font-bold tracking-tight text-emerald-600">{dash ? fmtJPY(net) : "-"}</div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    {dash ? `${dash.count} tx` : ""} · occurredAt: {monthStartISO}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Block 3 */}
          <section className="grid grid-cols-2 gap-4">
            <Card title={t("monthIncome")} sub={t("block3SubIncome")} pill="Block 3">
              <div className="mt-4 text-2xl font-bold">{dash ? fmtJPY(dash.sales) : "-"}</div>
            </Card>
            <Card title={t("monthExpense")} sub={t("block3SubExpense")} pill="Block 3">
              <div className="mt-4 text-2xl font-bold">
                {dash ? fmtJPY(Math.abs(dash.fbaFees) + Math.abs(dash.ads) + Math.abs(dash.refunds)) : "-"}
              </div>
            </Card>
          </section>

          {/* Transactions / CSV Import */}
          <section className="ls-card-solid overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  className={cls(
                    "ls-btn px-3 py-2 text-sm font-medium",
                    tab === "transactions" ? "ls-btn-primary" : "ls-btn-ghost"
                  )}
                  onClick={() => setTab("transactions")}
                >
                  {t("transactions")}
                </button>
                <button
                  className={cls(
                    "ls-btn px-3 py-2 text-sm font-medium",
                    tab === "import" ? "ls-btn-primary" : "ls-btn-ghost"
                  )}
                  onClick={() => setTab("import")}
                >
                  {t("csvImport")}
                </button>
              </div>
              <div className="text-sm text-slate-500">{loading ? "Loading..." : dash ? `${dash.count} items` : ""}</div>
            </div>

            {tab === "transactions" && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-[57px] bg-white">
                    <tr className="text-left text-slate-500">
                      <th className="px-4 py-3">{t("date")}</th>
                      <th className="px-4 py-3">{t("type")}</th>
                      <th className="px-4 py-3 text-right">{t("amount")}</th>
                      <th className="px-4 py-3">{t("memo")}</th>
                      <th className="px-4 py-3 text-right">{t("action")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((tx) => (
                      <tr key={tx.id} className="border-t hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-700">{tx.occurredAt.slice(0, 10)}</td>
                        <td className="px-4 py-3">
                          <span className={badgeForType(tx.type)}>{tx.type}</span>
                        </td>
                        <td className={cls("px-4 py-3 text-right font-semibold", tx.amount < 0 && "text-rose-600")}>
                          {fmtJPY(tx.amount)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{tx.memo || ""}</td>
                        <td className="px-4 py-3 text-right">
                          <button className={cls("ls-btn", "ls-btn-ghost", "px-3 py-1.5 text-sm")} onClick={() => deleteTx(tx.id)}>
                            {t("delete")}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!items.length && (
                      <tr>
                        <td className="px-4 py-10 text-center text-slate-500" colSpan={5}>
                          {t("noTx")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "import" && (
              <div className="p-4">
                <div className="ls-card p-4">
                  <div className="text-sm font-semibold">{t("csvImport")} MVP (next)</div>
                  <div className="mt-2 text-sm text-slate-600">Upload → Parse → Preview → Bulk Insert</div>
                  <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
                    <li>Amazon Monthly Transaction Report / Settlement CSV</li>
                    <li>Idempotency (hash) to prevent duplicates</li>
                    <li>Preview edits before insert</li>
                  </ul>
                </div>
              </div>
            )}
          </section>

          <div className="text-[12px] text-slate-500">{t("tips")}</div>
        </section>
<aside className="col-span-12 lg:col-span-4 space-y-4">
{/* Block 4 */}
          <section className="ls-card-solid p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">{t("insights")}</div>
                <div className="text-[12px] text-slate-500">{t("block4Sub")}</div>
              </div>
              <span className={cls("ls-badge", "px-2 py-1 text-[11px] font-medium text-slate-700")}>
                {t("score")} {score}/100
              </span>
            </div>

            <div className="mt-4 ls-card p-4">
              <div className="text-sm font-semibold text-slate-700">{t("healthMessageTitle")}</div>
              <div className="mt-2 text-sm text-slate-700">{t("healthMessage")}</div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <MiniStat title={t("profitRate")} value={`${profitRate}%`} />
                <MiniStat title={t("refundRate")} value={`${refundRate}%`} />
                <MiniStat title={t("adsRate")} value={`${adsRate}%`} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <SparkCard title="Sales (cum.)" />
              <SparkCard title="Net (cum.)" />
            </div>

            <div className="mt-4 text-[12px] text-slate-500">Cost mix (Top 3)</div>
            <CostRow label="FBA Fees" pct={8} amount={dash ? fmtJPY(Math.abs(dash.fbaFees)) : "-"} />
            <CostRow label="Ads" pct={3} amount={dash ? fmtJPY(Math.abs(dash.ads)) : "-"} />
            <CostRow label="Refunds" pct={1} amount={dash ? fmtJPY(Math.abs(dash.refunds)) : "-"} />
          </section>

          {/* Block 6 */}
          <section className="ls-card-solid p-4">
            <div className="text-sm font-semibold text-slate-900">{t("quickActions")}</div>
            <div className="text-[12px] text-slate-500">{t("qaSub")}</div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <QuickCard title={t("qaCsv")} sub="取り込み" btn={t("go")} />
              <QuickCard title={t("qaAdd")} sub="手入力" btn={t("go")} />
              <QuickCard title={t("qaExport")} sub="出力" btn={t("go")} />
              <QuickCard title={t("qaRecon")} sub="対帳" btn={t("go")} />
              <QuickCard title={t("qaStores")} sub="店舗" btn={t("go")} />
              <QuickCard title={t("qaHelp")} sub="帮助" btn={t("go")} />
            </div>
          </section>

          {/* Block 7 */}
          <section className="ls-card-solid p-4">
            <div className="text-sm font-semibold text-slate-900">{t("todo")}</div>
            <div className="text-[12px] text-slate-500">{t("todoSub")}</div>

            <div className="mt-3 ls-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-slate-800">{t("todoEmpty")}</div>
                  <div className="mt-2 text-[12px] text-slate-500">{t("todoHint")}</div>
                </div>
                <span className={cls("ls-badge", "px-2 py-1 text-[11px] text-slate-600")}>{t("low")}</span>
              </div>
            </div>
          </section>

          {/* Block 8 */}
          <section className="ls-card-solid p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">{t("notice")}</div>
                <div className="text-[12px] text-slate-500">{t("noticeSub")}</div>
              </div>
              <button className={cls("ls-btn", "ls-btn-ghost", "px-3 py-2 text-sm")}>{t("markRead")}</button>
            </div>

            <div className="mt-3 space-y-2">
              <NoticeItem tag="Product" date="2026-02-21" text={t("notice1")} />
              <NoticeItem tag="System" date="2026-02-21" text={t("notice2")} />
            </div>
          </section>
        </aside>
      </div>
  );
}
