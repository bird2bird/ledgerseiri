"use client";

import Link from "next/link";
import React, { useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  commitImportSkeleton,
  detectMonthConflicts,
  loadImportHistorySkeleton,
  previewImportSkeleton,
  type CommitImportResponse,
  type DetectMonthConflictsResponse,
  type ImportHistoryResponse,
  type MonthConflictPolicy,
  type PreviewImportResponse,
} from "@/core/imports";
import { buildImportCommitWorkspaceHref } from "@/core/income-store-orders/cross-workspace-query";
import {
  getExpenseImportLedgerScopeFromCategory,
  getExpenseImportScopeLabelJa,
  validateLedgerCsvTextScope,
  type LedgerScope,
} from "@/core/ledger/ledger-scopes";
import { CashIncomeImportWorkspace } from "./CashIncomeImportWorkspace";
import { ImportHistoryList } from "./ImportHistoryList";
import { ImportMonthConflictDialog } from "./ImportMonthConflictDialog";
import { ImportPreviewSummary } from "./ImportPreviewSummary";
import { ImportPreviewTable } from "./ImportPreviewTable";

// -----------------------------------------------------------------------------
// Shared import workspace helpers
// These helpers are used by the legacy Amazon import flow and should stay neutral.
// -----------------------------------------------------------------------------

function formatPolicyLabel(value: MonthConflictPolicy) {
  return value === "replace_existing_months"
    ? "删除后重新导入"
    : "跳过已存在月份";
}

function formatDateTime(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "-";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString("ja-JP");
}

function formatNumber(value?: number | null) {
  return Number(value || 0).toLocaleString("ja-JP");
}

