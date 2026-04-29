"use client";

import React from "react";
import Link from "next/link";
import { listTransactions, type TransactionItem } from "@/core/transactions/api";
import { formatIncomeJPY } from "@/core/transactions/income-page-constants";

export type ExpenseCategoryProductKind =
  | "company-operation"
  | "payroll"
  | "other-expense";

type ExpenseCategoryRecord = {
  id: string;
  date: string;
  sortAt: string;
  categoryLabel: string;
  amount: number;
  account: string;
  vendor: string;
  memo: string;
  source: string;
  statusFlags: string[];
};

type DashboardPoint = {
  key: string;
  label: string;
  fullDate: string;
  amount: number;
  count: number;
  start: Date;
};

type RangePreset = "30d" | "90d" | "12m";
type SortMode = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

const PAGE_CONFIG: Record<
  ExpenseCategoryProductKind,
  {
    title: string;
    subtitle: string;
    sourceLabel: string;
    totalLabel: string;
    primaryAction: string;
    importLabel: string;
    settingLabel: string;
    badgeLabel: string;
    scope: string;
  }
> = {
  "company-operation": {
    title: "会社運営費",
    subtitle:
      "家賃、通信費、ソフトウェア、消耗品など、会社運営に関わる支出をその他収入ページと同じ操作感で管理します。",
    sourceLabel: "運営費区分選択",
    totalLabel: "表示中の会社運営費",
    primaryAction: "新規会社運営費",
    importLabel: "会社運営費CSV/Excel取込",
    settingLabel: "支払先/証憑設定",
    badgeLabel: "会社運営費",
    scope: "company-operation-expense",
  },
  payroll: {
    title: "給与",
    subtitle:
      "給与、役員報酬、外注人件費などの支出を一覧、集計、証憑確認まで一画面で管理します。",
    sourceLabel: "給与区分選択",
    totalLabel: "表示中の給与支出",
    primaryAction: "新規給与支出",
    importLabel: "給与CSV/Excel取込",
    settingLabel: "給与/証憑設定",
    badgeLabel: "給与",
    scope: "payroll-expense",
  },
  "other-expense": {
    title: "その他支出",
    subtitle:
      "広告費・物流費・給与・会社運営費に分類しきれない支出を整理し、銀行流水・証憑との未消込を確認します。",
    sourceLabel: "支出区分選択",
    totalLabel: "表示中のその他支出",
    primaryAction: "新規その他支出",
    importLabel: "その他支出CSV/Excel取込",
    settingLabel: "支出/証憑設定",
    badgeLabel: "その他支出",
    scope: "other-expense",
  },
};

const KIND_OPTIONS: Record<
  ExpenseCategoryProductKind,
  Array<{ value: string; label: string }>
> = {
  "company-operation": [
    { value: "all", label: "全会社運営費" },
    { value: "rent", label: "家賃・地代" },
    { value: "utilities", label: "水道光熱費" },
    { value: "software", label: "SaaS・システム" },
    { value: "office", label: "消耗品・備品" },
    { value: "communication", label: "通信費" },
  ],
  payroll: [
    { value: "all", label: "全給与" },
    { value: "salary", label: "給与" },
    { value: "executive", label: "役員報酬" },
    { value: "outsourcing", label: "外注人件費" },
    { value: "social", label: "社会保険・福利厚生" },
  ],
  "other-expense": [
    { value: "all", label: "全その他支出" },
    { value: "misc", label: "雑費" },
    { value: "bank", label: "手数料" },
    { value: "tax", label: "税金・公課" },
    { value: "adjustment", label: "調整・返金" },
  ],
};

function parseExpenseDateMs(item: TransactionItem) {
  const raw = String(item.occurredAt || item.createdAt || "");
  const ts = new Date(raw).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function cloneDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = cloneDate(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatCompactDate(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatFullDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
}

function normalizeText(value?: string | null) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .toLowerCase();
}

function includesAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword.toLowerCase()));
}

