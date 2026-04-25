"use client";

import React from "react";
import Link from "next/link";
import type { IncomeRow } from "@/core/transactions/transactions";
import { formatIncomeJPY } from "@/core/transactions/income-page-constants";
import {
  CashIncomeDrawer,
  type CashAccountOption,
} from "@/components/app/income/CashIncomeDrawer";

type CashSortMode = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

type CashActionItem = {
  label: string;
  href?: string;
  disabled?: boolean;
};

type CashSortableIncomeRow = IncomeRow & {
  sortAt?: string | null;
  importedAt?: string | null;
};

type CashIncomeWorkspaceProps = {
  rows: IncomeRow[];
  selectedRowId: string;
  onSelectRow: (id: string) => void;
  selectedRow: IncomeRow | null;
  pageSize: 20 | 50 | 100;
  setPageSize: (next: 20 | 50 | 100) => void;
  currentPage: number;
  setCurrentPage: (next: number) => void;
  sidebarActions: CashActionItem[];

  action: string | null;
  clearActionMode: () => void;

  accounts: CashAccountOption[];
  formLoading: boolean;
  submitLoading: boolean;
  panelError: string;
  setPanelError: (next: string) => void;
  accountId: string;
  setAccountId: (next: string) => void;
  amount: string;
  setAmount: (next: string) => void;
  occurredAt: string;
  setOccurredAt: (next: string) => void;
  memo: string;
  setMemo: (next: string) => void;
  submitCreate: () => Promise<void>;

  editAmount: string;
  setEditAmount: (next: string) => void;
  editMemo: string;
  setEditMemo: (next: string) => void;
  editUiError: string;
  editUiMessage: string;
  editSaveLoading: boolean;
  editCanSave: boolean;
  deleteLoading: boolean;
  handleEditSave: () => Promise<void>;
  handleDeleteSelected: () => Promise<void>;
};

function parseRowDateMs(row: IncomeRow) {
  const cashRow = row as CashSortableIncomeRow;
  const raw = String(cashRow.sortAt || cashRow.importedAt || row.date || "");
  const ts = new Date(raw).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function buildPageWindow(current: number, total: number) {
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);
  const pages: number[] = [];
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
}