function renderTagList(values?: string[]) {
  const list = Array.isArray(values) ? values.filter(Boolean) : [];
  if (!list.length) {
    return <span className="text-sm text-slate-500">-</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {list.map((item) => (
        <span
          key={item}
          className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Import module routing helpers
// ModuleMode controls whether this workspace renders the existing Amazon import
// flow or the cash-income dedicated import flow.
// -----------------------------------------------------------------------------

type ModuleMode = "store-orders" | "store-operation" | "cash-income";

function normalizeImportModuleHint(value?: string | null): ModuleMode {
  if (value === "store-operation") return "store-operation";
  if (value === "cash-income") return "cash-income";
  return "store-orders";
}


type ExpenseImportRouteInfo = {
  enabled: boolean;
  category: string;
  expectedScope: LedgerScope | "";
  label: string;
};

function buildExpenseImportRouteInfo(args: {
  moduleParam?: string | null;
  categoryParam?: string | null;
}): ExpenseImportRouteInfo {
  const enabled = String(args.moduleParam || "").trim().toLowerCase() === "expenses";
  const category = String(args.categoryParam || "").trim();
  const expectedScope = enabled
    ? getExpenseImportLedgerScopeFromCategory(category)
    : "";

  return {
    enabled,
    category,
    expectedScope,
    label: getExpenseImportScopeLabelJa(expectedScope),
  };
}

function getExpenseImportTemplateFileName(routeInfo: ExpenseImportRouteInfo) {
  if (!routeInfo.enabled) return "amazon-store-orders.csv";
  if (routeInfo.expectedScope) return `${routeInfo.expectedScope}-template.csv`;
  return "expense-template.csv";
}

function getExpenseImportTitle(routeInfo: ExpenseImportRouteInfo) {
  if (!routeInfo.enabled) return "幂等导入工作台";
  return `${routeInfo.label}CSV/Excel取込`;
}

function getExpenseImportDescription(routeInfo: ExpenseImportRouteInfo) {
  if (!routeInfo.enabled) {
    return "Step105-EC：文件上传 -> detect -> 月份冲突弹窗 -> preview -> history 刷新。当前仍与既有 Amazon CSV foundation 卡片并行，不替换旧入口。";
  }

  return "ページ専用テンプレートの ledger_scope を検証してから、支出 CSV/Excel の取込プレビューへ進みます。";
}

// Step109-Z1-H5B-FIX1-EXPENSE-IMPORT-UI-MODE:
// Expense import route is UI-isolated from Amazon store-orders import mode.
function assertExpenseImportLedgerScope(args: {
  routeInfo: ExpenseImportRouteInfo;
  csvText: string;
}) {
  if (!args.routeInfo.enabled) return;

  if (!args.routeInfo.expectedScope) {
    throw new Error(
      `支出インポート種別を判定できません。URL の category を確認してください。category=${args.routeInfo.category || "-"}`
    );
  }

  const result = validateLedgerCsvTextScope({
    currentScope: args.routeInfo.expectedScope,
    csvText: args.csvText,
  });

  if (!result.ok) {
    throw new Error(
      `${result.messageJa} 現在ページ: ${args.routeInfo.expectedScope} / 種別: ${args.routeInfo.label}`
    );
  }
}


type ExpenseLocalPreviewRow = {
  rowNo: number;
  occurredAt: string;
  amount: number;
  category: string;
  accountName: string;
  evidenceNo: string;
  memo: string;
  status: "ok" | "error";
  error: string;
};

function splitImportCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (ch === '"') {
      quoted = !quoted;
      continue;
    }

    if ((ch === "," || ch === "\t") && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }

    current += ch;
  }

  cells.push(current);
  return cells.map((cell) => String(cell || "").trim());
}

function normalizeExpenseImportHeader(value: string) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getExpenseCell(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = row[normalizeExpenseImportHeader(key)];
    if (String(value || "").trim()) return String(value || "").trim();
  }
  return "";
}

function parseExpenseImportAmount(value: string) {
  const normalized = String(value || "")
    .replace(/[￥¥,\s]/g, "")
    .replace(/^\((.*)\)$/, "-$1");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

function buildExpenseLocalPreviewRows(args: {
  routeInfo: ExpenseImportRouteInfo;
  csvText: string;
}) {
  assertExpenseImportLedgerScope({
    routeInfo: args.routeInfo,
    csvText: args.csvText,
  });

  const lines = String(args.csvText || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("支出CSVにデータ行がありません。テンプレートに1行以上入力してください。");
  }

  const headers = splitImportCsvLine(lines[0]).map(normalizeExpenseImportHeader);
  const rows: ExpenseLocalPreviewRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitImportCsvLine(lines[i]);
    const raw: Record<string, string> = {};

    headers.forEach((header, index) => {
      raw[header] = cells[index] ?? "";
    });

    const occurredAt = getExpenseCell(raw, [
      "occurred_at",
      "payment_date",
      "date",
      "発生日",
      "支払日",
    ]);
    const amount = parseExpenseImportAmount(getExpenseCell(raw, ["amount", "金額"]));
    const category = getExpenseCell(raw, [
      "expense_category",
      "payroll_category",
      "category",
      "費目",
      "支出区分",
    ]);
    const accountName = getExpenseCell(raw, [
      "account_name",
      "account",
      "口座",
      "支払口座",
    ]);
    const evidenceNo = getExpenseCell(raw, [
      "evidence_no",
      "invoice_no",
      "receipt_no",
      "証憑番号",
      "請求書番号",
    ]);
    const memo = getExpenseCell(raw, ["memo", "メモ", "摘要"]);
    const errors: string[] = [];

    if (!occurredAt) errors.push("日付未入力");
    if (!amount) errors.push("金額未入力");
    if (!category) errors.push("支出区分未入力");

    rows.push({
      rowNo: i + 1,
      occurredAt,
      amount,
      category,
      accountName,
      evidenceNo,
      memo,
      status: errors.length ? "error" : "ok",
      error: errors.join(" / "),
    });
  }

  return rows;
}


function summarizeExpensePreviewRows(rows: ExpenseLocalPreviewRow[]) {
  const okRows = rows.filter((row) => row.status === "ok");
  const errorRows = rows.filter((row) => row.status === "error");
  const totalAmount = okRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const evidenceMissing = rows.filter((row) => !row.evidenceNo).length;
  const accounts = Array.from(new Set(rows.map((row) => row.accountName).filter(Boolean)));

  return {
    totalRows: rows.length,
    okRows: okRows.length,
    errorRows: errorRows.length,
    totalAmount,
    evidenceMissing,
    accountCount: accounts.length,
  };
}

// Step109-Z1-H5C-EXPENSE-PREVIEW-UI-PRODUCTIZATION:
// Expense mode owns a local, productized CSV preview and no longer uses Amazon preview panels.

// Step109-Z1-H5B-FIX2B-EXPENSE-LOCAL-PREVIEW:
// Expense import route uses local preview skeleton and must not call Amazon month conflict API.

// -----------------------------------------------------------------------------
// Cash income import workspace delegation
// Runtime lives in CashIncomeImportWorkspace. This parent remains responsible for
// module routing and the Amazon/store-orders/store-operation import flow.
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Main workspace component
// -----------------------------------------------------------------------------

export function ImportWorkspaceShell(props: { moduleHint?: string | null }) {
  const { moduleHint } = props;
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const lang = params?.lang ?? "ja";
  const expenseImportRouteInfo = buildExpenseImportRouteInfo({
    moduleParam: searchParams?.get("module"),
    categoryParam: searchParams?.get("category"),
  });
  const initialModuleMode = normalizeImportModuleHint(moduleHint);
  const [moduleMode, setModuleMode] = useState<ModuleMode>(initialModuleMode);
  const [filename, setFilename] = useState(getExpenseImportTemplateFileName(expenseImportRouteInfo));
  const [csvText, setCsvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [detectResult, setDetectResult] =
    useState<DetectMonthConflictsResponse | null>(null);
  const [previewResult, setPreviewResult] =
    useState<PreviewImportResponse | null>(null);
  const [historyResult, setHistoryResult] =
    useState<ImportHistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [commitResult, setCommitResult] =
    useState<CommitImportResponse | null>(null);
  const [commitLoading, setCommitLoading] = useState(false);
  const [expensePreviewRows, setExpensePreviewRows] = useState<ExpenseLocalPreviewRow[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [policy, setPolicy] =
    useState<MonthConflictPolicy>("skip_existing_months");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentSourceType = expenseImportRouteInfo.enabled ? "expense-csv" : "amazon-csv";

  const moduleLabel = expenseImportRouteInfo.enabled
    ? expenseImportRouteInfo.label
    : moduleMode === "store-operation" ? "店舗運営費" : "店舗注文";

  const rowCount = Array.isArray(previewResult?.rows) ? previewResult!.rows.length : 0;

  const expensePreviewSummary = useMemo(
    () => summarizeExpensePreviewRows(expensePreviewRows),
    [expensePreviewRows]
  );

  const draftLineCount = useMemo(() => {
    if (!csvText.trim()) return 0;
    return csvText.split(/\r?\n/).filter((line) => line.trim().length > 0).length;
  }, [csvText]);

  const historyItems = Array.isArray(historyResult?.items) ? historyResult.items : [];
  const latestHistoryItem = historyItems[0] ?? null;

  const bridgeImportJobId = String(previewResult?.importJobId || "").trim();
  const bridgeMonths = Array.isArray(detectResult?.fileMonths)
    ? detectResult.fileMonths.filter(Boolean)
    : [];

  const previewOrdersHref = bridgeImportJobId
    ? buildImportCommitWorkspaceHref({
        lang,
        moduleMode: "store-orders",
        importJobId: bridgeImportJobId,
        months: bridgeMonths,
      })
    : `/${lang}/app/income/store-orders`;

  const previewOperationHref = bridgeImportJobId
    ? buildImportCommitWorkspaceHref({
        lang,
        moduleMode: "store-operation",
        importJobId: bridgeImportJobId,
        months: bridgeMonths,
      })
    : `/${lang}/app/expenses/store-operation`;

  const latestHistoryMonths = Array.isArray(latestHistoryItem?.fileMonthsJson)
    ? latestHistoryItem.fileMonthsJson.filter(Boolean)
    : [];

  const latestHistoryOrdersHref = latestHistoryItem
    ? buildImportCommitWorkspaceHref({
        lang,
        moduleMode: "store-orders",
        importJobId: latestHistoryItem.id,
        months: latestHistoryMonths,
      })
    : `/${lang}/app/income/store-orders`;

  const latestHistoryOperationHref = latestHistoryItem
    ? buildImportCommitWorkspaceHref({
        lang,
        moduleMode: "store-operation",
        importJobId: latestHistoryItem.id,
        months: latestHistoryMonths,
      })
    : `/${lang}/app/expenses/store-operation`;

  const canRun = useMemo(() => {
    return !!csvText.trim() && !!filename.trim();
  }, [csvText, filename]);

  async function loadHistory(moduleOverride?: ModuleMode) {
    setHistoryLoading(true);

    try {
      const res = await loadImportHistorySkeleton({
        module: moduleOverride || moduleMode,
      });
      setHistoryResult(res);
    } catch (err) {
      setHistoryResult(null);
      setError(err instanceof Error ? err.message : "history failed");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleFileChange(file: File | null) {
    if (!file) return;

    try {
      const text = await file.text();

      // Step109-Z1-H5B-EXPENSE-IMPORT-SCOPE-VALIDATION:
      // Shared expense import route must reject files whose ledger_scope belongs to another page.
      assertExpenseImportLedgerScope({
        routeInfo: expenseImportRouteInfo,
        csvText: text,
      });

      setFilename(file.name || (expenseImportRouteInfo.enabled ? "expense-template.csv" : "amazon-store-orders.csv"));
      setCsvText(text);
      setError("");
      setMessage(expenseImportRouteInfo.enabled ? `${expenseImportRouteInfo.label} テンプレートを読み取りました: ${file.name}` : `已读取文件: ${file.name}`);
      setDetectResult(null);
      setPreviewResult(null);
      setCommitResult(null);
      setExpensePreviewRows([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "file read failed");
    }
  }

  async function runDetect() {
    if (!canRun) return;

    try {
      assertExpenseImportLedgerScope({
        routeInfo: expenseImportRouteInfo,
        csvText,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "ledger_scope validation failed");
      setDetectResult(null);
      setPreviewResult(null);
      setCommitResult(null);
      return;
    }

    if (expenseImportRouteInfo.enabled) {
      try {
        const rows = buildExpenseLocalPreviewRows({
          routeInfo: expenseImportRouteInfo,
          csvText,
        });
        const errorRows = rows.filter((row) => row.status === "error").length;

        setExpensePreviewRows(rows);
        setDetectResult({
          fileMonths: [],
          existingMonths: [],
          conflictMonths: [],
          monthStats: [],
          hasConflict: false,
          // Step109-Z1-H5B-FIX2C-DETECT-RESULT-MONTHSTATS:
          // Local expense preview uses a minimal detect result only for UI readiness.
        } as DetectMonthConflictsResponse);
        setPreviewResult(null);
        setCommitResult(null);
        setError("");
        setMessage(
          `${expenseImportRouteInfo.label} の取込プレビューを生成しました。対象行: ${rows.length} / エラー行: ${errorRows}`
        );
      } catch (err) {
        setExpensePreviewRows([]);
        setDetectResult(null);
        setPreviewResult(null);
        setCommitResult(null);
        setError(err instanceof Error ? err.message : "expense preview failed");
      }
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setPreviewResult(null);

    try {
      const res = await detectMonthConflicts({
        filename,
        csvText,
        module: moduleMode,
        sourceType: currentSourceType,
      });

      setDetectResult(res);

      if (res.hasConflict) {
        setDialogOpen(true);
        setMessage(
          `检测到 ${res.conflictMonths.length} 个冲突月份，请先选择 skip / replace 策略。`
        );
      } else {
        setDialogOpen(false);
        setMessage(
          `未检测到月份冲突，可以继续预览导入。fileMonths: ${
            res.fileMonths.length ? res.fileMonths.join(", ") : "-"
          }`
        );
        await runPreview(policy, false);
      }
    } catch (err) {
      setDetectResult(null);
      setError(err instanceof Error ? err.message : "detect failed");
    } finally {
      setLoading(false);
    }
  }

  async function runPreview(
    policyOverride?: MonthConflictPolicy,
    keepDialogOpen = false
  ) {
    const nextPolicy = policyOverride || policy;

    try {
      assertExpenseImportLedgerScope({
        routeInfo: expenseImportRouteInfo,
        csvText,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "ledger_scope validation failed");
      setPreviewResult(null);
      return;
    }

    if (expenseImportRouteInfo.enabled) {
      try {
        const rows = buildExpenseLocalPreviewRows({
          routeInfo: expenseImportRouteInfo,
          csvText,
        });
        const errorRows = rows.filter((row) => row.status === "error").length;
        setExpensePreviewRows(rows);
        setPreviewResult(null);
        setCommitResult(null);
        setError("");
        setMessage(
          `${expenseImportRouteInfo.label} の取込プレビューを更新しました。対象行: ${rows.length} / エラー行: ${errorRows}`
        );
      } catch (err) {
        setExpensePreviewRows([]);
        setError(err instanceof Error ? err.message : "expense preview failed");
      }
      return;
    }

    setLoading(true);
    setError("");
    if (!keepDialogOpen) {
      setMessage("");
    }

    try {
      const res = await previewImportSkeleton({
        filename,
        csvText,
        module: moduleMode,
        sourceType: currentSourceType,
        monthConflictPolicy: nextPolicy,
      });

      setPreviewResult(res);
      setCommitResult(null);
      setDialogOpen(false);
      setMessage(
        `preview 已生成，策略：${formatPolicyLabel(nextPolicy)} / rows: ${
          Array.isArray(res.rows) ? res.rows.length : 0
        } / conflictMonths: ${
          Array.isArray(res.conflictMonths) ? res.conflictMonths.length : 0
        } / importJobId: ${res.importJobId || "-"}`
      );
      await loadHistory(moduleMode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "preview failed");
    } finally {
      setLoading(false);
    }
  }

  async function runCommit() {
    if (!previewResult?.importJobId) return;

    setCommitLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await commitImportSkeleton(previewResult.importJobId, {
        monthConflictPolicy: policy,
      });

      setCommitResult(res);
      setMessage(
        `正式导入完成: imported=${res.importedRows}, duplicate=${res.duplicateRows}, conflict=${res.conflictRows}, error=${res.errorRows}, deleted=${res.deletedRows} / policy=${formatPolicyLabel(policy)}`
      );
      await loadHistory(moduleMode);
    } catch (err) {
      setCommitResult(null);
      setError(err instanceof Error ? err.message : "commit failed");
    } finally {
      setCommitLoading(false);
    }
  }

  function buildPostCommitHref(args: {
    moduleMode: ModuleMode;
    importJobId: string;
    months: string[];
  }) {
    const params = new URLSearchParams();
    params.set("from", "import-commit");
    params.set("importJobId", args.importJobId);
    if (args.months.length > 0) {
      params.set("months", args.months.join(","));
    }
    params.set("module", args.moduleMode);

    const base =
      args.moduleMode === "store-operation"
        ? "/app/expenses/store-operation"
        : "/app/income/store-orders";

    return `${base}?${params.toString()}`;
  }

  React.useEffect(() => {
    if (moduleMode !== "cash-income") {
      void loadHistory(moduleMode);
    }
  }, [moduleMode]);

  // H6-F parent cleanup: cash runtime is isolated in CashIncomeImportWorkspace.
  if (moduleMode === "cash-income") {
    return <CashIncomeImportWorkspace lang={lang} />;
  }

  return (
    <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold text-slate-900">
            {getExpenseImportTitle(expenseImportRouteInfo)}
          </div>
          <div className="mt-2 text-sm text-slate-500">
            {getExpenseImportDescription(expenseImportRouteInfo)}
          </div>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
          module = {expenseImportRouteInfo.enabled ? `expenses:${expenseImportRouteInfo.category || "-"}` : moduleMode}
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {expenseImportRouteInfo.enabled ? (
            <>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Expense Validation Result
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      ledger_scope・必須項目・証憑番号を検証した結果です。
                    </div>
                  </div>
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                    {expenseImportRouteInfo.expectedScope || "unknown"}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[16px] bg-white p-3 ring-1 ring-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500">対象行数</div>
                    <div className="mt-1 text-xl font-bold text-slate-950">
                      {formatNumber(expensePreviewSummary.totalRows)}
                    </div>
                  </div>
                  <div className="rounded-[16px] bg-white p-3 ring-1 ring-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500">OK / エラー</div>
                    <div className="mt-1 text-xl font-bold text-slate-950">
                      {formatNumber(expensePreviewSummary.okRows)} / {formatNumber(expensePreviewSummary.errorRows)}
                    </div>
                  </div>
                  <div className="rounded-[16px] bg-white p-3 ring-1 ring-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500">合計金額</div>
                    <div className="mt-1 text-xl font-bold text-slate-950">
                      ¥{formatNumber(expensePreviewSummary.totalAmount)}
                    </div>
                  </div>
                  <div className="rounded-[16px] bg-white p-3 ring-1 ring-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500">証憑不足 / 口座数</div>
                    <div className="mt-1 text-xl font-bold text-slate-950">
                      {formatNumber(expensePreviewSummary.evidenceMissing)} / {formatNumber(expensePreviewSummary.accountCount)}
                    </div>
                  </div>
                </div>

                {expensePreviewSummary.errorRows > 0 ? (
                  <div className="mt-4 rounded-[16px] border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">
                    エラー行があります。正式登録前に日付・金額・支出区分・証憑番号を確認してください。
                  </div>
                ) : expensePreviewSummary.totalRows > 0 ? (
                  <div className="mt-4 rounded-[16px] border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
                    すべての preview 行が基本チェックを通過しています。正式登録は H5D で接続します。
                  </div>
                ) : (
                  <div className="mt-4 rounded-[16px] border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                    まだ支出 preview はありません。「開始導入検測」を押すと検証結果が表示されます。
                  </div>
                )}
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      支出 Preview Table
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      日付・金額・支出区分・支払先・口座・証憑番号・メモを確認します。
                    </div>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600">
                    rows: {expensePreviewRows.length}
                  </div>
                </div>

                {expensePreviewRows.length ? (
                  <div className="mt-4 max-h-[460px] overflow-auto rounded-[18px] border border-slate-200 bg-white">
                    <table className="min-w-[920px] divide-y divide-slate-100 text-sm">
                      <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-semibold text-slate-500">
                        <tr>
                          <th className="px-3 py-2 text-left">行</th>
                          <th className="px-3 py-2 text-left">日付</th>
                          <th className="px-3 py-2 text-right">金額</th>
                          <th className="px-3 py-2 text-left">区分</th>
                          <th className="px-3 py-2 text-left">支払先</th>
                          <th className="px-3 py-2 text-left">口座</th>
                          <th className="px-3 py-2 text-left">証憑</th>
                          <th className="px-3 py-2 text-left">メモ</th>
                          <th className="px-3 py-2 text-left">状態</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {expensePreviewRows.map((row) => (
                          <tr key={`${row.rowNo}-${row.memo}-${row.amount}`} className="bg-white hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-500">{row.rowNo}</td>
                            <td className="px-3 py-2 font-medium text-slate-900">{row.occurredAt || "-"}</td>
                            <td className="px-3 py-2 text-right font-bold text-slate-900">
                              ¥{formatNumber(row.amount)}
                            </td>
                            <td className="px-3 py-2 text-slate-700">{row.category || "-"}</td>
                            <td className="px-3 py-2 text-slate-700">{row.vendor || "-"}</td>
                            <td className="px-3 py-2 text-slate-700">{row.accountName || "-"}</td>
                            <td className="px-3 py-2 text-slate-700">{row.evidenceNo || "-"}</td>
                            <td className="px-3 py-2 text-slate-700">{row.memo || "-"}</td>
                            <td className="px-3 py-2">
                              {row.status === "ok" ? (
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                                  OK
                                </span>
                              ) : (
                                <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-rose-200">
                                  {row.error}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-10 text-sm text-slate-500">
                    まだ preview 行はありません。
                  </div>
                )}
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">正式登録</div>
                    <div className="mt-1 text-xs text-slate-500">
                      H5C では preview UI までを製品化します。DB への正式登録は H5D で接続します。
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled
                    className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white opacity-60"
                  >
                    支出正式登録は H5D で接続
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-medium text-slate-900">
                  Month Detection Result
                </div>

                {detectResult ? (
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div>
                      <span className="font-medium text-slate-900">文件月份：</span>
                      {detectResult.fileMonths.length
                        ? detectResult.fileMonths.join(", ")
                        : "-"}
                    </div>
                    <div>
                      <span className="font-medium text-slate-900">系统已有月份：</span>
                      {detectResult.existingMonths.length
                        ? detectResult.existingMonths.join(", ")
                        : "-"}
                    </div>
                    <div>
                      <span className="font-medium text-slate-900">冲突月份：</span>
                      {detectResult.conflictMonths.length
                        ? detectResult.conflictMonths.join(", ")
                        : "-"}
                    </div>
                    <div>
                      <span className="font-medium text-slate-900">hasConflict：</span>
                      {String(detectResult.hasConflict)}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
                    还没有 detect 结果。
                  </div>
                )}
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900">Latest History Snapshot</div>
                    <div className="mt-1 text-xs text-slate-500">
                      最近一条 import history 的快速入口
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {historyLoading ? "loading..." : `items: ${historyItems.length}`}
                  </div>
                </div>

                {latestHistoryItem ? (
                  <div className="mt-4 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[16px] bg-white p-3">
                        <div className="text-[11px] text-slate-500">Latest Filename</div>
                        <div className="mt-1 break-all text-sm font-medium text-slate-900">
                          {latestHistoryItem.filename || "-"}
                        </div>
                      </div>
                      <div className="rounded-[16px] bg-white p-3">
                        <div className="text-[11px] text-slate-500">Latest Status</div>
                        <div className="mt-1 text-sm font-medium text-slate-900">
                          {latestHistoryItem.status || "-"}
                        </div>
                      </div>
                      <div className="rounded-[16px] bg-white p-3">
                        <div className="text-[11px] text-slate-500">Imported At</div>
                        <div className="mt-1 text-sm font-medium text-slate-900">
                          {formatDateTime(latestHistoryItem.importedAt)}
                        </div>
                      </div>
                      <div className="rounded-[16px] bg-white p-3">
                        <div className="text-[11px] text-slate-500">File Months</div>
                        <div className="mt-2">
                          {renderTagList(latestHistoryMonths)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link
                        href={latestHistoryOrdersHref}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        打开最近一次 店舗注文 结果
                      </Link>
                      <Link
                        href={latestHistoryOperationHref}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        打开最近一次 店舗運営費 结果
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-white px-4 py-8 text-sm text-slate-500">
                    还没有可展示的 import history。
                  </div>
                )}
              </div>

              <ImportPreviewSummary
                preview={previewResult}
                policyLabel={formatPolicyLabel(policy)}
              />

              <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="text-sm font-medium text-slate-900">Preview Status</div>
                  <button
                    type="button"
                    onClick={() => void runCommit()}
                    disabled={!previewResult?.importJobId || commitLoading}
                    className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {commitLoading ? "正式导入中..." : "正式导入"}
                  </button>
                </div>

                <div className="mt-2 space-y-2 text-sm text-slate-700">
                  <div>
                    <span className="font-medium text-slate-900">Rows：</span>
                    {rowCount}
                  </div>
                  <div>
                    <span className="font-medium text-slate-900">Import Job：</span>
                    {previewResult?.importJobId || "-"}
                  </div>
                  <div>
                    <span className="font-medium text-slate-900">策略：</span>
                    {formatPolicyLabel(policy)}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

      <ImportMonthConflictDialog
        open={dialogOpen}
        monthStats={detectResult?.monthStats ?? []}
        selectedPolicy={policy}
        onSelectPolicy={setPolicy}
        onCancel={() => setDialogOpen(false)}
        onContinue={() => {
          void runPreview(policy);
        }}
        loading={loading}
      />
    </section>
  );
}
