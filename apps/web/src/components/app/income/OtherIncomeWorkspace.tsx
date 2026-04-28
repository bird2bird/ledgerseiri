"use client";

import React from "react";
import Link from "next/link";
import type { IncomeRow } from "@/core/transactions/transactions";
import type { AccountItem } from "@/core/funds/api";
import type { TransactionCategoryItem } from "@/core/transactions/api";
import { formatIncomeJPY } from "@/core/transactions/income-page-constants";

type OtherIncomeActionItem = {
  label: string;
  href?: string;
  disabled?: boolean;
};

type OtherIncomeSortMode = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

type OtherIncomeWorkspaceProps = {
  lang: string;
  rows: IncomeRow[];
  selectedRowId: string;
  onSelectRow: (id: string) => void;
  selectedRow: IncomeRow | null;

  pageSize: 20 | 50 | 100;
  setPageSize: (next: 20 | 50 | 100) => void;
  currentPage: number;
  setCurrentPage: (next: number) => void;

  action: string | null;
  clearActionMode: () => void;
  sidebarActions: OtherIncomeActionItem[];

  accounts: AccountItem[];
  txCategories: TransactionCategoryItem[];
  formLoading: boolean;
  submitLoading: boolean;
  panelError: string;
  setPanelError: (next: string) => void;

  accountId: string;
  setAccountId: (next: string) => void;
  categoryId: string;
  setCategoryId: (next: string) => void;
  amount: string;
  setAmount: (next: string) => void;
  occurredAt: string;
  setOccurredAt: (next: string) => void;
  memo: string;
  setMemo: (next: string) => void;
  submitCreate: (override?: { memo?: string }) => Promise<void>;

  editAmount: string;
  setEditAmount: (next: string) => void;
  editMemo: string;
  setEditMemo: (next: string) => void;
  editUiError: string;
  editUiMessage: string;
  editSaveLoading: boolean;
  editCanSave: boolean;
  handleEditSave: (override?: { memo?: string }) => Promise<void>;
};

function parseOtherIncomeDateMs(row: IncomeRow) {
  const raw = String(row.sortAt || row.importedAt || row.date || "");
  const ts = new Date(raw).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function buildOtherIncomePageWindow(current: number, total: number) {
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);
  const pages: number[] = [];
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
}

function getOtherIncomeCategoryLabel(row: IncomeRow) {
  return String(row.label || "その他収入");
}

function getOtherIncomeMemo(row: IncomeRow) {
  return String(row.memo || "").trim();
}

