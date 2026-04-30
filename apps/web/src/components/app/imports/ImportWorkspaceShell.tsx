"use client";

import Link from "next/link";
import React, { useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  commitExpenseImport,
  commitImportSkeleton,
  detectMonthConflicts,
  loadImportHistorySkeleton,
  previewImportSkeleton,
  type CommitImportResponse,
  type ExpenseImportCommitResponse,
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

function formatPolicyLabel(value: MonthConflictPolicy) {
  return value === "replace_existing_months"
    ? "删除后重新导入"
    : "跳过已存在月份";
}

function formatNumber(value?: number | null) {
  return Number(value || 0).toLocaleString("ja-JP");
}

function renderTagList(values?: string[]) {
  const list = Array.isArray(values) ? values.filter(Boolean) : [];
  if (!list.length) return <span className="text-sm text-slate-500">-</span>;

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
  const enabled =
    String(args.moduleParam || "").trim().toLowerCase() === "expenses";
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
    return "Step105-EC：文件上传 -> detect -> 月份冲突弹窗 -> preview -> history 刷新。";
  }

  return "ページ専用テンプレートの ledger_scope を検証してから、支出 CSV/Excel の取込プレビューへ進みます。";
}


function buildExpensePostCommitReturnHref(args: {
  lang: string;
  ledgerScope: string;
  importJobId?: string | null;
}) {
  const scope = String(args.ledgerScope || "").trim();
  const params = new URLSearchParams();
  params.set("from", "expense-import-commit");
  params.set("ledger_scope", scope);
  params.set("refresh", String(Date.now()));

  if (args.importJobId) {
    params.set("importJobId", args.importJobId);
  }

  if (scope === "payroll-expense") {
    params.set("category", "payroll");
    return `/${args.lang}/app/expenses?${params.toString()}`;
  }

  if (scope === "other-expense") {
    return `/${args.lang}/app/other-expense?${params.toString()}`;
  }

  if (scope === "store-operation-expense") {
    return `/${args.lang}/app/expenses/store-operation?${params.toString()}`;
  }

  params.set("category", "other");
  return `/${args.lang}/app/expenses?${params.toString()}`;
}

// Step109-Z1-H5E-EXPENSE-POST-COMMIT-RETURN:
// After expense CSV commit, return to the owning expense workspace with refresh hints.

