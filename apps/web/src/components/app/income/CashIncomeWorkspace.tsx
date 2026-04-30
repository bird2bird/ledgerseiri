"use client";

import React from "react";
import Link from "next/link";
import type { IncomeRow } from "@/core/transactions/transactions";
import { formatIncomeJPY } from "@/core/transactions/income-page-constants";
import { LEDGER_SCOPES, buildLedgerTemplateCsv, getLedgerScopeConfig, validateLedgerCsvTextScope } from "@/core/ledger/ledger-scopes";
import { createTransaction, listTransactions } from "@/core/transactions/api";
import { listAccounts } from "@/core/funds/api";
import {
  formatCashDraftMessage,
  parseCashIncomeCsvDraft,
  splitCsvLine,
} from "@/core/imports/cash-income-import-client";
import {
  buildCashRevenueCategoryMemo,
  CASH_REVENUE_CATEGORIES,
  getCashRevenueCategoryLabel,
  normalizeCashRevenueCategory,
  stripCashRevenueCategoryMarker,
  type CashRevenueCategoryCode,
} from "@/core/transactions/cash-revenue-category";
import {
  CashIncomeDrawer,
  type CashAccountOption,
} from "@/components/app/income/CashIncomeDrawer";

type CashSortMode = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";
type CashRevenueCategoryFilter = "all" | CashRevenueCategoryCode;

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
  submitCreate: (override?: { memo?: string }) => Promise<void>;

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
  handleEditSave: (override?: { memo?: string }) => Promise<void>;
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

const CASH_INLINE_IMPORT_MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const CASH_INLINE_IMPORT_MAX_ROWS = 2000;
const CASH_INLINE_IMPORT_YIELD_EVERY = 10;
const CASH_INLINE_IMPORT_ALLOWED_EXTENSIONS = [".csv", ".tsv", ".txt", ".xlsx", ".xls"];

function formatCashImportFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.ceil(bytes / 1024)} KB`;
}


type CashRevenueCategorySummaryItem = {
  code: string;
  label: string;
  count: number;
  amount: number;
};

type CashFileImportFeedback = {
  kind: "success" | "error";
  title: string;
  message: string;
  fileName?: string;
  totalRows?: number;
  importedRows?: number;
  duplicateRows?: number;
  blockedRows?: number;
  importedAmount?: number;
  categorySummary?: CashRevenueCategorySummaryItem[];
};

type CashFileImportProgress = {
  open: boolean;
  status: "idle" | "reading" | "validating" | "importing" | "done" | "error";
  title: string;
  message: string;
  fileName: string;
  totalRows: number;
  processedRows: number;
  importedRows: number;
  duplicateRows: number;
  blockedRows: number;
  importedAmount: number;
  categorySummary: CashRevenueCategorySummaryItem[];
};


function resolveCashRevenueCategoryCodeFromRow(row: {
  revenueCategory?: string | null;
  memo?: string | null;
  label?: string | null;
}): CashRevenueCategoryCode {
  return normalizeCashRevenueCategory(row.revenueCategory || row.memo || row.label);
}

function buildCashRevenueCategorySummary(
  rows: { amount?: number | string | null; revenueCategory?: string | null; memo?: string | null; label?: string | null }[]
): CashRevenueCategorySummaryItem[] {
  const map = new Map<string, CashRevenueCategorySummaryItem>();

  for (const row of rows) {
    const code = resolveCashRevenueCategoryCodeFromRow(row);
    const label = getCashRevenueCategoryLabel(code);
    const found = map.get(code);
    const amount = Number(row.amount || 0);

    if (found) {
      found.count += 1;
      found.amount += amount;
    } else {
      map.set(code, {
        code,
        label,
        count: 1,
        amount,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

function buildCashRevenueCategoryTaxCsv(rows: IncomeRow[]) {
  const header = [
    "発生日",
    "収入区分",
    "収入区分コード",
    "金額",
    "口座",
    "入金元",
    "メモ",
  ];

  const lines = rows.map((row) => {
    const code = resolveCashRevenueCategoryCodeFromRow(row);
    return [
      row.date || "",
      getCashRevenueCategoryLabel(code),
      code,
      String(Number(row.amount || 0)),
      row.account || "",
      row.store || "",
      stripCashSourceMarker(row.memo) || "",
    ].map(escapeCsvCell).join(",");
  });

  return [header.join(","), ...lines].join("\r\n");
}

function downloadCashTextFile(args: { filename: string; text: string }) {
  const blob = new Blob(["\uFEFF", args.text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = args.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

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
    "種別": "revenueCategory",
    "区分": "revenueCategory",
    "収入区分": "revenueCategory",
    "売上区分": "revenueCategory",
    "category": "revenueCategory",
    "revenueCategory": "revenueCategory",
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
  return stripCashRevenueCategoryMarker(value)
    .replace(/\s*\[file-import:[^\]]+\]\s*/g, " ")
    .replace(/^\s*\[cash\]\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCashImportText(value?: string | null) {
  return stripCashSourceMarker(value)
    .replace(/^\s*\[cash\]\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeCashImportDateKey(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) {
    return `${direct.getFullYear()}-${String(direct.getMonth() + 1).padStart(2, "0")}-${String(direct.getDate()).padStart(2, "0")}`;
  }

  const normalized = raw.replace(/\//g, "-");
  const parsed = new Date(normalized.includes("T") ? normalized : `${normalized}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return raw.slice(0, 10);

  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