function buildOtherIncomeCategorySummary(rows: IncomeRow[]) {
  const map = new Map<string, { label: string; count: number; amount: number }>();

  for (const row of rows) {
    const label = getOtherIncomeCategoryLabel(row);
    const found = map.get(label);
    if (found) {
      found.count += 1;
      found.amount += Number(row.amount || 0);
    } else {
      map.set(label, {
        label,
        count: 1,
        amount: Number(row.amount || 0),
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

function getOtherIncomeActionLabel(label: string) {
  if (label === "新規収入") return "新規その他収入";
  if (label === "CSV取込") return "その他収入CSV取込";
  if (label === "編集") return "その他収入を編集";
  if (label === "店舗紐付け") return "収入元/補助設定";
  return label;
}

function getOtherIncomeActionHref(args: {
  item: OtherIncomeActionItem;
  lang: string;
}) {
  const { item, lang } = args;

  if (item.label === "CSV取込") {
    return `/${lang}/app/data/import?module=income&category=other`;
  }
  if (item.label === "店舗紐付け") {
    return `/${lang}/app/settings/accounts`;
  }

  return item.href;
}

function getLatestOtherIncomeDate(rows: IncomeRow[]) {
  const sorted = [...rows].sort((a, b) => parseOtherIncomeDateMs(b) - parseOtherIncomeDateMs(a));
  return sorted[0]?.date || "-";
}

function formatOtherIncomeAverage(rows: IncomeRow[], totalAmount: number) {
  if (rows.length === 0) return formatIncomeJPY(0);
  return formatIncomeJPY(totalAmount / rows.length);
}

function findCategoryName(categoryId: string, categories: TransactionCategoryItem[]) {
  return categories.find((item) => item.id === categoryId)?.name || "未選択";
}

function findAccountName(accountId: string, accounts: AccountItem[]) {
  return accounts.find((item) => item.id === accountId)?.name || "未選択";
}

export function OtherIncomeWorkspace(props: OtherIncomeWorkspaceProps) {
  const {
    lang,
    rows,
    selectedRowId,
    onSelectRow,
    selectedRow,

    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,

    action,
    clearActionMode,
    sidebarActions,

    accounts,
    txCategories,
    formLoading,
    submitLoading,
    panelError,
    setPanelError,

    accountId,
    setAccountId,
    categoryId,
    setCategoryId,
    amount,
    setAmount,
    occurredAt,
    setOccurredAt,
    memo,
    setMemo,
    submitCreate,

    editAmount,
    setEditAmount,
    editMemo,
    setEditMemo,
    editUiError,
    editUiMessage,
    editSaveLoading,
    editCanSave,
    handleEditSave,
  } = props;

  const [sortMode, setSortMode] = React.useState<OtherIncomeSortMode>("date_desc");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [drawerRow, setDrawerRow] = React.useState<IncomeRow | null>(null);

  const totalAmount = React.useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    [rows]
  );
  const categorySummary = React.useMemo(() => buildOtherIncomeCategorySummary(rows), [rows]);
  const accountCount = React.useMemo(
    () => new Set(rows.map((row) => String(row.account || "-"))).size,
    [rows]
  );

  const filteredRows = React.useMemo(() => {
    if (categoryFilter === "all") return rows;
    return rows.filter((row) => getOtherIncomeCategoryLabel(row) === categoryFilter);
  }, [rows, categoryFilter]);

  const sortedRows = React.useMemo(() => {
    const next = [...filteredRows];
    next.sort((a, b) => {
      const aDate = parseOtherIncomeDateMs(a);
      const bDate = parseOtherIncomeDateMs(b);
      const aAmount = Number(a.amount || 0);
      const bAmount = Number(b.amount || 0);

      if (sortMode === "date_asc") return aDate - bDate;
      if (sortMode === "date_desc") return bDate - aDate;
      if (sortMode === "amount_asc") return aAmount - bAmount;
      return bAmount - aAmount;
    });
    return next;
  }, [filteredRows, sortMode]);

  const totalRows = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = totalRows === 0 ? 0 : (safeCurrentPage - 1) * pageSize;
  const visibleRows = sortedRows.slice(pageStart, pageStart + pageSize);
  const pageStartRow = totalRows === 0 ? 0 : pageStart + 1;
  const pageEndRow = totalRows === 0 ? 0 : Math.min(pageStart + pageSize, totalRows);
  const pageWindow = buildOtherIncomePageWindow(safeCurrentPage, totalPages);
  const filteredAmount = filteredRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);

  const createOpen = action === "create";
  const editOpen = action === "edit" || drawerRow !== null;
  const drawerMode: "create" | "edit" = createOpen ? "create" : "edit";
  const editingRow = drawerRow ?? selectedRow;
  const drawerOpen = createOpen || (editOpen && !!editingRow);

  React.useEffect(() => {
    setCurrentPage(1);
    onSelectRow("");
  }, [categoryFilter, setCurrentPage, onSelectRow]);

  React.useEffect(() => {
    if (safeCurrentPage !== currentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [safeCurrentPage, currentPage, setCurrentPage]);

  React.useEffect(() => {
    if (action !== "edit") return;
    if (!selectedRow) return;
    setDrawerRow(selectedRow);
    setEditAmount(String(selectedRow.amount || ""));
    setEditMemo(getOtherIncomeMemo(selectedRow));
  }, [action, selectedRow, setEditAmount, setEditMemo]);

  function openEdit(row: IncomeRow) {
    onSelectRow(row.id);
    setEditAmount(String(row.amount || ""));
    setEditMemo(getOtherIncomeMemo(row));
    setDrawerRow(row);
  }

  function closeDrawer() {
    setDrawerRow(null);
    if (action) clearActionMode();
  }

  async function saveCreate() {
    await submitCreate();
    closeDrawer();
  }

  async function saveEdit() {
    await handleEditSave();
    closeDrawer();
  }

  const normalizedActions = sidebarActions.map((item) => ({
    ...item,
    label: getOtherIncomeActionLabel(item.label),
    href: getOtherIncomeActionHref({ item, lang }),
  }));

  return (
    <div className="space-y-6" data-scope="other-income-workspace-productized-z1a">
      <section className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-950">その他収入</div>
            <div className="mt-2 text-sm leading-6 text-slate-500">
              Amazon 以外の入金、サービス収入、補助金、調整入金などを現金収入ページと同じ操作感で管理します。
            </div>
          </div>
          <Link
            href={`/${lang}/app/income`}
            className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            収入 root に戻る
          </Link>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">表示中のその他収入</div>
            <div className="mt-2 text-xl font-semibold text-slate-950">{formatIncomeJPY(totalAmount)}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">明細数</div>
            <div className="mt-2 text-xl font-semibold text-slate-950">{rows.length.toLocaleString("ja-JP")}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">口座数</div>
            <div className="mt-2 text-xl font-semibold text-slate-950">{accountCount}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">平均金額</div>
            <div className="mt-2 text-xl font-semibold text-slate-950">
              {formatOtherIncomeAverage(rows, totalAmount)}
            </div>
            <div className="mt-1 text-xs text-slate-500">最新日 {getLatestOtherIncomeDate(rows)}</div>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-lg font-semibold text-slate-950">操作メニュー</div>
          <div className="text-xs text-slate-500">その他収入の登録・編集・取込導線</div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {normalizedActions.map((item) => {
            const primary = item.label === "新規その他収入";
            const disabled = item.disabled || (!item.href && item.label !== "その他収入を編集");

            if (item.label === "その他収入を編集") {
              return (
                <button
                  key={item.label}
                  type="button"
                  disabled={!selectedRow}
                  onClick={() => selectedRow && openEdit(selectedRow)}
                  className={[
                    "inline-flex h-12 items-center justify-center rounded-2xl border px-4 text-sm font-semibold transition",
                    selectedRow
                      ? "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                      : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            }

            if (item.href && !disabled) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={[
                    "inline-flex h-12 items-center justify-center rounded-2xl border px-4 text-sm font-semibold transition",
                    primary
                      ? "border-slate-950 bg-slate-950 text-white hover:bg-slate-800"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <div
                key={item.label}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-400"
              >
                {item.label}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-slate-950">収入区分別サマリー</div>
            <div className="mt-1 text-sm text-slate-500">
              その他収入をカテゴリ別に整理します。カードをクリックすると明細を絞り込めます。
            </div>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            表示中 {categorySummary.length} 区分
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {categorySummary.length > 0 ? (
            categorySummary.slice(0, 6).map((item) => {
              const active = categoryFilter === item.label;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setCategoryFilter(active ? "all" : item.label)}
                  className={[
                    "rounded-2xl border px-4 py-3 text-left shadow-sm transition",
                    active
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-950 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className={active ? "rounded-full bg-white/15 px-2.5 py-1 text-xs" : "rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"}>
                      {item.count}件
                    </div>
                  </div>
                  <div className="mt-2 text-lg font-semibold">{formatIncomeJPY(item.amount)}</div>
                </button>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              その他収入データがまだありません。
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-slate-950">その他収入明細</div>
            <div className="mt-1 text-sm text-slate-500">
              行をクリックすると編集 drawer が開きます。
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as OtherIncomeSortMode)}
              className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800"
            >
              <option value="date_desc">発生日（新しい順）</option>
              <option value="date_asc">発生日（古い順）</option>
              <option value="amount_desc">金額（高い順）</option>
              <option value="amount_asc">金額（低い順）</option>
            </select>
          </div>
        </div>

        <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={[
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                categoryFilter === "all"
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              全部
            </button>
            {categorySummary.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setCategoryFilter(item.label)}
                className={[
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  categoryFilter === item.label
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                {item.label}
                <span className={categoryFilter === item.label ? "ml-1 text-white/80" : "ml-1 text-slate-400"}>
                  {item.count}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-3">
            <div>
              表示件数: <span className="font-semibold text-slate-800">{filteredRows.length}</span> / {rows.length}
            </div>
            <div>
              表示金額: <span className="font-semibold text-slate-800">{formatIncomeJPY(filteredAmount)}</span>
            </div>
            <div>
              現在区分: <span className="font-semibold text-slate-800">{categoryFilter === "all" ? "全部" : categoryFilter}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">発生日</th>
                <th className="px-4 py-3">種別</th>
                <th className="px-4 py-3">メモ・収入元</th>
                <th className="px-4 py-3">口座</th>
                <th className="px-4 py-3 text-right">金額</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRows.length > 0 ? (
                visibleRows.map((row) => {
                  const active = selectedRowId === row.id;
                  return (
                    <tr
                      key={row.id}
                      onClick={() => openEdit(row)}
                      className={[
                        "cursor-pointer transition hover:bg-slate-50",
                        active ? "bg-indigo-50/50 ring-1 ring-inset ring-indigo-200" : "bg-white",
                      ].join(" ")}
                    >
                      <td className="px-4 py-3 text-slate-700">{row.date}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800">
                          {getOtherIncomeCategoryLabel(row)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{getOtherIncomeMemo(row) || "-"}</div>
                        <div className="mt-1 text-xs text-slate-500">{row.store || "-"}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.account || "-"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-950">
                        {formatIncomeJPY(row.amount)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                    {categoryFilter === "all" ? "その他収入データがまだ登録されていません。" : "選択した区分の明細はありません。"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
          <div>
            全 {totalRows.toLocaleString("ja-JP")} 行のうち、{pageStartRow} - {pageEndRow} 行を表示
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span>1ページあたり</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value) as 20 | 50 | 100)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
            >
              <option value={20}>20 件</option>
              <option value={50}>50 件</option>
              <option value={100}>100 件</option>
            </select>
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage(1)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-40"
            >
              最初
            </button>
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-40"
            >
              前へ
            </button>
            {pageWindow.map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={[
                  "rounded-xl border px-3 py-2 text-xs font-semibold",
                  page === safeCurrentPage
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-700",
                ].join(" ")}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-40"
            >
              次へ
            </button>
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-40"
            >
              最後
            </button>
          </div>
        </div>
      </section>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-[2px]">
          <aside className="h-full w-full max-w-[720px] overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xl font-semibold text-slate-950">
                    {drawerMode === "create" ? "新規その他収入" : "その他収入を編集"}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {drawerMode === "create"
                      ? "その他収入データを手動で追加します。"
                      : "選択したその他収入データの金額・メモを編集します。"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  閉じる
                </button>
              </div>
            </div>

            <div className="space-y-6 px-6 py-6">
              {drawerMode === "edit" && editingRow ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div>
                      <div className="text-xs text-slate-500">発生日</div>
                      <div className="mt-1 font-semibold text-slate-900">{editingRow.date}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">口座</div>
                      <div className="mt-1 font-semibold text-slate-900">{editingRow.account || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">現在金額</div>
                      <div className="mt-1 font-semibold text-slate-900">{formatIncomeJPY(editingRow.amount)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">種別</div>
                      <div className="mt-1 inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800">
                        {getOtherIncomeCategoryLabel(editingRow)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {panelError && drawerMode === "create" ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {panelError}
                </div>
              ) : null}

              {editUiError && drawerMode === "edit" ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {editUiError}
                </div>
              ) : null}

              {editUiMessage && drawerMode === "edit" ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {editUiMessage}
                </div>
              ) : null}

              {drawerMode === "create" ? (
                formLoading ? (
                  <div className="text-sm text-slate-500">loading...</div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <div className="mb-2 text-sm font-medium text-slate-700">口座</div>
                      <select
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm"
                      >
                        <option value="">未選択</option>
                        {accounts.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <div className="mb-2 text-sm font-medium text-slate-700">収入カテゴリ</div>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm"
                      >
                        <option value="">未選択</option>
                        {txCategories.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <div className="mb-2 text-sm font-medium text-slate-700">金額</div>
                      <input
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        inputMode="numeric"
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm"
                      />
                    </label>

                    <label className="block">
                      <div className="mb-2 text-sm font-medium text-slate-700">発生日</div>
                      <input
                        type="datetime-local"
                        value={occurredAt}
                        onChange={(e) => setOccurredAt(e.target.value)}
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm"
                      />
                    </label>

                    <label className="block md:col-span-2">
                      <div className="mb-2 text-sm font-medium text-slate-700">メモ</div>
                      <textarea
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        rows={5}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm"
                        placeholder="例: サービス収入 / 補助金入金 / 調整入金"
                      />
                    </label>
                  </div>
                )
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <div className="mb-2 text-sm font-medium text-slate-700">金額</div>
                    <input
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      inputMode="numeric"
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm"
                    />
                  </label>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <div className="text-xs text-slate-500">現在カテゴリ</div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {editingRow ? getOtherIncomeCategoryLabel(editingRow) : "-"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      カテゴリ変更は次段階で対応します。現在は金額とメモを保存できます。
                    </div>
                  </div>

                  <label className="block md:col-span-2">
                    <div className="mb-2 text-sm font-medium text-slate-700">メモ</div>
                    <textarea
                      value={editMemo}
                      onChange={(e) => setEditMemo(e.target.value)}
                      rows={5}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm"
                    />
                  </label>
                </div>
              )}

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">
                  {drawerMode === "create" ? "登録プレビュー" : "編集プレビュー"}
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-4">
                  <div>
                    <div className="text-xs text-slate-500">金額</div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {formatIncomeJPY(Number((drawerMode === "create" ? amount : editAmount) || 0))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">口座</div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {drawerMode === "create"
                        ? findAccountName(accountId, accounts)
                        : editingRow?.account || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">種別</div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {drawerMode === "create"
                        ? findCategoryName(categoryId, txCategories)
                        : editingRow
                          ? getOtherIncomeCategoryLabel(editingRow)
                          : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">発生日</div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {drawerMode === "create" ? occurredAt || "-" : editingRow?.date || "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (drawerMode === "create") {
                      void saveCreate();
                    } else {
                      void saveEdit();
                    }
                  }}
                  disabled={drawerMode === "create" ? submitLoading : !editCanSave || editSaveLoading}
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {drawerMode === "create"
                    ? submitLoading
                      ? "保存中..."
                      : "保存"
                    : editSaveLoading
                      ? "保存中..."
                      : "保存"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