export function CashIncomeWorkspace(props: CashIncomeWorkspaceProps) {
  const {
    rows,
    selectedRowId,
    onSelectRow,
    selectedRow,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    sidebarActions,

    action,
    clearActionMode,

    accounts,
    formLoading,
    submitLoading,
    panelError,
    setPanelError,
    accountId,
    setAccountId,
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
    deleteLoading,
    handleEditSave,
    handleDeleteSelected,
  } = props;

  const [sortMode, setSortMode] = React.useState<CashSortMode>("date_desc");
  const [editingRow, setEditingRow] = React.useState<IncomeRow | null>(null);

  const sortedRows = React.useMemo(() => {
    const next = [...rows];
    next.sort((a, b) => {
      const aDate = parseRowDateMs(a);
      const bDate = parseRowDateMs(b);
      const aAmount = Number(a.amount || 0);
      const bAmount = Number(b.amount || 0);

      if (sortMode === "date_asc") return aDate - bDate;
      if (sortMode === "date_desc") return bDate - aDate;
      if (sortMode === "amount_asc") return aAmount - bAmount;
      return bAmount - aAmount;
    });
    return next;
  }, [rows, sortMode]);

  const totalRows = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = totalRows === 0 ? 0 : (safeCurrentPage - 1) * pageSize;
  const visibleRows = sortedRows.slice(pageStart, pageStart + pageSize);
  const pageStartRow = totalRows === 0 ? 0 : pageStart + 1;
  const pageEndRow = totalRows === 0 ? 0 : Math.min(pageStart + pageSize, totalRows);
  const pageWindow = buildPageWindow(safeCurrentPage, totalPages);

  const normalizedSidebarActions = sidebarActions.map((item: any) =>
    item.label === "現金収入CSV取込"
      ? {
          ...item,
          href: "/ja/app/data/import?module=cash-income",
          disabled: false,
        }
      : item
  );

  const createDrawerOpen = action === "create";
  const editDrawerOpen = editingRow !== null;
  const cashDrawerOpen = createDrawerOpen || editDrawerOpen;
  const cashDrawerMode: "create" | "edit" = createDrawerOpen ? "create" : "edit";
  const cashDrawerRow = createDrawerOpen ? null : editingRow;

  function openEdit(row: IncomeRow) {
    onSelectRow(row.id);
    setEditAmount(String(row.amount || ""));
    setEditMemo(row.memo || "");
    setEditingRow(row);
  }

  function closeCashDrawer() {
    if (createDrawerOpen) {
      clearActionMode();
    }
    setEditingRow(null);
  }

  React.useEffect(() => {
    if (action !== "edit") return;

    if (!selectedRow) {
      clearActionMode();
      return;
    }

    setEditAmount(String(selectedRow.amount || ""));
    setEditMemo(selectedRow.memo || "");
    setEditingRow(selectedRow);
    clearActionMode();
  }, [action, selectedRow, clearActionMode, setEditAmount, setEditMemo]);

  React.useEffect(() => {
    if (safeCurrentPage !== currentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [safeCurrentPage, currentPage, setCurrentPage]);

  React.useEffect(() => {
    if (!selectedRowId) return;
    const exists = sortedRows.some((row) => row.id === selectedRowId);
    if (!exists) onSelectRow("");
  }, [sortedRows, selectedRowId, onSelectRow]);

return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-lg font-semibold text-slate-900">Page Actions</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {normalizedSidebarActions.map((item: any) =>
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                aria-disabled={item.disabled ? "true" : "false"}
                className={[
                  "inline-flex h-12 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition",
                  item.disabled
                    ? "pointer-events-none cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                    : item.label === "新規現金収入"
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm hover:bg-slate-800"
                      : item.label === "現金収入CSV取込"
                        ? "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                {item.label}
              </Link>
            ) : (
              <div
                key={item.label}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-400"
              >
                {item.label}
              </div>
            )
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-slate-900">Cash Income Rows</div>
            <div className="mt-1 text-sm text-slate-500">
              現金入金明細を一覧で確認し、クリックした行の概要をすばやく確認できます。
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">排序</span>
            <select
              value={sortMode}
              onChange={(e) => {
                setSortMode(e.target.value as CashSortMode);
                setCurrentPage(1);
              }}
              className="h-10 min-w-[180px] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
            >
              <option value="date_desc">日期（新→旧）</option>
              <option value="date_asc">日期（旧→新）</option>
              <option value="amount_desc">金额（高→低）</option>
              <option value="amount_asc">金额（低→高）</option>
            </select>
          </div>
        </div>

        {selectedRow ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="grid gap-3 md:grid-cols-5">
              <div>
                <div className="text-xs text-slate-500">Date</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.date}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Label</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.label}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Account</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.account}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Store</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.store || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Amount</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {formatIncomeJPY(selectedRow.amount)}
                </div>
              </div>
            </div>
            {selectedRow.memo ? (
              <div className="mt-3 border-t border-slate-200 pt-3 text-sm text-slate-600">
                {selectedRow.memo}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[140px_1.1fr_1fr_180px_140px] gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            <div>Date</div>
            <div>Label</div>
            <div>Memo / Store</div>
            <div>Account</div>
            <div className="text-right">Amount</div>
          </div>

          {visibleRows.length > 0 ? (
            visibleRows.map((row) => {
              const active = selectedRowId === row.id;
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => openEdit(row)}
                  className={[
                    "grid w-full grid-cols-[140px_1.1fr_1fr_180px_140px] gap-4 border-t border-slate-100 px-4 py-3 text-left text-sm transition",
                    active
                      ? "bg-indigo-50 ring-1 ring-inset ring-indigo-300 shadow-sm"
                      : "bg-white hover:bg-slate-50/80 hover:shadow-[inset_3px_0_0_#CBD5E1]",
                  ].join(" ")}
                >
                  <div className="text-slate-600">{row.date}</div>
                  <div>
                    <div className="font-medium text-slate-900">{row.label}</div>
                  </div>
                  <div>
                    <div className="text-slate-600">{row.memo || "-"}</div>
                    <div className="mt-1 text-xs text-slate-500">{row.store || "-"}</div>
                  </div>
                  <div className="text-slate-600">{row.account}</div>
                  <div className="text-right font-medium text-slate-900">
                    {formatIncomeJPY(row.amount)}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="border-t border-slate-100 bg-white px-6 py-12">
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                <div className="text-base font-medium text-slate-900">現金収入データがまだ登録されていません</div>
                <div className="mt-2 text-sm text-slate-500">
                  「新規現金収入」または「現金収入CSV取込」からデータを追加すると、ここに明細が表示されます。
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="text-sm text-slate-500">
            全 {totalRows} 行のうち、{pageStartRow} - {pageEndRow} 行を表示
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700">1ページあたり</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value) as 20 | 50 | 100);
                  setCurrentPage(1);
                }}
                className="h-10 min-w-[120px] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
              >
                <option value={20}>20 条</option>
                <option value={50}>50 条</option>
                <option value={100}>100 条</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage <= 1}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                最初
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}
                disabled={safeCurrentPage <= 1}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                前へ
              </button>

              {pageWindow.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={
                    page === safeCurrentPage
                      ? "inline-flex h-10 items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-4 text-sm font-medium text-white"
                      : "inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  }
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                次へ
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage >= totalPages}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                最後
              </button>
            </div>
          </div>
        </div>
      </div>

      <CashIncomeDrawer
        mode={cashDrawerMode}
        open={cashDrawerOpen}
        row={cashDrawerRow}
        onClose={closeCashDrawer}
        accounts={accounts}
        formLoading={formLoading}
        submitLoading={submitLoading}
        panelError={panelError}
        setPanelError={setPanelError}
        accountId={accountId}
        setAccountId={setAccountId}
        amount={amount}
        setAmount={setAmount}
        occurredAt={occurredAt}
        setOccurredAt={setOccurredAt}
        memo={memo}
        setMemo={setMemo}
        submitCreate={submitCreate}
        editAmount={editAmount}
        setEditAmount={setEditAmount}
        editMemo={editMemo}
        setEditMemo={setEditMemo}
        editUiError={editUiError}
        editUiMessage={editUiMessage}
        editSaveLoading={editSaveLoading}
        editCanSave={editCanSave}
        deleteLoading={deleteLoading}
        handleEditSave={handleEditSave}
        handleDelete={handleDeleteSelected}
      />
    </div>
  );
}