function buildCashImportDedupeKey(args: {
  accountName?: string | null;
  amount?: number | string | null;
  occurredAt?: string | null;
  memo?: string | null;
}) {
  return [
    String(args.accountName || "").trim().toLowerCase(),
    String(Math.round(Number(args.amount || 0))),
    normalizeCashImportDateKey(args.occurredAt),
    normalizeCashImportText(args.memo),
  ].join("__");
}

function buildCashImportedMemo(args: {
  memo?: string | null;
  source?: string | null;
  fileName: string;
  revenueCategory?: string | null;
}) {
  const visibleMemo = stripCashSourceMarker(args.memo || "現金収入");
  const sourcePart = args.source ? ` / ${args.source}` : "";
  const categorizedMemo = buildCashRevenueCategoryMemo({
    memo: `${visibleMemo}${sourcePart}`,
    revenueCategory: args.revenueCategory,
    prefixCash: true,
  });
  return `${categorizedMemo} [file-import:${args.fileName}]`;
}

function createInitialCashImportProgress(fileName: string): CashFileImportProgress {
  return {
    open: true,
    status: "reading",
    title: "ファイルを読み込んでいます",
    message: "CSV / Excel ファイルの内容を確認しています。",
    fileName,
    totalRows: 0,
    processedRows: 0,
    importedRows: 0,
    duplicateRows: 0,
    blockedRows: 0,
    importedAmount: 0,
    categorySummary: [],
  };
}

function getCashImportProgressPercent(progress: CashFileImportProgress | null) {
  if (!progress) return 0;
  if (progress.status === "done") return 100;
  if (progress.totalRows <= 0) {
    return progress.status === "reading" ? 12 : progress.status === "validating" ? 24 : 0;
  }
  return Math.min(100, Math.round((progress.processedRows / progress.totalRows) * 100));
}