function assertExpenseImportLedgerScope(args: {
  routeInfo: ExpenseImportRouteInfo;
  csvText: string;
}) {
  if (!args.routeInfo.enabled) return;

  if (!args.routeInfo.expectedScope) {
    throw new Error(
      `支出インポート種別を判定できません。URL の category を確認してください。category=${
        args.routeInfo.category || "-"
      }`
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
  currency: string;
  category: string;
  vendor: string;
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
    const currency = getExpenseCell(raw, ["currency", "通貨"]) || "JPY";
    const category = getExpenseCell(raw, [
      "expense_category",
      "payroll_category",
      "category",
      "費目",
      "支出区分",
    ]);
    const vendor = getExpenseCell(raw, [
      "vendor",
      "payee",
      "supplier",
      "支払先",
      "仕入先",
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
    if (!evidenceNo) errors.push("証憑番号未入力");

    rows.push({
      rowNo: i + 1,
      occurredAt,
      amount,
      currency,
      category,
      vendor,
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
  const totalAmount = okRows.reduce(
    (sum, row) => sum + Number(row.amount || 0),
    0
  );
  const evidenceMissing = rows.filter((row) => !row.evidenceNo).length;
  const accounts = Array.from(
    new Set(rows.map((row) => row.accountName).filter(Boolean))
  );

  return {
    totalRows: rows.length,
    okRows: okRows.length,
    errorRows: errorRows.length,
    totalAmount,
    evidenceMissing,
    accountCount: accounts.length,
  };
}

// Step109-Z1-H5I-EXPENSE-IMPORT-ERROR-MESSAGES:
// Productized error messages for scoped expense CSV/Excel imports.
function normalizeExpenseImportErrorMessage(args: {
  error: unknown;
  routeInfo: ExpenseImportRouteInfo;
  filename?: string;
}) {
  const raw =
    args.error instanceof Error
      ? args.error.message
      : String(args.error || "unknown error");

  if (!args.routeInfo.enabled) return raw;

  const label = args.routeInfo.label || "支出";
  const expectedScope = args.routeInfo.expectedScope || "-";
  const filename = args.filename || "選択ファイル";

  const message = String(raw || "").trim();
  const lower = message.toLowerCase();

  if (
    lower.includes("ledger_scope") ||
    lower.includes("現在ページ") ||
    lower.includes("ファイル内") ||
    lower.includes("current page")
  ) {
    return [
      `${label} 用テンプレートではない可能性があります。`,
      `現在ページの ledger_scope は「${expectedScope}」です。`,
      "各ページの「テンプレートダウンロード」から取得したCSVを使用してください。",
      `対象ファイル: ${filename}`,
      message,
    ].join("\n");
  }

  if (
    message.includes("データ行がありません") ||
    lower.includes("no data") ||
    lower.includes("empty")
  ) {
    return [
      "CSVに登録対象のデータ行がありません。",
      "1行目はヘッダー、2行目以降に支出データを入力してください。",
      `対象ファイル: ${filename}`,
      message,
    ].join("\n");
  }

  if (
    message.includes("日付未入力") ||
    message.includes("金額未入力") ||
    message.includes("支出区分未入力") ||
    message.includes("証憑番号未入力") ||
    message.includes("エラー行があるため")
  ) {
    return [
      `${label} のCSVに未入力または修正が必要な行があります。`,
      "プレビュー表の「状態」列を確認し、該当行を修正してください。",
      "必須項目: ledger_scope / 発生日 / 金額 / 支出区分 / 証憑番号",
      "推奨項目: 支払先 / 支払口座 / メモ",
      message,
    ].join("\n");
  }

  if (
    lower.includes("failed") ||
    lower.includes("500") ||
    lower.includes("network") ||
    lower.includes("fetch")
  ) {
    return [
      `${label} の正式登録中にエラーが発生しました。`,
      "CSV内容を確認しても解決しない場合は、同じファイルで再実行せず、画面を更新してから再度お試しください。",
      "重複登録を避けるため、正式登録結果が不明な場合は明細一覧を先に確認してください。",
      message,
    ].join("\n");
  }

  return [
    `${label} の取込で確認が必要です。`,
    "テンプレート、ledger_scope、必須項目、日付・金額の形式を確認してください。",
    message,
  ].join("\n");
}

function setExpenseImportProductError(args: {
  setError: (message: string) => void;
  error: unknown;
  routeInfo: ExpenseImportRouteInfo;
  filename?: string;
}) {
  args.setError(
    normalizeExpenseImportErrorMessage({
      error: args.error,
      routeInfo: args.routeInfo,
      filename: args.filename,
    })
  );
}

// Step109-Z1-H5C-FIX1-REWRITE-IMPORT-WORKSPACE-SHELL:
// Clean split between expense preview UI and legacy Amazon import flow.

export function ImportWorkspaceShell(props: { moduleHint?: string | null }) {
  const { moduleHint } = props;
  const params = useParams<{ lang: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = params?.lang ?? "ja";

  const expenseImportRouteInfo = buildExpenseImportRouteInfo({
    moduleParam: searchParams?.get("module"),
    categoryParam: searchParams?.get("category"),
  });

  const initialModuleMode = normalizeImportModuleHint(moduleHint);
  const [moduleMode, setModuleMode] = useState<ModuleMode>(initialModuleMode);
  const [filename, setFilename] = useState(
    getExpenseImportTemplateFileName(expenseImportRouteInfo)
  );
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
  const [expenseCommitResult, setExpenseCommitResult] =
    useState<ExpenseImportCommitResponse | null>(null);
  const [expensePostCommitHref, setExpensePostCommitHref] = useState("");
  const [commitLoading, setCommitLoading] = useState(false);
  const [expensePreviewRows, setExpensePreviewRows] = useState<
    ExpenseLocalPreviewRow[]
  >([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [policy, setPolicy] =
    useState<MonthConflictPolicy>("skip_existing_months");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentSourceType = expenseImportRouteInfo.enabled
    ? "expense-csv"
    : "amazon-csv";

  const moduleLabel = expenseImportRouteInfo.enabled
    ? expenseImportRouteInfo.label
    : moduleMode === "store-operation"
      ? "店舗運営費"
      : "店舗注文";

  const rowCount = Array.isArray(previewResult?.rows)
    ? previewResult!.rows.length
    : 0;

  const expensePreviewSummary = useMemo(
    () => summarizeExpensePreviewRows(expensePreviewRows),
    [expensePreviewRows]
  );

  const draftLineCount = useMemo(() => {
    if (!csvText.trim()) return 0;
    return csvText.split(/\r?\n/).filter((line) => line.trim().length > 0).length;
  }, [csvText]);

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

  const canRun = useMemo(() => {
    return !!csvText.trim() && !!filename.trim();
  }, [csvText, filename]);

  async function loadHistory(moduleOverride?: ModuleMode) {
    if (expenseImportRouteInfo.enabled) return;

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

      assertExpenseImportLedgerScope({
        routeInfo: expenseImportRouteInfo,
        csvText: text,
      });

      setFilename(
        file.name ||
          (expenseImportRouteInfo.enabled
            ? "expense-template.csv"
            : "amazon-store-orders.csv")
      );
      setCsvText(text);
      setError("");
      setMessage(
        expenseImportRouteInfo.enabled
          ? `${expenseImportRouteInfo.label} テンプレートを読み取りました: ${file.name}`
          : `已读取文件: ${file.name}`
      );
      setDetectResult(null);
      setPreviewResult(null);
      setCommitResult(null);
      setExpenseCommitResult(null);
      setExpensePostCommitHref("");
      setExpensePreviewRows([]);
    } catch (err) {
      setExpenseImportProductError({
        setError,
        error: err instanceof Error ? err : new Error("file read failed"),
        routeInfo: expenseImportRouteInfo,
        filename: file.name,
      });
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
      setExpenseImportProductError({
        setError,
        error: err instanceof Error ? err : new Error("ledger_scope validation failed"),
        routeInfo: expenseImportRouteInfo,
        filename,
      });
      setDetectResult(null);
      setPreviewResult(null);
      setCommitResult(null);
      setExpensePreviewRows([]);
      return;
    }

    if (expenseImportRouteInfo.enabled) {
      try {
        const rows = buildExpenseLocalPreviewRows({
          routeInfo: expenseImportRouteInfo,
          csvText,
        });
        const summary = summarizeExpensePreviewRows(rows);

        setExpensePreviewRows(rows);
        setDetectResult({
          fileMonths: [],
          existingMonths: [],
          conflictMonths: [],
          monthStats: [],
          hasConflict: false,
        } as DetectMonthConflictsResponse);
        setPreviewResult(null);
        setCommitResult(null);
        setError("");
        setMessage(
          `${expenseImportRouteInfo.label} の取込プレビューを生成しました。対象行: ${summary.totalRows} / OK: ${summary.okRows} / エラー: ${summary.errorRows}`
        );
      } catch (err) {
        setExpensePreviewRows([]);
        setDetectResult(null);
        setPreviewResult(null);
        setCommitResult(null);
        setExpenseImportProductError({
          setError,
          error: err instanceof Error ? err : new Error("expense preview failed"),
          routeInfo: expenseImportRouteInfo,
          filename,
        });
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
      setExpenseImportProductError({
        setError,
        error: err instanceof Error ? err : new Error("ledger_scope validation failed"),
        routeInfo: expenseImportRouteInfo,
        filename,
      });
      setPreviewResult(null);
      return;
    }

    if (expenseImportRouteInfo.enabled) {
      try {
        const rows = buildExpenseLocalPreviewRows({
          routeInfo: expenseImportRouteInfo,
          csvText,
        });
        const summary = summarizeExpensePreviewRows(rows);

        setExpensePreviewRows(rows);
        setPreviewResult(null);
        setCommitResult(null);
        setError("");
        setMessage(
          `${expenseImportRouteInfo.label} の取込プレビューを更新しました。対象行: ${summary.totalRows} / OK: ${summary.okRows} / エラー: ${summary.errorRows}`
        );
      } catch (err) {
        setExpensePreviewRows([]);
        setExpenseImportProductError({
          setError,
          error: err instanceof Error ? err : new Error("expense preview failed"),
          routeInfo: expenseImportRouteInfo,
          filename,
        });
      }
      return;
    }

    setLoading(true);
    setError("");
    if (!keepDialogOpen) setMessage("");

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
    if (!previewResult?.importJobId || expenseImportRouteInfo.enabled) return;

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

  // Step109-Z1-H5D-EXPENSE-COMMIT-FRONTEND:
  // Commit expense preview rows into Transaction via /api/imports/expense/commit.
  async function runExpenseCommit() {
    if (!expenseImportRouteInfo.enabled) return;
    if (!expensePreviewRows.length) return;
    if (expensePreviewSummary.errorRows > 0) {
      setExpenseImportProductError({
        setError,
        error: new Error("エラー行があるため正式登録できません。CSV内容を修正してください。"),
        routeInfo: expenseImportRouteInfo,
        filename,
      });
      return;
    }

    const ledgerScope = String(expenseImportRouteInfo.expectedScope || "").trim();
    if (!ledgerScope) {
      setExpenseImportProductError({
        setError,
        error: new Error("ledger_scope が判定できないため正式登録できません。"),
        routeInfo: expenseImportRouteInfo,
        filename,
      });
      return;
    }

    setCommitLoading(true);
    setError("");
    setMessage("");
    setExpenseCommitResult(null);
      setExpensePostCommitHref("");

    try {
      const res = await commitExpenseImport({
        filename,
        ledgerScope,
        category: expenseImportRouteInfo.category,
        rows: expensePreviewRows.map((row) => ({
          rowNo: row.rowNo,
          occurredAt: row.occurredAt,
          amount: row.amount,
          currency: row.currency,
          category: row.category,
          vendor: row.vendor,
          accountName: row.accountName,
          evidenceNo: row.evidenceNo,
          memo: row.memo,
          status: row.status,
          error: row.error,
        })),
      });

      const returnHref = buildExpensePostCommitReturnHref({
        lang,
        ledgerScope,
        importJobId: res.importJobId,
      });

      setExpenseCommitResult(res);
      setExpensePostCommitHref(returnHref);
      setMessage(
        `${expenseImportRouteInfo.label} の正式登録が完了しました。登録: ${res.importedRows} / 重複: ${res.duplicateRows} / エラー: ${res.errorRows} / 金額: ¥${formatNumber(res.totalImportedAmount)}。対象ページへ戻って再読込します。`
      );

      window.setTimeout(() => {
        router.push(returnHref);
      }, 1200);
    } catch (err) {
      setExpenseCommitResult(null);
      setExpensePostCommitHref("");
      setExpenseImportProductError({
        setError,
        error: err instanceof Error ? err : new Error("expense commit failed"),
        routeInfo: expenseImportRouteInfo,
        filename,
      });
    } finally {
      setCommitLoading(false);
    }
  }

  React.useEffect(() => {
    if (!expenseImportRouteInfo.enabled && moduleMode !== "cash-income") {
      void loadHistory(moduleMode);
    }
  }, [moduleMode, expenseImportRouteInfo.enabled]);

  if (!expenseImportRouteInfo.enabled && moduleMode === "cash-income") {
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
          module ={" "}
          {expenseImportRouteInfo.enabled
            ? `expenses:${expenseImportRouteInfo.category || "-"}`
            : moduleMode}
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-medium text-slate-900">Import Source</div>
              {expenseImportRouteInfo.enabled ? (
                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                  ledger_scope = {expenseImportRouteInfo.expectedScope || "unknown"}
                </div>
              ) : null}
            </div>

            {expenseImportRouteInfo.enabled ? (
              <div className="mt-4 rounded-[18px] border border-emerald-200 bg-emerald-50 p-4">
                <div className="text-sm font-bold text-emerald-800">
                  {expenseImportRouteInfo.label} 専用インポート
                </div>
                <div className="mt-1 text-xs leading-5 text-emerald-700">
                  このページでは{" "}
                  <span className="font-bold">
                    {expenseImportRouteInfo.expectedScope || "unknown"}
                  </span>{" "}
                  の ledger_scope を持つテンプレートだけを受け付けます。
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setModuleMode("store-orders")}
                  className={
                    moduleMode === "store-orders"
                      ? "rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                      : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  }
                >
                  店舗注文
                </button>

                <button
                  type="button"
                  onClick={() => setModuleMode("store-operation")}
                  className={
                    moduleMode === "store-operation"
                      ? "rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                      : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  }
                >
                  店舗運営費
                </button>
              </div>
            )}

            <div className="mt-4 grid gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv,text/csv,text/plain"
                onChange={(e) => {
                  void handleFileChange(e.target.files?.[0] ?? null);
                }}
                className="hidden"
              />

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  选择文件
                </button>

                <div className="text-sm text-slate-500">
                  {filename
                    ? `当前文件: ${filename}`
                    : expenseImportRouteInfo.enabled
                      ? "支出テンプレートを選択してください"
                      : "尚未选择文件"}
                </div>
              </div>

              <input
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="h-11 w-full rounded-[14px] border border-black/8 bg-white px-3 text-sm"
                placeholder={
                  expenseImportRouteInfo.enabled
                    ? getExpenseImportTemplateFileName(expenseImportRouteInfo)
                    : "filename.csv"
                }
              />

              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={10}
                className="w-full rounded-[14px] border border-black/8 bg-white px-3 py-3 text-sm"
                placeholder={
                  expenseImportRouteInfo.enabled
                    ? "支出テンプレート CSV テキストを貼り付けることもできます。ledger_scope は現在ページと一致している必要があります。"
                    : "可直接粘贴 CSV 文本，或通过上方文件选择读取。"
                }
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void runDetect()}
                  disabled={loading || !canRun}
                  className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading ? "处理中..." : "开始导入检测"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCsvText("");
                    setDetectResult(null);
                    setPreviewResult(null);
                    setCommitResult(null);
                    setExpenseCommitResult(null);
      setExpensePostCommitHref("");
                    setExpensePreviewRows([]);
                    setError("");
                    setMessage("已清空当前导入草稿。");
                  }}
                  className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  清空
                </button>
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-[22px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}

          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-slate-900">
                  Current Draft Summary
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  現在の取込草稿・ファイル・preview 状態を確認します。
                </div>
              </div>
              <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600">
                ready = {canRun ? "YES" : "NO"}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[16px] bg-white p-3">
                <div className="text-[11px] text-slate-500">Filename</div>
                <div className="mt-1 break-all text-sm font-medium text-slate-900">
                  {filename || "-"}
                </div>
              </div>
              <div className="rounded-[16px] bg-white p-3">
                <div className="text-[11px] text-slate-500">Draft Lines</div>
                <div className="mt-1 text-base font-semibold text-slate-900">
                  {formatNumber(draftLineCount)}
                </div>
              </div>
              <div className="rounded-[16px] bg-white p-3">
                <div className="text-[11px] text-slate-500">Detect Months</div>
                <div className="mt-2">{renderTagList(detectResult?.fileMonths)}</div>
              </div>
              <div className="rounded-[16px] bg-white p-3">
                <div className="text-[11px] text-slate-500">Conflict Months</div>
                <div className="mt-2">
                  {renderTagList(detectResult?.conflictMonths)}
                </div>
              </div>
            </div>
          </div>
        </div>

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
                      {formatNumber(expensePreviewSummary.okRows)} /{" "}
                      {formatNumber(expensePreviewSummary.errorRows)}
                    </div>
                  </div>
                  <div className="rounded-[16px] bg-white p-3 ring-1 ring-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500">合計金額</div>
                    <div className="mt-1 text-xl font-bold text-slate-950">
                      ¥{formatNumber(expensePreviewSummary.totalAmount)}
                    </div>
                  </div>
                  <div className="rounded-[16px] bg-white p-3 ring-1 ring-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500">
                      証憑不足 / 口座数
                    </div>
                    <div className="mt-1 text-xl font-bold text-slate-950">
                      {formatNumber(expensePreviewSummary.evidenceMissing)} /{" "}
                      {formatNumber(expensePreviewSummary.accountCount)}
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
                          <tr
                            key={`${row.rowNo}-${row.memo}-${row.amount}`}
                            className="bg-white hover:bg-slate-50"
                          >
                            <td className="px-3 py-2 text-slate-500">{row.rowNo}</td>
                            <td className="px-3 py-2 font-medium text-slate-900">
                              {row.occurredAt || "-"}
                            </td>
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
                    onClick={() => void runExpenseCommit()}
                    disabled={
                      commitLoading ||
                      !expensePreviewRows.length ||
                      expensePreviewSummary.errorRows > 0
                    }
                    className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {commitLoading ? "支出正式登録中..." : "支出を正式登録"}
                  </button>
                </div>

                {expenseCommitResult ? (
                  <div className="mt-4 rounded-[16px] border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
                    登録完了：imported={expenseCommitResult.importedRows} /
                    duplicate={expenseCommitResult.duplicateRows} /
                    error={expenseCommitResult.errorRows} /
                    importJobId={expenseCommitResult.importJobId}
                  
                    {expensePostCommitHref ? (
                      <Link
                        href={expensePostCommitHref}
                        className="mt-2 inline-flex rounded-xl border border-emerald-200 bg-white px-3 py-2 text-[11px] font-bold text-emerald-800 transition hover:bg-emerald-50"
                      >
                        対象ページへ戻って確認
                      </Link>
                    ) : null}</div>
                ) : null}
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
                  {commitResult ? (
                    <div>
                      <span className="font-medium text-slate-900">Commit：</span>
                      imported={commitResult.importedRows}, duplicate=
                      {commitResult.duplicateRows}, error={commitResult.errorRows}
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 rounded-[16px] border border-slate-200 bg-white p-4">
                  <div className="text-[11px] text-slate-500">Workspace Bridge</div>
                  <div className="mt-3 flex flex-col gap-2">
                    <Link
                      href={previewOrdersHref}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      打开当前 preview 的 店舗注文 结果
                    </Link>
                    <Link
                      href={previewOperationHref}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      打开当前 preview 的 店舗運営費 结果
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {!expenseImportRouteInfo.enabled ? (
        <div className="mt-6 space-y-4">
          <ImportPreviewTable preview={previewResult} />
          <ImportHistoryList
            history={historyResult}
            loading={historyLoading}
            moduleLabel={moduleLabel}
          />
        </div>
      ) : null}

      {!expenseImportRouteInfo.enabled ? (
        <ImportMonthConflictDialog
          open={dialogOpen}
          monthStats={detectResult?.monthStats || []}
          selectedPolicy={policy}
          onSelectPolicy={setPolicy}
          onCancel={() => setDialogOpen(false)}
          onContinue={() => void runPreview(policy, false)}
          loading={loading}
        />
      ) : null}
    </section>
  );
}