function getExpenseSearchText(item: TransactionItem) {
  return normalizeText(
    [
      item.type,
      item.categoryName,
      item.memo,
      item.accountName,
      item.storeName,
      item.storeId,
      item.externalRef,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function classifyCompanyOperationBucket(text: string) {
  if (includesAny(text, ["家賃", "地代", "rent", "office rent"])) return "rent";
  if (includesAny(text, ["水道", "光熱", "電気", "gas", "utility"])) return "utilities";
  if (includesAny(text, ["saas", "software", "システム", "サーバ", "server", "cloud", "aws", "google", "notion"])) return "software";
  if (includesAny(text, ["消耗品", "備品", "office", "supplies", "文具"])) return "office";
  if (includesAny(text, ["通信", "電話", "internet", "wifi", "回線"])) return "communication";
  return "all";
}

function classifyPayrollBucket(text: string) {
  if (includesAny(text, ["役員", "executive", "director"])) return "executive";
  if (includesAny(text, ["外注", "業務委託", "contractor", "freelance"])) return "outsourcing";
  if (includesAny(text, ["社会保険", "福利厚生", "insurance", "benefit"])) return "social";
  if (includesAny(text, ["給与", "給料", "salary", "payroll", "人件"])) return "salary";
  return "all";
}

function classifyOtherExpenseBucket(text: string) {
  if (includesAny(text, ["手数料", "fee", "bank fee", "振込手数料"])) return "bank";
  if (includesAny(text, ["税金", "公課", "tax", "消費税", "法人税"])) return "tax";
  if (includesAny(text, ["調整", "返金", "adjust", "refund"])) return "adjustment";
  return "misc";
}

function isCompanyOperationExpense(text: string) {
  return includesAny(text, [
    "家賃",
    "地代",
    "水道",
    "光熱",
    "電気",
    "通信",
    "消耗品",
    "備品",
    "saas",
    "software",
    "システム",
    "サーバ",
    "server",
    "cloud",
    "office",
    "supplies",
    "会社",
    "運営",
  ]);
}

function isPayrollExpense(text: string) {
  return includesAny(text, [
    "給与",
    "給料",
    "役員報酬",
    "人件",
    "外注",
    "業務委託",
    "salary",
    "payroll",
    "contractor",
    "freelance",
  ]);
}

function isAdvertisingOrLogistics(text: string) {
  return includesAny(text, [
    "広告",
    "ads",
    "advertising",
    "fba",
    "物流",
    "送料",
    "shipping",
    "配送",
    "倉庫",
    "store-operation",
    "[imports:store-operation]",
  ]);
}

function matchesWorkspaceKind(kind: ExpenseCategoryProductKind, item: TransactionItem) {
  const text = getExpenseSearchText(item);

  if (kind === "payroll") return isPayrollExpense(text);
  if (kind === "company-operation") {
    return isCompanyOperationExpense(text) && !isPayrollExpense(text);
  }

  return (
    !isPayrollExpense(text) &&
    !isCompanyOperationExpense(text) &&
    !isAdvertisingOrLogistics(text)
  );
}

function getBucket(kind: ExpenseCategoryProductKind, item: TransactionItem) {
  const text = getExpenseSearchText(item);
  if (kind === "payroll") return classifyPayrollBucket(text);
  if (kind === "company-operation") return classifyCompanyOperationBucket(text);
  return classifyOtherExpenseBucket(text);
}

function getBucketLabel(kind: ExpenseCategoryProductKind, bucket: string) {
  return KIND_OPTIONS[kind].find((item) => item.value === bucket)?.label || PAGE_CONFIG[kind].badgeLabel;
}

function mapExpenseRecord(kind: ExpenseCategoryProductKind, item: TransactionItem): ExpenseCategoryRecord {
  const ts = parseExpenseDateMs(item);
  const date = ts > 0 ? formatFullDate(new Date(ts)) : "-";
  const bucket = getBucket(kind, item);
  const amount = Math.abs(Number(item.amount || 0));
  const memo = String(item.memo || "").trim();

  const statusFlags = [
    item.accountName ? "" : "銀行流水未確認",
    memo.includes("[evidence:") || memo.includes("[invoice:") ? "" : "証憑未添付",
  ].filter(Boolean);

  return {
    id: String(item.id || `${kind}-${date}-${amount}`),
    date,
    sortAt: item.occurredAt || item.createdAt || "",
    categoryLabel: getBucketLabel(kind, bucket),
    amount,
    account: item.accountName || "-",
    vendor: item.storeName || item.storeId || "-",
    memo: memo || item.categoryName || item.type || "-",
    source: item.sourceFileName || item.importJobId || "manual/api",
    statusFlags,
  };
}

function buildDenseDailyPoints(rows: ExpenseCategoryRecord[], range: RangePreset): DashboardPoint[] {
  const days = range === "12m" ? 365 : range === "90d" ? 90 : 30;
  const latest =
    rows
      .map((row) => new Date(row.date).getTime())
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => b - a)[0] || Date.now();

  const end = cloneDate(new Date(latest));
  const start = addDays(end, -(days - 1));
  const map = new Map<string, DashboardPoint>();

  for (let i = 0; i < days; i += 1) {
    const date = addDays(start, i);
    const key = formatFullDate(date);
    map.set(key, {
      key,
      label: formatCompactDate(date),
      fullDate: key,
      amount: 0,
      count: 0,
      start: date,
    });
  }

  for (const row of rows) {
    const date = new Date(row.date);
    if (Number.isNaN(date.getTime())) continue;
    const d = cloneDate(date);
    if (d.getTime() < start.getTime() || d.getTime() > end.getTime()) continue;

    const key = formatFullDate(d);
    const found = map.get(key);
    if (!found) continue;
    found.amount += Number(row.amount || 0);
    found.count += 1;
  }

  return Array.from(map.values()).sort((a, b) => a.start.getTime() - b.start.getTime());
}

function getNiceMax(points: DashboardPoint[]) {
  const max = Math.max(0, ...points.map((point) => Number(point.amount || 0)));
  if (max <= 0) return 10000;
  const power = Math.pow(10, Math.max(3, Math.floor(Math.log10(max))));
  return Math.ceil(max / power) * power;
}

function getLabelEvery(points: DashboardPoint[]) {
  if (points.length <= 8) return 1;
  if (points.length <= 31) return 5;
  if (points.length <= 95) return 14;
  return 45;
}

function buildPageWindow(current: number, total: number) {
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);
  const pages: number[] = [];
  for (let page = start; page <= end; page += 1) pages.push(page);
  return pages;
}

function sortRecords(rows: ExpenseCategoryRecord[], sortMode: SortMode) {
  const next = [...rows];

  if (sortMode === "date_asc") {
    return next.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  if (sortMode === "amount_desc") {
    return next.sort((a, b) => b.amount - a.amount);
  }

  if (sortMode === "amount_asc") {
    return next.sort((a, b) => a.amount - b.amount);
  }

  return next.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function ExpenseChartPair(props: { points: DashboardPoint[] }) {
  const { points } = props;
  const max = getNiceMax(points);
  const labelEvery = getLabelEvery(points);
  const latestKey = points[points.length - 1]?.key || "";
  const peakKey =
    points
      .filter((point) => point.amount > 0)
      .reduce<DashboardPoint | null>((peak, point) => {
        if (!peak || point.amount > peak.amount) return point;
        return peak;
      }, null)?.key || "";

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-xl font-semibold text-slate-950">支出推移</div>
        <div className="mt-2 text-sm leading-6 text-slate-600">
          選択した期間の支出を日別に自動集計します。支出がない日も 0 円として基線まで表示します。
        </div>

        <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/50 p-4">
          <svg viewBox="0 0 800 300" className="h-[300px] w-full overflow-visible" role="img">
            <defs>
              <linearGradient id="expenseTrendArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.22" />
                <stop offset="68%" stopColor="#ef4444" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </linearGradient>
              <filter id="expensePointShadow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.16" />
              </filter>
            </defs>
            {(() => {
              const left = 78;
              const right = 762;
              const top = 20;
              const bottom = 262;
              const width = right - left;
              const height = bottom - top;
              const denominator = Math.max(1, points.length - 1);
              const toX = (index: number) => left + (index / denominator) * width;
              const toY = (amount: number) => bottom - Math.min(1, Math.max(0, amount) / Math.max(1, max)) * height;
              const polylinePoints = points
                .map((point, index) => `${toX(index).toFixed(2)},${toY(point.amount).toFixed(2)}`)
                .join(" ");
              const areaPoints = `${left},${bottom} ${polylinePoints} ${right},${bottom}`;

              return (
                <>
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = bottom - ratio * height;
                    return (
                      <g key={`trend-grid-${ratio}`}>
                        <line
                          x1={left}
                          x2={right}
                          y1={y}
                          y2={y}
                          stroke={ratio === 0 ? "#cbd5e1" : "#e5e7eb"}
                          strokeWidth={ratio === 0 ? 1.5 : 1}
                          strokeDasharray={ratio === 0 ? "0" : "4 8"}
                        />
                        <text x={left - 14} y={y + 4} textAnchor="end" className="fill-slate-500 text-[11px] font-medium">
                          {formatIncomeJPY(max * ratio)}
                        </text>
                      </g>
                    );
                  })}

                  <polygon points={areaPoints} fill="url(#expenseTrendArea)" />
                  <polyline points={polylinePoints} fill="none" stroke="#111827" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />

                  {points.map((point, index) => {
                    const x = toX(index);
                    const y = toY(point.amount);
                    const isZero = point.amount <= 0;
                    const isLatest = point.key === latestKey;
                    const isPeak = point.key === peakKey && point.amount > 0;
                    const tx = Math.min(right - 178, Math.max(left + 8, x - 80));
                    const ty = Math.max(top + 8, y - 58);

                    return (
                      <g key={`trend-${point.key}`} className="group">
                        <rect x={x - 11} y={top} width={22} height={height + 24} fill="transparent" />
                        <circle
                          cx={x}
                          cy={y}
                          r={isZero ? 2.1 : isLatest || isPeak ? 5.5 : 3}
                          className={
                            isZero
                              ? "fill-white stroke-slate-300"
                              : isLatest
                                ? "fill-rose-500 stroke-white"
                                : "fill-red-500 stroke-white"
                          }
                          strokeWidth={isZero ? 1.2 : 2}
                          filter={isLatest || isPeak ? "url(#expensePointShadow)" : undefined}
                          opacity={isZero ? 0.65 : 1}
                        />

                        <g className="pointer-events-none opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                          <rect x={tx} y={ty} width={174} height={52} rx={12} className="fill-white stroke-slate-200/90" filter="url(#expensePointShadow)" />
                          <text x={tx + 14} y={ty + 20} className="fill-slate-500 text-[11px] font-semibold">
                            {point.fullDate}
                          </text>
                          <text x={tx + 14} y={ty + 39} className="fill-slate-950 text-[13px] font-bold">
                            {formatIncomeJPY(point.amount)}
                          </text>
                        </g>

                        {index % labelEvery === 0 || index === points.length - 1 ? (
                          <text x={x} y={bottom + 30} textAnchor="middle" className="fill-slate-700 text-[12px] font-medium">
                            {point.label}
                          </text>
                        ) : null}
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-xl font-semibold text-slate-950">支出状況</div>
        <div className="mt-2 text-sm leading-6 text-slate-600">
          期間別の支出合計を比較します。0 円の日も区間として表示します。
        </div>

        <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/50 p-4">
          <svg viewBox="0 0 800 300" className="h-[300px] w-full overflow-visible" role="img">
            <defs>
              <filter id="expenseBarShadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.12" />
              </filter>
            </defs>
            {(() => {
              const left = 78;
              const right = 762;
              const top = 20;
              const bottom = 262;
              const width = right - left;
              const height = bottom - top;
              const count = Math.max(1, points.length);
              const gap = points.length > 28 ? 5 : 8;
              const barWidth = Math.max(4, Math.min(18, (width - gap * (count - 1)) / count));
              const toX = (index: number) => left + index * (barWidth + gap);
              const toBarHeight = (amount: number) => {
                if (amount <= 0) return 3;
                return Math.max(9, Math.min(1, amount / Math.max(1, max)) * height);
              };

              return (
                <>
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = bottom - ratio * height;
                    return (
                      <g key={`bar-grid-${ratio}`}>
                        <line
                          x1={left}
                          x2={right}
                          y1={y}
                          y2={y}
                          stroke={ratio === 0 ? "#cbd5e1" : "#e5e7eb"}
                          strokeWidth={ratio === 0 ? 1.5 : 1}
                          strokeDasharray={ratio === 0 ? "0" : "4 8"}
                        />
                        <text x={left - 14} y={y + 4} textAnchor="end" className="fill-slate-500 text-[11px] font-medium">
                          {formatIncomeJPY(max * ratio)}
                        </text>
                      </g>
                    );
                  })}

                  {points.map((point, index) => {
                    const x = toX(index);
                    const barHeight = toBarHeight(point.amount);
                    const y = bottom - barHeight;
                    const isLatest = point.key === latestKey;
                    const isPeak = point.key === peakKey && point.amount > 0;
                    const isZero = point.amount <= 0;
                    const tx = Math.min(right - 178, Math.max(left + 8, x - 80));
                    const ty = Math.max(top + 8, y - 58);

                    return (
                      <g key={`bar-${point.key}`} className="group">
                        <rect x={x - Math.max(3, gap / 2)} y={top} width={barWidth + Math.max(6, gap)} height={height + 24} fill="transparent" />
                        <rect
                          x={x}
                          y={isZero ? bottom - 3 : y}
                          width={barWidth}
                          height={barHeight}
                          rx={barWidth / 2}
                          fill={isLatest ? "#dc2626" : isPeak ? "#64748b" : isZero ? "#f1f5f9" : "#94a3b8"}
                          filter={isLatest || isPeak ? "url(#expenseBarShadow)" : undefined}
                        />
                        <g className="pointer-events-none opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                          <rect x={tx} y={ty} width={174} height={52} rx={12} className="fill-white stroke-slate-200/90" filter="url(#expenseBarShadow)" />
                          <text x={tx + 14} y={ty + 20} className="fill-slate-500 text-[11px] font-semibold">
                            {point.fullDate}
                          </text>
                          <text x={tx + 14} y={ty + 39} className="fill-slate-950 text-[13px] font-bold">
                            {formatIncomeJPY(point.amount)}
                          </text>
                        </g>

                        {index % labelEvery === 0 || index === points.length - 1 ? (
                          <text x={x + barWidth / 2} y={bottom + 30} textAnchor="middle" className="fill-slate-700 text-[12px] font-medium">
                            {point.label}
                          </text>
                        ) : null}
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>
      </div>
    </div>
  );
}

export function ExpenseCategoryProductWorkspace(props: {
  lang: string;
  kind: ExpenseCategoryProductKind;
}) {
  const { lang, kind } = props;
  const config = PAGE_CONFIG[kind];

  const [rows, setRows] = React.useState<ExpenseCategoryRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [range, setRange] = React.useState<RangePreset>("30d");
  const [sourceFilter, setSourceFilter] = React.useState("all");
  const [sortMode, setSortMode] = React.useState<SortMode>("date_desc");
  const [pageSize, setPageSize] = React.useState<20 | 50 | 100>(20);
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await listTransactions("EXPENSE");
        if (!mounted) return;
        const items = Array.isArray(res.items) ? res.items : [];
        const next = items
          .filter((item) => matchesWorkspaceKind(kind, item))
          .map((item) => mapExpenseRecord(kind, item));

        setRows(next);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "支出データの取得に失敗しました。");
        setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [kind]);

  const filteredRows = React.useMemo(() => {
    const next =
      sourceFilter === "all"
        ? rows
        : rows.filter((row) => row.categoryLabel === getBucketLabel(kind, sourceFilter));

    return sortRecords(next, sortMode);
  }, [rows, sourceFilter, sortMode, kind]);

  const totalAmount = React.useMemo(
    () => filteredRows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    [filteredRows]
  );

  const accountCount = React.useMemo(
    () => new Set(filteredRows.map((row) => row.account || "-")).size,
    [filteredRows]
  );

  const latestDate = filteredRows[0]?.date || "-";
  const averageAmount = filteredRows.length > 0 ? totalAmount / filteredRows.length : 0;
  const points = React.useMemo(() => buildDenseDailyPoints(filteredRows, range), [filteredRows, range]);

  const summaryCards = React.useMemo(() => {
    const map = new Map<string, { label: string; amount: number; count: number }>();
    for (const row of filteredRows) {
      const found = map.get(row.categoryLabel);
      if (found) {
        found.amount += row.amount;
        found.count += 1;
      } else {
        map.set(row.categoryLabel, {
          label: row.categoryLabel,
          amount: row.amount,
          count: 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [filteredRows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const pageRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const pageWindow = buildPageWindow(safePage, totalPages);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [sourceFilter, range, sortMode, pageSize, kind]);

  return (
    <div className="space-y-6" data-scope={`expense-category-product-workspace ${config.scope}`}>
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-950">{config.title}</div>
            <div className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">{config.subtitle}</div>
          </div>
          <Link
            href={`/${lang}/app/expenses`}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            支出 root に戻る
          </Link>
        </div>

        <div className="mt-7 grid gap-4 xl:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">{config.sourceLabel}</span>
            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900"
            >
              {KIND_OPTIONS[kind].map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">現在範囲</span>
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as RangePreset)}
              className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900"
            >
              <option value="30d">直近30日</option>
              <option value="90d">直近90日</option>
              <option value="12m">直近12ヶ月</option>
            </select>
          </label>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-500">{config.totalLabel}</div>
            <div className="mt-3 text-2xl font-bold text-slate-950">{formatIncomeJPY(totalAmount)}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-500">明細数</div>
            <div className="mt-3 text-2xl font-bold text-slate-950">{filteredRows.length}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-500">口座数</div>
            <div className="mt-3 text-2xl font-bold text-slate-950">{accountCount}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-500">平均金額</div>
            <div className="mt-3 text-2xl font-bold text-slate-950">{formatIncomeJPY(averageAmount)}</div>
            <div className="mt-2 text-xs text-slate-500">最新日 {latestDate}</div>
          </div>
        </div>
      </section>

      <ExpenseChartPair points={points} />

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="text-xl font-semibold text-slate-950">操作メニュー</div>
          <div className="text-xs font-medium text-slate-500">
            銀行流水・証憑との閉じ込みは後続 Phase で接続
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <Link
            href={`/${lang}/app/expenses?action=create`}
            className="rounded-2xl bg-slate-950 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-slate-800"
          >
            {config.primaryAction}
          </Link>
          <Link
            href={`/${lang}/app/data/import?module=expenses&category=${kind}`}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-900 transition hover:bg-slate-50"
          >
            {config.importLabel}
          </Link>
          <button
            type="button"
            disabled
            className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-400"
          >
            {config.title}を編集
          </button>
          <Link
            href={`/${lang}/app/settings/categories`}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-900 transition hover:bg-slate-50"
          >
            {config.settingLabel}
          </Link>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold text-slate-950">{config.title} 明細</div>
            <div className="mt-2 text-sm text-slate-600">
              支出明細を一覧で確認できます。銀行流水・証憑が不足する場合は確認対象として扱います。
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            並び替え
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="date_desc">発生日（新しい順）</option>
              <option value="date_asc">発生日（古い順）</option>
              <option value="amount_desc">金額（高い順）</option>
              <option value="amount_asc">金額（低い順）</option>
            </select>
          </label>
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-bold text-slate-950">支出区分サマリー</div>
              <div className="mt-1 text-sm text-slate-600">税務申告・証憑確認で使いやすい区分に整理しています。</div>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
              表示中 {summaryCards.length} 区分
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {summaryCards.length > 0 ? (
              summaryCards.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    const found = KIND_OPTIONS[kind].find((option) => option.label === item.label);
                    if (found) setSourceFilter(found.value);
                  }}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-slate-950">{item.label}</div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      {item.count}件
                    </span>
                  </div>
                  <div className="mt-3 text-xl font-bold text-slate-950">{formatIncomeJPY(item.amount)}</div>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">
                表示できる支出区分はまだありません。
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap gap-2">
            {KIND_OPTIONS[kind].map((item) => {
              const active = sourceFilter === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSourceFilter(item.value)}
                  className={
                    active
                      ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                      : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  }
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
          <div className="grid grid-cols-[140px_160px_1fr_180px_140px] gap-4 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
            <div>発生日</div>
            <div>種別</div>
            <div>メモ・支払先</div>
            <div>口座 / 状態</div>
            <div className="text-right">金額</div>
          </div>

          {loading ? (
            <div className="px-4 py-8 text-sm text-slate-500">loading...</div>
          ) : error ? (
            <div className="px-4 py-8 text-sm text-rose-600">{error}</div>
          ) : pageRows.length === 0 ? (
            <div className="px-4 py-8 text-sm text-slate-500">表示できる明細はありません。</div>
          ) : (
            pageRows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[140px_160px_1fr_180px_140px] gap-4 border-t border-slate-100 px-4 py-4 text-sm"
              >
                <div className="text-slate-700">{row.date}</div>
                <div>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-800">
                    {row.categoryLabel}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-slate-950">{row.memo}</div>
                  <div className="mt-1 text-xs text-slate-500">{row.vendor}</div>
                </div>
                <div>
                  <div className="text-slate-700">{row.account}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {row.statusFlags.length > 0 ? (
                      row.statusFlags.map((flag) => (
                        <span key={flag} className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200">
                          {flag}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                        確認済み
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right font-bold text-slate-950">{formatIncomeJPY(row.amount)}</div>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <div>
            全 {filteredRows.length} 行のうち、{filteredRows.length === 0 ? 0 : (safePage - 1) * pageSize + 1} - {Math.min(safePage * pageSize, filteredRows.length)} 行を表示
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">1ページあたり</span>
            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value) as 20 | 50 | 100)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value={20}>20件</option>
              <option value={50}>50件</option>
              <option value={100}>100件</option>
            </select>
            <button type="button" onClick={() => setCurrentPage(1)} disabled={safePage <= 1} className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold disabled:opacity-40">最初</button>
            <button type="button" onClick={() => setCurrentPage(Math.max(1, safePage - 1))} disabled={safePage <= 1} className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold disabled:opacity-40">前へ</button>
            {pageWindow.map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={page === safePage ? "rounded-xl bg-slate-950 px-4 py-2 font-bold text-white" : "rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold"}
              >
                {page}
              </button>
            ))}
            <button type="button" onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))} disabled={safePage >= totalPages} className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold disabled:opacity-40">次へ</button>
            <button type="button" onClick={() => setCurrentPage(totalPages)} disabled={safePage >= totalPages} className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold disabled:opacity-40">最後</button>
          </div>
        </div>
      </section>
    </div>
  );
}
