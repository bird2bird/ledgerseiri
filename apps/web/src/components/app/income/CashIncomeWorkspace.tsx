"use client";

import React from "react";
import Link from "next/link";
import type { IncomeRow } from "@/core/transactions/transactions";
import { formatIncomeJPY } from "@/core/transactions/income-page-constants";
import { createTransaction } from "@/core/transactions/api";
import { listAccounts } from "@/core/funds/api";
import {
  formatCashDraftMessage,
  parseCashIncomeCsvDraft,
  splitCsvLine,
} from "@/core/imports/cash-income-import-client";
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
  cashDeleteFeedback: {
    amount: number;
    date: string;
    memo: string;
    account: string;
  } | null;
  setCashDeleteFeedback: (next: null) => void;
  handleEditSave: () => Promise<void>;
  handleDeleteSelected: () => Promise<void>;
  reloadRows: () => Promise<void>;
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


type CashFileImportFeedback = {
  kind: "success" | "error";
  title: string;
  message: string;
  fileName?: string;
  importedRows?: number;
  blockedRows?: number;
  importedAmount?: number;
};

function escapeCsvCell(value: string) {
  const raw = String(value ?? "");
  if (raw.includes(",") || raw.includes("\"") || raw.includes("\n")) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function normalizeCashFileCsvHeaders(csvText: string) {
  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/);

  if (lines.length === 0) return csvText;

  const header = splitCsvLine(lines[0]).map((cell) => String(cell || "").trim());
  const headerMap: Record<string, string> = {
    "口座": "account",
    "口座名": "account",
    "入金口座": "account",
    "accountName": "account",
    "金額": "amount",
    "入金額": "amount",
    "発生日": "occurredAt",
    "日付": "occurredAt",
    "取引日": "occurredAt",
    "occurredAt": "occurredAt",
    "メモ": "memo",
    "摘要": "memo",
    "備考": "memo",
    "入金元": "source",
    "店舗": "source",
    "source": "source",
  };

  const normalizedHeader = header.map((cell) => headerMap[cell] || cell);
  const changed = normalizedHeader.join(",") !== header.join(",");

  if (!changed) return csvText;

  return [
    normalizedHeader.map(escapeCsvCell).join(","),
    ...lines.slice(1),
  ].join("\n");
}

async function readCashIncomeFileAsCsvText(file: File) {
  const lower = file.name.toLowerCase();

  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = sheetName ? workbook.Sheets[sheetName] : null;

    if (!sheet) {
      throw new Error("Excel ファイルに読み取れるシートがありません。");
    }

    return XLSX.utils.sheet_to_csv(sheet);
  }

  return await file.text();
}

function resolveCashAccountId(args: {
  accountName: string;
  accounts: CashAccountOption[];
}) {
  const raw = String(args.accountName || "").trim();
  const normalized = raw.toLowerCase();

  const exact = args.accounts.find((item) => item.name === raw);
  if (exact) return exact.id;

  const loose = args.accounts.find((item) => {
    const name = String(item.name || "").toLowerCase();
    return name.includes(normalized) || normalized.includes(name);
  });
  if (loose) return loose.id;

  const cashFallback = args.accounts.find((item) => {
    const name = String(item.name || "");
    return name.includes("現金") || name.toLowerCase().includes("cash");
  });

  return cashFallback?.id || "";
}