function waitForCashImportPaint() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0);
  });
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
  const [cashFileImportProgress, setCashFileImportProgress] =
    React.useState<CashFileImportProgress | null>(null);
  const [cashRevenueCategoryFilter, setCashRevenueCategoryFilter] =
    React.useState<CashRevenueCategoryFilter>("all");

  const filteredRows = React.useMemo(() => {
    if (cashRevenueCategoryFilter === "all") return rows;
    return rows.filter((row) => resolveCashRevenueCategoryCodeFromRow(row) === cashRevenueCategoryFilter);
  }, [rows, cashRevenueCategoryFilter]);

  const sortedRows = React.useMemo(() => {
    const next = [...filteredRows];
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
  }, [filteredRows, sortMode]);

  const totalRows = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = totalRows === 0 ? 0 : (safeCurrentPage - 1) * pageSize;
  const visibleRows = sortedRows.slice(pageStart, pageStart + pageSize);
  const pageStartRow = totalRows === 0 ? 0 : pageStart + 1;
  const pageEndRow = totalRows === 0 ? 0 : Math.min(pageStart + pageSize, totalRows);
  const pageWindow = buildPageWindow(safeCurrentPage, totalPages);

  const cashRevenueCategorySummary = React.useMemo(
    () => buildCashRevenueCategorySummary(rows).slice(0, 6),
    [rows]
  );
  const activeRevenueCategoryLabel =
    cashRevenueCategoryFilter === "all"
      ? "全区分"
      : getCashRevenueCategoryLabel(cashRevenueCategoryFilter);
  const filteredRevenueCategorySummary = React.useMemo(
    () => buildCashRevenueCategorySummary(filteredRows),
    [filteredRows]
  );

  const normalizedSidebarActions: CashActionItem[] = sidebarActions.map((item) => {
    if (
      item.label === "現金収入CSV/Excel取込" ||
      item.label === "現金収入CSV取込" ||
      item.label === "CSV/Excel取込" ||
      item.label === "CSV取込"
    ) {
      return {
        ...item,
        label: "現金収入CSV/Excel取込",
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

  const cashSidebarActionsWithTemplate: CashActionItem[] = normalizedSidebarActions.some(
    (item) => item.label === "現金収入テンプレート下载"
  )
    ? normalizedSidebarActions
    : normalizedSidebarActions.flatMap((item) =>
        item.label === "現金収入CSV/Excel取込"
          ? [
              {
                label: "現金収入テンプレート下载",
                href: undefined,
                disabled: false,
              },
              item,
            ]
          : [item]
      );

  const createDrawerOpen = action === "create";
  const editDrawerOpen = editingRow !== null;
  const cashDrawerOpen = createDrawerOpen || editDrawerOpen;
  const cashDrawerMode: "create" | "edit" = createDrawerOpen ? "create" : "edit";
  const cashDrawerRow = createDrawerOpen ? null : editingRow;

  function openEdit(row: IncomeRow) {
    onSelectRow(row.id);
    setEditAmount(String(row.amount || ""));
    setEditMemo(stripCashSourceMarker(row.memo) || "");
    setEditingRow(row);
  }

  function closeCashDrawer() {
    if (createDrawerOpen) {
      clearActionMode();
    }
    setEditingRow(null);
  }

  // Step109-Z1-H4B-EXACT2-CASH-TEMPLATE-DOWNLOAD:
  // Download a CSV template with fixed ledger_scope = cash-income.
  function handleCashIncomeTemplateDownload() {
    const config = getLedgerScopeConfig(LEDGER_SCOPES.CASH_INCOME);
    downloadCashTextFile({
      filename: config.templateFileName,
      text: buildLedgerTemplateCsv(LEDGER_SCOPES.CASH_INCOME),
    });
  }

  function handleCashTaxExport() {
    const csv = buildCashRevenueCategoryTaxCsv(filteredRows);
    const date = new Date();
    const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const suffix =
      cashRevenueCategoryFilter === "all" ? "all" : String(cashRevenueCategoryFilter).toLowerCase();
    downloadCashTextFile({
      filename: `cash-income-tax-export-${suffix}-${stamp}.csv`,
      text: csv,
    });
  }

  async function handleCashIncomeFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file || cashFileImportLoading) return;

    setCashFileImportLoading(true);
    setCashFileImportFeedback(null);
    setCashFileImportProgress(createInitialCashImportProgress(file.name));

    try {
      await waitForCashImportPaint();

      const lowerFileName = file.name.toLowerCase();
      const allowedExtension = CASH_INLINE_IMPORT_ALLOWED_EXTENSIONS.some((extension) =>
        lowerFileName.endsWith(extension)
      );

      if (!allowedExtension) {
        throw new Error("対応しているファイル形式は CSV / TSV / TXT / Excel（.xlsx, .xls）です。");
      }

      if (file.size > CASH_INLINE_IMPORT_MAX_FILE_SIZE_BYTES) {
        throw new Error(
          `ファイルサイズが大きすぎます。上限は ${formatCashImportFileSize(CASH_INLINE_IMPORT_MAX_FILE_SIZE_BYTES)} です。`
        );
      }

      const rawCsv = await readCashIncomeFileAsCsvText(file);
      const scopeValidation = validateLedgerCsvTextScope({
        currentScope: LEDGER_SCOPES.CASH_INCOME,
        csvText: rawCsv,
      });

      if (!scopeValidation.ok) {
        throw new Error(scopeValidation.messageJa);
      }

      // Step109-Z1-H5A-CASH-IMPORT-SCOPE-VALIDATION:
      // Preview/import is blocked unless ledger_scope = cash-income.
      const normalizedCsv = normalizeCashFileCsvHeaders(rawCsv);
      const draftRows = parseCashIncomeCsvDraft(normalizedCsv);

      if (draftRows.length > CASH_INLINE_IMPORT_MAX_ROWS) {
        throw new Error(
          `一度に取込できる行数は ${CASH_INLINE_IMPORT_MAX_ROWS.toLocaleString("ja-JP")} 行までです。ファイルを分割して再度取込してください。`
        );
      }

      const validRows = draftRows.filter((row) => row.status !== "error");
      const importRevenueCategorySummary = buildCashRevenueCategorySummary(validRows);

      setCashFileImportProgress((current) =>
        current
          ? {
              ...current,
              status: "validating",
              title: "取込データを検証しています",
              message: "金額・発生日・口座名を確認しています。",
              totalRows: draftRows.length,
              categorySummary: importRevenueCategorySummary,
            }
          : current
      );
      await waitForCashImportPaint();

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
      const transactionsRes = await listTransactions("INCOME");
      const existingKeys = new Set(
        (transactionsRes.items ?? []).map((item) =>
          buildCashImportDedupeKey({
            accountName: item.accountName || "",
            amount: item.amount,
            occurredAt: item.occurredAt,
            memo: item.memo || "",
          })
        )
      );
      const seenInFileKeys = new Set<string>();

      let importedRows = 0;
      let duplicateRows = 0;
      let blockedRows = draftRows.length - validRows.length;
      let importedAmount = 0;

      setCashFileImportProgress((current) =>
        current
          ? {
              ...current,
              status: "importing",
              title: "現金収入を登録しています",
              message: "重複を確認しながら現金収入明細を登録しています。",
              totalRows: draftRows.length,
              blockedRows,
              categorySummary: importRevenueCategorySummary,
            }
          : current
      );
      await waitForCashImportPaint();

      for (const [index, row] of validRows.entries()) {
        const resolvedAccountId = resolveCashAccountId({
          accountName: row.account,
          accounts: sourceAccounts,
        });
        const resolvedAccount = sourceAccounts.find((item) => item.id === resolvedAccountId);
        const occurredAt = new Date(row.occurredAt);
        const memoForTransaction = buildCashImportedMemo({
          memo: row.memo || "現金収入",
          source: row.source,
          fileName: file.name,
          revenueCategory: row.revenueCategory,
        });
        const dedupeKey = buildCashImportDedupeKey({
          accountName: resolvedAccount?.name || row.account,
          amount: row.amount,
          occurredAt: row.occurredAt,
          memo: memoForTransaction,
        });

        if (!resolvedAccountId || Number.isNaN(occurredAt.getTime())) {
          blockedRows += 1;
        } else if (existingKeys.has(dedupeKey) || seenInFileKeys.has(dedupeKey)) {
          duplicateRows += 1;
        } else {
          await createTransaction({
            accountId: resolvedAccountId,
            categoryId: null,
            type: "OTHER",
            direction: "INCOME",
            amount: Number(row.amount || 0),
            currency: "JPY",
            occurredAt: occurredAt.toISOString(),
            memo: memoForTransaction,
          });

          existingKeys.add(dedupeKey);
          seenInFileKeys.add(dedupeKey);
          importedRows += 1;
          importedAmount += Number(row.amount || 0);
        }

        setCashFileImportProgress((current) =>
          current
            ? {
                ...current,
                processedRows: Math.min(draftRows.length, index + 1),
                importedRows,
                duplicateRows,
                blockedRows,
                importedAmount,
                categorySummary: importRevenueCategorySummary,
              }
            : current
        );

        if (index % CASH_INLINE_IMPORT_YIELD_EVERY === 0 || index === validRows.length - 1) {
          await waitForCashImportPaint();
        }
      }

      await reloadRows();
      setCurrentPage(1);

      const success = importedRows > 0 || duplicateRows > 0;
      const title =
        importedRows > 0
          ? "現金収入ファイルの取込が完了しました"
          : duplicateRows > 0
            ? "すべて登録済みデータとして検出されました"
            : "取込できる行がありませんでした";
      const message =
        importedRows > 0
          ? "ファイルから現金収入を登録し、一覧を再取得しました。登録済みデータは現在の一覧とグラフに反映されています。"
          : duplicateRows > 0
            ? "既に登録済みの明細は重複作成せず、既存データとして扱いました。一覧は最新状態に再取得済みです。"
            : "口座名・金額・発生日を確認してください。";

      setCashFileImportProgress((current) =>
        current
          ? {
              ...current,
              status: success ? "done" : "error",
              title,
              message,
              processedRows: draftRows.length,
              importedRows,
              duplicateRows,
              blockedRows,
              importedAmount,
              categorySummary: importRevenueCategorySummary,
            }
          : current
      );

      setCashFileImportFeedback({
        kind: success ? "success" : "error",
        title,
        message,
        fileName: file.name,
        totalRows: draftRows.length,
        importedRows,
        duplicateRows,
        blockedRows,
        importedAmount,
        categorySummary: importRevenueCategorySummary,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setCashFileImportProgress((current) =>
        current
          ? {
              ...current,
              status: "error",
              title: "現金収入ファイルの取込に失敗しました",
              message,
            }
          : {
              ...createInitialCashImportProgress(file.name),
              status: "error",
              title: "現金収入ファイルの取込に失敗しました",
              message,
            }
      );
      setCashFileImportFeedback({
        kind: "error",
        title: "現金収入ファイルの取込に失敗しました",
        message,
        fileName: file.name,
      });
    } finally {
      setCashFileImportLoading(false);
    }
  }

  function handlePageActionClick(item: CashActionItem) {
    if (item.disabled) return;

    if (item.label === "現金収入テンプレート下载") {
      handleCashIncomeTemplateDownload();
      return;
    }

    if (item.label === "現金収入CSV/Excel取込") {
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
    setEditMemo(stripCashSourceMarker(selectedRow.memo) || "");
    setEditingRow(selectedRow);
    clearActionMode();
  }, [action, selectedRow, clearActionMode, setEditAmount, setEditMemo]);

  React.useEffect(() => {
    setCurrentPage(1);
    onSelectRow("");
  }, [cashRevenueCategoryFilter, setCurrentPage, onSelectRow]);

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

      {cashFileImportProgress?.open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cash-inline-import-title"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-[620px] rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div id="cash-inline-import-title" className="text-lg font-semibold text-slate-950">
                  {cashFileImportProgress.title}
                </div>
                <div className="mt-1 text-sm leading-6 text-slate-500">
                  {cashFileImportProgress.message}
                </div>
              </div>
              <div
                className={[
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  cashFileImportProgress.status === "done"
                    ? "bg-emerald-50 text-emerald-700"
                    : cashFileImportProgress.status === "error"
                      ? "bg-rose-50 text-rose-700"
                      : "bg-blue-50 text-blue-700",
                ].join(" ")}
              >
                {cashFileImportProgress.status === "reading"
                  ? "読取中"
                  : cashFileImportProgress.status === "validating"
                    ? "検証中"
                    : cashFileImportProgress.status === "importing"
                      ? "登録中"
                      : cashFileImportProgress.status === "done"
                        ? "完了"
                        : cashFileImportProgress.status === "error"
                          ? "エラー"
                          : "待機中"}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                File
              </div>
              <div className="mt-1 truncate text-sm font-semibold text-slate-900">
                {cashFileImportProgress.fileName}
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>取込進捗</span>
                <span>{getCashImportProgressPercent(cashFileImportProgress)}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={[
                    "h-full rounded-full transition-all duration-300",
                    cashFileImportProgress.status === "error"
                      ? "bg-rose-500"
                      : cashFileImportProgress.status === "done"
                        ? "bg-emerald-500"
                        : "bg-blue-600",
                  ].join(" ")}
                  style={{ width: `${getCashImportProgressPercent(cashFileImportProgress)}%` }}
                />
              </div>
            </div>

            {cashFileImportProgress.status === "done" ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <div className="font-semibold">一覧再取得済み</div>
                <div className="mt-1 text-xs leading-5">
                  取込結果は現金収入一覧・KPI・グラフに反映されています。重複データは新規作成していません。
                </div>
              </div>
            ) : null}

            {cashFileImportProgress.status === "error" ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                <div className="font-semibold">取込を完了できませんでした</div>
                <div className="mt-1 text-xs leading-5">
                  ファイル形式、口座名、金額、発生日の内容を確認してください。
                </div>
              </div>
            ) : null}

            <div className="mt-5 grid gap-3 md:grid-cols-5">
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                <div className="text-xs text-slate-500">対象行数</div>
                <div className="mt-1 text-lg font-semibold text-slate-950">
                  {cashFileImportProgress.totalRows}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                <div className="text-xs text-slate-500">新規登録</div>
                <div className="mt-1 text-lg font-semibold text-emerald-700">
                  {cashFileImportProgress.importedRows}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                <div className="text-xs text-slate-500">重複</div>
                <div className="mt-1 text-lg font-semibold text-amber-700">
                  {cashFileImportProgress.duplicateRows}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                <div className="text-xs text-slate-500">ブロック</div>
                <div className="mt-1 text-lg font-semibold text-rose-700">
                  {cashFileImportProgress.blockedRows}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                <div className="text-xs text-slate-500">登録金額</div>
                <div className="mt-1 text-lg font-semibold text-slate-950">
                  {formatIncomeJPY(cashFileImportProgress.importedAmount)}
                </div>
              </div>
            </div>

            {cashFileImportProgress.categorySummary.length > 0 ? (
              <div
                data-scope="cash-inline-import-category-summary"
                className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">収入区分別の取込内訳</div>
                    <div className="mt-1 text-xs text-slate-500">
                      CSV / Excel の収入区分を確認し、未指定の行はメモから自動推定しています。
                    </div>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    税務確認用
                  </span>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {cashFileImportProgress.categorySummary.slice(0, 6).map((item) => (
                    <div key={item.label} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-slate-900">{item.label}</span>
                        <span className="text-xs text-slate-500">{item.count}件</span>
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-600">
                        {formatIncomeJPY(item.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={
                  cashFileImportProgress.status === "reading" ||
                  cashFileImportProgress.status === "validating" ||
                  cashFileImportProgress.status === "importing"
                }
                onClick={() => setCashFileImportProgress(null)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      ) : null}

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

          <div className="mt-4 grid gap-3 rounded-2xl border border-emerald-100 bg-white/80 p-4 md:grid-cols-5">
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
          {cashSidebarActionsWithTemplate.map((item) =>
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
                      : item.label === "現金収入CSV/Excel取込"
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
                disabled={item.disabled || (item.label === "現金収入CSV/Excel取込" && cashFileImportLoading)}
                className={[
                  "inline-flex h-12 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition",
                  item.disabled
                    ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                {item.label}
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
                    <span className="font-semibold">ファイル:</span>{" "}
                    {cashFileImportFeedback.fileName || "-"}
                  </div>
                  <div>
                    <span className="font-semibold">対象行数:</span>{" "}
                    {cashFileImportFeedback.totalRows ?? 0}
                  </div>
                  <div>
                    <span className="font-semibold">新規登録:</span>{" "}
                    {cashFileImportFeedback.importedRows ?? 0}
                  </div>
                  <div>
                    <span className="font-semibold">重複:</span>{" "}
                    {cashFileImportFeedback.duplicateRows ?? 0}
                  </div>
                  <div>
                    <span className="font-semibold">ブロック:</span>{" "}
                    {cashFileImportFeedback.blockedRows ?? 0}
                  </div>
                  <div>
                    <span className="font-semibold">登録金額:</span>{" "}
                    {formatIncomeJPY(cashFileImportFeedback.importedAmount ?? 0)}
                  </div>
                </div>
                {cashFileImportFeedback.categorySummary?.length ? (
                  <div
                    data-scope="cash-import-feedback-category-summary"
                    className="mt-3 grid gap-2 text-xs md:grid-cols-3"
                  >
                    {cashFileImportFeedback.categorySummary.slice(0, 6).map((item) => (
                      <div key={item.label} className="rounded-xl border border-white/70 bg-white/80 px-3 py-2">
                        <div className="font-semibold text-slate-800">{item.label}</div>
                        <div className="mt-1 text-slate-600">
                          {item.count}件 / {formatIncomeJPY(item.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
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

        {cashRevenueCategorySummary.length > 0 ? (
          <div
            data-scope="cash-category-summary-panel-l4c cash-category-marker-cleanup-l4c-fix1"
            className="mt-4 rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">収入区分別サマリー</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">
                  現金収入を税務申告・税理士確認で使いやすい区分に整理しています。
                </div>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                表示中 {cashRevenueCategorySummary.length} 区分
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {cashRevenueCategorySummary.map((item) => {
                const active = cashRevenueCategoryFilter === item.code;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setCashRevenueCategoryFilter(active ? "all" : (item.code as CashRevenueCategoryFilter))}
                    className={[
                      "rounded-2xl border px-4 py-3 text-left shadow-sm transition",
                      active
                        ? "border-slate-900 bg-slate-900 text-white shadow-md"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className={["text-sm font-semibold", active ? "text-white" : "text-slate-900"].join(" ")}>
                        {item.label}
                      </div>
                      <div
                        className={[
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600",
                        ].join(" ")}
                      >
                        {item.count}件
                      </div>
                    </div>
                    <div className={["mt-2 text-lg font-semibold", active ? "text-white" : "text-slate-950"].join(" ")}>
                      {formatIncomeJPY(item.amount)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div
          data-scope="cash-category-filter-tax-export-l4d cash-tax-export-excel-bom-fix1 cash-tax-export-japanese-header-fix2-v3"
          className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">収入区分フィルター</div>
              <div className="mt-1 text-xs leading-5 text-slate-500">
                サマリーカードまたは下のボタンから絞り込みできます。税務用CSVは現在の絞り込み結果を出力します。
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                現在: {activeRevenueCategoryLabel}
              </span>
              <button
                type="button"
                onClick={handleCashTaxExport}
                disabled={filteredRows.length === 0}
                className="rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                税務用CSV出力
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCashRevenueCategoryFilter("all")}
              className={[
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                cashRevenueCategoryFilter === "all"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              全部
            </button>
            {cashRevenueCategorySummary.map((item) => {
              const active = cashRevenueCategoryFilter === item.code;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setCashRevenueCategoryFilter(item.code as CashRevenueCategoryFilter)}
                  className={[
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {item.label}
                  <span className={active ? "ml-1 text-white/80" : "ml-1 text-slate-400"}>
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-3">
            <div>
              表示件数: <span className="font-semibold text-slate-800">{filteredRows.length}</span> / {rows.length}
            </div>
            <div>
              表示金額:{" "}
              <span className="font-semibold text-slate-800">
                {formatIncomeJPY(filteredRows.reduce((sum, row) => sum + Number(row.amount || 0), 0))}
              </span>
            </div>
            <div>
              出力区分:{" "}
              <span className="font-semibold text-slate-800">
                {filteredRevenueCategorySummary.length} 区分
              </span>
            </div>
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
                <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.label || getCashRevenueCategoryLabel(selectedRow.revenueCategory || selectedRow.memo)}</div>
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
                    <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800">{row.label || getCashRevenueCategoryLabel(row.revenueCategory || row.memo)}</div>
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
                <div className="text-base font-medium text-slate-900">{cashRevenueCategoryFilter === "all" ? "現金収入データがまだ登録されていません" : "選択した収入区分の明細はありません"}</div>
                <div className="mt-2 text-sm text-slate-500">
                  「新規現金収入」または「現金収入CSV/Excel取込」からデータを追加すると、ここに明細が表示されます。
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