function stripCashSourceMarker(value?: string | null) {
  return String(value || "")
    .replace(/\s*\[file-import:[^\]]+\]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
    cashDeleteFeedback,
    setCashDeleteFeedback,
    handleEditSave,
    handleDeleteSelected,
    reloadRows,
  } = props;

  const [sortMode, setSortMode] = React.useState<CashSortMode>("date_desc");
  const [editingRow, setEditingRow] = React.useState<IncomeRow | null>(null);
  const cashFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [cashFileImportLoading, setCashFileImportLoading] = React.useState(false);
  const [cashFileImportFeedback, setCashFileImportFeedback] =
    React.useState<CashFileImportFeedback | null>(null);

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

  const normalizedSidebarActions: CashActionItem[] = sidebarActions.map((item) => {
    if (item.label === "現金収入CSV取込" || item.label === "CSV取込") {
      return {
        ...item,
        label: "現金収入CSV取込",
        href: undefined,
        disabled: false,
      };
    }

    if (item.label === "現金収入を編集" || item.label === "編集") {
      return {
        ...item,
        label: "現金収入を編集",
        href: undefined,
        disabled: !selectedRow,
      };
    }

    if (item.label === "入金元/補助設定" || item.label === "店舗紐付け") {
      return {
        ...item,
        label: "入金元/補助設定",
        href: "/ja/app/settings/accounts",
        disabled: false,
      };
    }

    if (item.label === "新規収入") {
      return {
        ...item,
        label: "新規現金収入",
      };
    }

    return item;
  });

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

  async function handleCashIncomeFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file || cashFileImportLoading) return;

    setCashFileImportLoading(true);
    setCashFileImportFeedback(null);

    try {
      const rawCsv = await readCashIncomeFileAsCsvText(file);
      const normalizedCsv = normalizeCashFileCsvHeaders(rawCsv);
      const draftRows = parseCashIncomeCsvDraft(normalizedCsv);
      const validRows = draftRows.filter((row) => row.status !== "error");

      if (draftRows.length === 0) {
        throw new Error("取込できる行がありません。CSV / Excel の内容を確認してください。");
      }

      if (validRows.length === 0) {
        const firstError = draftRows
          .flatMap((row) => row.messages)
          .map(formatCashDraftMessage)[0];

        throw new Error(firstError || "有効な現金収入行がありません。");
      }

      const accountsRes = accounts.length > 0 ? { items: accounts } : await listAccounts();
      const sourceAccounts = accountsRes.items ?? [];
      let importedRows = 0;
      let blockedRows = 0;
      let importedAmount = 0;

      for (const row of validRows) {
        const resolvedAccountId = resolveCashAccountId({
          accountName: row.account,
          accounts: sourceAccounts,
        });

        if (!resolvedAccountId) {
          blockedRows += 1;
          continue;
        }

        const occurredAt = new Date(row.occurredAt);
        if (Number.isNaN(occurredAt.getTime())) {
          blockedRows += 1;
          continue;
        }

        const visibleMemo = stripCashSourceMarker(row.memo || "現金収入");
        const sourcePart = row.source ? ` / ${row.source}` : "";
        const fileMarker = ` [file-import:${file.name}]`;

        await createTransaction({
          accountId: resolvedAccountId,
          categoryId: null,
          type: "OTHER",
          direction: "INCOME",
          amount: Number(row.amount || 0),
          currency: "JPY",
          occurredAt: occurredAt.toISOString(),
          memo: `[cash] ${visibleMemo}${sourcePart}${fileMarker}`,
        });

        importedRows += 1;
        importedAmount += Number(row.amount || 0);
      }

      await reloadRows();
      setCurrentPage(1);

      setCashFileImportFeedback({
        kind: importedRows > 0 ? "success" : "error",
        title:
          importedRows > 0
            ? "現金収入ファイルを取込しました"
            : "取込できる行がありませんでした",
        message:
          importedRows > 0
            ? "ファイルから Transaction を作成し、一覧を再取得しました。"
            : "口座名が既存の入金口座と一致しているか確認してください。",
        fileName: file.name,
        importedRows,
        blockedRows,
        importedAmount,
      });
    } catch (e: unknown) {
      setCashFileImportFeedback({
        kind: "error",
        title: "現金収入ファイルの取込に失敗しました",
        message: e instanceof Error ? e.message : String(e),
        fileName: file.name,
      });
    } finally {
      setCashFileImportLoading(false);
    }
  }

  function handlePageActionClick(item: CashActionItem) {
    if (item.disabled) return;

    if (item.label === "現金収入CSV取込") {
      cashFileInputRef.current?.click();
      return;
    }

    if (item.label === "現金収入を編集" && selectedRow) {
      openEdit(selectedRow);
    }
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
      <input
        ref={cashFileInputRef}
        type="file"
        accept=".csv,.tsv,.txt,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="hidden"
        onChange={(event) => void handleCashIncomeFileSelected(event)}
      />
      {cashDeleteFeedback ? (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-base font-semibold text-emerald-900">
                現金収入明細を削除しました
              </div>
              <div className="mt-1 text-sm text-emerald-700">
                一覧を再取得しました。削除済みの明細は現在の一覧から除外されています。
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCashDeleteFeedback(null)}
              className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              通知を閉じる
            </button>
          </div>

          <div className="mt-4 grid gap-3 rounded-2xl border border-emerald-100 bg-white/80 p-4 md:grid-cols-4">
            <div>
              <div className="text-xs font-medium text-emerald-600">金額</div>
              <div className="mt-1 font-semibold text-slate-900">
                {formatIncomeJPY(cashDeleteFeedback.amount)}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-emerald-600">発生日</div>
              <div className="mt-1 font-semibold text-slate-900">
                {cashDeleteFeedback.date || "-"}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-emerald-600">口座</div>
              <div className="mt-1 font-semibold text-slate-900">
                {cashDeleteFeedback.account || "-"}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-emerald-600">メモ</div>
              <div className="mt-1 line-clamp-2 font-semibold text-slate-900">
                {cashDeleteFeedback.memo || "-"}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-lg font-semibold text-slate-900">操作メニュー</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {normalizedSidebarActions.map((item) =>
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
              <button
                key={item.label}
                type="button"
                onClick={() => handlePageActionClick(item)}
                disabled={item.disabled || (item.label === "現金収入CSV取込" && cashFileImportLoading)}
                className={[
                  "inline-flex h-12 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition",
                  item.disabled
                    ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                {item.label === "現金収入CSV取込" && cashFileImportLoading ? "取込中..." : item.label}
              </button>
            )
          )}
        </div>

        {cashFileImportFeedback ? (
          <div
            className={[
              "mt-4 rounded-2xl border px-4 py-3 text-sm",
              cashFileImportFeedback.kind === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800",
            ].join(" ")}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{cashFileImportFeedback.title}</div>
                <div className="mt-1 text-xs leading-5">
                  {cashFileImportFeedback.message}
                </div>
                <div className="mt-2 grid gap-2 text-xs md:grid-cols-4">
                  <div>
                    <span className="font-semibold">File:</span>{" "}
                    {cashFileImportFeedback.fileName || "-"}
                  </div>
                  <div>
                    <span className="font-semibold">Imported:</span>{" "}
                    {cashFileImportFeedback.importedRows ?? 0}
                  </div>
                  <div>
                    <span className="font-semibold">Blocked:</span>{" "}
                    {cashFileImportFeedback.blockedRows ?? 0}
                  </div>
                  <div>
                    <span className="font-semibold">Amount:</span>{" "}
                    {formatIncomeJPY(cashFileImportFeedback.importedAmount ?? 0)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCashFileImportFeedback(null)}
                className="rounded-xl border border-white/70 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                閉じる
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-slate-900">現金収入明細</div>
            <div className="mt-1 text-sm text-slate-500">
              現金入金明細を一覧で確認できます。行をクリックすると編集 drawer が開きます。
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">並び替え</span>
            <select
              value={sortMode}
              onChange={(e) => {
                setSortMode(e.target.value as CashSortMode);
                setCurrentPage(1);
              }}
              className="h-10 min-w-[180px] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
            >
              <option value="date_desc">発生日（新しい順）</option>
              <option value="date_asc">発生日（古い順）</option>
              <option value="amount_desc">金額（高い順）</option>
              <option value="amount_asc">金額（低い順）</option>
            </select>
          </div>
        </div>

        {selectedRow ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="grid gap-3 md:grid-cols-5">
              <div>
                <div className="text-xs text-slate-500">発生日</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.date}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">種別</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.label}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">口座</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.account}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">入金元</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.store || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">金額</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {formatIncomeJPY(selectedRow.amount)}
                </div>
              </div>
            </div>
            {selectedRow.memo ? (
              <div className="mt-3 border-t border-slate-200 pt-3 text-sm text-slate-600">
                {stripCashSourceMarker(selectedRow.memo)}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[140px_1.1fr_1fr_180px_140px] gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            <div>発生日</div>
            <div>種別</div>
            <div>メモ・入金元</div>
            <div>口座</div>
            <div className="text-right">金額</div>
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
                    <div className="text-slate-600">{stripCashSourceMarker(row.memo) || "-"}</div>
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
                <option value={20}>20 件</option>
                <option value={50}>50 件</option>
                <option value={100}>100 件</option>
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
