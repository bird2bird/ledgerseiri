"use client";

import Link from "next/link";
import React, { useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  commitImportSkeleton,
  detectMonthConflicts,
  loadImportHistorySkeleton,
  previewCashIncomeImport,
  previewImportSkeleton,
  type CashIncomePreviewResponse,
  type CommitImportResponse,
  type DetectMonthConflictsResponse,
  type ImportHistoryResponse,
  type MonthConflictPolicy,
  type PreviewImportResponse,
} from "@/core/imports";
import { buildImportCommitWorkspaceHref } from "@/core/income-store-orders/cross-workspace-query";
import { fetchWithAutoRefresh } from "@/core/auth/client-auth-fetch";
import { ImportHistoryList } from "./ImportHistoryList";
import { ImportMonthConflictDialog } from "./ImportMonthConflictDialog";
import { ImportPreviewSummary } from "./ImportPreviewSummary";
import { ImportPreviewTable } from "./ImportPreviewTable";

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

type ModuleMode = "store-orders" | "store-operation" | "cash-income";

const CASH_INCOME_SAMPLE_TEXT = [
  "account,amount,occurredAt,memo,source",
  "現金,12000,2026-04-24,店頭現金売上,横浜店",
  "現金,8500,2026-04-25,イベント現金売上,展示会",
  "現金,3000,2026-04-26,現金補正入金,手動調整",
].join("\n");

const CASH_INCOME_ERROR_SAMPLE_TEXT = [
  "account,amount,occurredAt,memo,source",
  ",12000,2026-04-24,店頭現金売上,横浜店",
  "現金,-1,2026-04-25,イベント現金売上,展示会",
  "現金,3000,abc,,手動調整",
].join("\n");

function formatCashDraftMessage(message: string) {
  if (message === "account is required") return "口座名が未入力です";
  if (message === "amount must be greater than 0") {
    return "金額は 0 より大きい数値を入力してください";
  }
  if (message === "occurredAt is required") return "発生日が未入力です";
  if (message === "occurredAt is not parseable") {
    return "発生日を日付形式で入力してください";
  }
  if (message === "memo is recommended") return "メモの入力を推奨します";
  if (message === "memo is too long") return "メモは 240 文字以内で入力してください";
  return message;
}

function formatCashDraftStatusLabel(status: CashIncomeDraftRow["status"]) {
  if (status === "valid") return "OK";
  if (status === "warning") return "確認";
  return "エラー";
}

function formatCashAccountMatchMode(value?: string | null) {
  if (value === "exact_name") return "完全一致";
  if (value === "cash_fallback") return "現金口座 fallback";
  return "未解決";
}

function normalizeImportModuleHint(value?: string | null): ModuleMode {
  if (value === "store-operation") return "store-operation";
  if (value === "cash-income") return "cash-income";
  return "store-orders";
}

type CashIncomeDraftRow = {
  rowNo: number;
  account: string;
  amount: number;
  occurredAt: string;
  memo: string;
  source: string;
  status: "valid" | "warning" | "error";
  messages: string[];
};

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === "\"" && next === "\"") {
      current += "\"";
      i += 1;
      continue;
    }

    if (ch === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  cells.push(current.trim());
  return cells;
}

function parseCashIncomeCsvDraft(csvText: string): CashIncomeDraftRow[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const header = splitCsvLine(lines[0]).map((x) => x.trim());
  const hasHeader =
    header.includes("account") ||
    header.includes("amount") ||
    header.includes("occurredAt") ||
    header.includes("memo");

  const dataLines = hasHeader ? lines.slice(1) : lines;

  const columnIndex = {
    account: hasHeader ? header.indexOf("account") : 0,
    amount: hasHeader ? header.indexOf("amount") : 1,
    occurredAt: hasHeader ? header.indexOf("occurredAt") : 2,
    memo: hasHeader ? header.indexOf("memo") : 3,
    source: hasHeader ? header.indexOf("source") : 4,
  };

  return dataLines.map((line, index) => {
    const cells = splitCsvLine(line);
    const rowNo = hasHeader ? index + 2 : index + 1;
    const account = String(cells[columnIndex.account] || "").trim();
    const amountRaw = String(cells[columnIndex.amount] || "").replace(/[¥,\s]/g, "");
    const amount = Number(amountRaw || 0);
    const occurredAt = String(cells[columnIndex.occurredAt] || "").trim();
    const memo = String(cells[columnIndex.memo] || "").trim();
    const source =
      columnIndex.source >= 0 ? String(cells[columnIndex.source] || "").trim() : "";

    const messages: string[] = [];

    if (!account) messages.push("account is required");

    if (!Number.isFinite(amount) || amount <= 0) {
      messages.push("amount must be greater than 0");
    }

    if (!occurredAt) {
      messages.push("occurredAt is required");
    } else if (Number.isNaN(new Date(occurredAt).getTime())) {
      messages.push("occurredAt is not parseable");
    }

    if (!memo) {
      messages.push("memo is recommended");
    } else if (memo.length > 240) {
      messages.push("memo is too long");
    }

    const hasError = messages.some((msg) =>
      msg.includes("required") ||
      msg.includes("greater than 0") ||
      msg.includes("not parseable")
    );

    return {
      rowNo,
      account,
      amount,
      occurredAt,
      memo,
      source,
      status: hasError ? "error" : messages.length > 0 ? "warning" : "valid",
      messages,
    };
  });
}

export function ImportWorkspaceShell(props: { moduleHint?: string | null }) {
  const { moduleHint } = props;
  const params = useParams<{ lang: string }>();
  const lang = params?.lang ?? "ja";
  const router = useRouter();

  const initialModuleMode = normalizeImportModuleHint(moduleHint);
  const [moduleMode, setModuleMode] = useState<ModuleMode>(initialModuleMode);
  const [filename, setFilename] = useState(
    initialModuleMode === "cash-income" ? "cash-income.csv" : "amazon-store-orders.csv"
  );
  const [csvText, setCsvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [cashCsvDraftText, setCashCsvDraftText] = useState(CASH_INCOME_SAMPLE_TEXT);
  const [cashPreviewRows, setCashPreviewRows] = useState<CashIncomeDraftRow[]>([]);
  const [cashPreviewMessage, setCashPreviewMessage] = useState("");
  const [cashServerPreview, setCashServerPreview] =
    useState<CashIncomePreviewResponse | null>(null);
  const [cashServerPreviewLoading, setCashServerPreviewLoading] = useState(false);
  const [cashServerPreviewError, setCashServerPreviewError] = useState("");
  const [cashCompanyId, setCashCompanyId] = useState("");
  const [cashCompanyLoading, setCashCompanyLoading] = useState(false);
  const [cashCompanyError, setCashCompanyError] = useState("");

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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [policy, setPolicy] =
    useState<MonthConflictPolicy>("skip_existing_months");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentSourceType = "amazon-csv";

  const moduleLabel =
    moduleMode === "cash-income"
      ? "現金収入"
      : moduleMode === "store-operation"
        ? "店舗運営費"
        : "店舗注文";

  const rowCount = Array.isArray(previewResult?.rows) ? previewResult!.rows.length : 0;

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

  const cashPreviewStats = useMemo(() => {
    const total = cashPreviewRows.length;
    const valid = cashPreviewRows.filter((row) => row.status === "valid").length;
    const warning = cashPreviewRows.filter((row) => row.status === "warning").length;
    const error = cashPreviewRows.filter((row) => row.status === "error").length;

    return { total, valid, warning, error };
  }, [cashPreviewRows]);

  const cashPendingRows = useMemo(() => {
    return cashPreviewRows
      .filter((row) => row.status !== "error")
      .map((row) => ({
        rowNo: row.rowNo,
        type: "OTHER" as const,
        direction: "INCOME" as const,
        accountName: row.account,
        amount: row.amount,
        occurredAt: row.occurredAt,
        memo: `[cash] ${row.memo}`.trim(),
        source: row.source,
      }));
  }, [cashPreviewRows]);

  const cashPendingStats = useMemo(() => {
    const pendingRows = cashPendingRows.length;
    const excludedErrorRows = cashPreviewRows.filter((row) => row.status === "error").length;
    const totalPendingAmount = cashPendingRows.reduce((sum, row) => sum + row.amount, 0);

    return {
      pendingRows,
      excludedErrorRows,
      totalPendingAmount,
    };
  }, [cashPendingRows, cashPreviewRows]);

  const cashServerAccountResolutionStats = useMemo(() => {
    const rows = Array.isArray(cashServerPreview?.rows) ? cashServerPreview.rows : [];
    const exactMatched = rows.filter(
      (row) => row.accountResolution?.matchMode === "exact_name"
    ).length;
    const cashFallbackMatched = rows.filter(
      (row) => row.accountResolution?.matchMode === "cash_fallback"
    ).length;
    const unresolved = rows.filter(
      (row) =>
        !row.normalizedPayload.accountId ||
        row.accountResolution?.matchMode === "unresolved"
    ).length;

    return {
      exactMatched,
      cashFallbackMatched,
      unresolved,
    };
  }, [cashServerPreview]);

  function runCashClientPreview() {
    const rows = parseCashIncomeCsvDraft(cashCsvDraftText);
    setCashPreviewRows(rows);
    setCashServerPreview(null);
    setCashServerPreviewError("");

    if (rows.length === 0) {
      setCashPreviewMessage("CSV draft が空です。");
      return;
    }

    const errorCount = rows.filter((row) => row.status === "error").length;
    const warningCount = rows.filter((row) => row.status === "warning").length;

    setCashPreviewMessage(
      `プレビューを生成しました：rows=${rows.length}, error=${errorCount}, warning=${warningCount}。この preview はブラウザ上のみで実行され、DB/API には接続していません。`
    );
  }

  async function loadCashCompanyId() {
    setCashCompanyLoading(true);
    setCashCompanyError("");

    try {
      const res = await fetchWithAutoRefresh("/api/auth/me", {
        method: "GET",
      });

      if (!res.ok) {
        throw new Error(`auth me failed: ${res.status}`);
      }

      const payload = (await res.json()) as { companyId?: string | null };
      const nextCompanyId = String(payload?.companyId || "").trim();

      setCashCompanyId(nextCompanyId);
      if (!nextCompanyId) {
        setCashCompanyError("companyId が取得できません。ログイン状態または company 設定を確認してください。");
      }
    } catch (err) {
      setCashCompanyId("");
      setCashCompanyError(
        err instanceof Error ? err.message : "companyId load failed"
      );
    } finally {
      setCashCompanyLoading(false);
    }
  }

  async function runCashServerPreview() {
    setCashServerPreviewLoading(true);
    setCashServerPreviewError("");

    try {
      const rowsForServer =
        cashPreviewRows.length > 0
          ? cashPreviewRows
          : parseCashIncomeCsvDraft(cashCsvDraftText);

      if (rowsForServer.length === 0) {
        setCashServerPreview(null);
        setCashServerPreviewError("Server preview に送信する行がありません。");
        return;
      }

      if (cashPreviewRows.length === 0) {
        setCashPreviewRows(rowsForServer);
      }

      const companyId = cashCompanyId.trim();

      if (!companyId) {
        setCashServerPreview(null);
        setCashServerPreviewError("companyId が未取得のため Server Preview を実行できません。ページを再読み込みするか、ログイン状態を確認してください。");
        return;
      }

      const res = await previewCashIncomeImport({
        companyId,
        filename: "cash-income.csv",
        rows: rowsForServer.map((row) => ({
          rowNo: row.rowNo,
          accountName: row.account,
          amount: row.amount,
          occurredAt: row.occurredAt,
          memo: row.memo,
          source: row.source || undefined,
        })),
      });

      setCashServerPreview(res);
    } catch (err) {
      setCashServerPreview(null);
      setCashServerPreviewError(
        err instanceof Error ? err.message : "cash income server preview failed"
      );
    } finally {
      setCashServerPreviewLoading(false);
    }
  }

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
      setFilename(file.name || "amazon-store-orders.csv");
      setCsvText(text);
      setError("");
      setMessage(`已读取文件: ${file.name}`);
      setDetectResult(null);
      setPreviewResult(null);
      setCommitResult(null);
      setCommitResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "file read failed");
    }
  }

  async function runDetect() {
    if (!canRun) return;

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
    if (moduleMode === "cash-income") {
      setHistoryResult(null);
      setDetectResult(null);
      setPreviewResult(null);
      setCommitResult(null);
      setError("");
      setMessage("");
      void loadCashCompanyId();
      return;
    }

    void loadHistory(moduleMode);
  }, [moduleMode]);

  if (moduleMode === "cash-income") {
    return (
      <section className="space-y-6 rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">
              現金収入CSV取込
            </div>
            <div className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              現金入金データを CSV で取り込むための準備画面です。現在はサンプルフォーマットと preview table placeholder までを提供し、実際の CSV 解析・DB 登録は次ステップで実装します。
            </div>
          </div>

          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            module = cash-income
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
              <div className="text-sm font-semibold text-slate-900">
                取込予定フィールド
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Cash Income の手動登録 drawer と同じ最小項目を CSV でも扱う想定です。
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="grid grid-cols-[160px_1fr] border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <div>CSV Column</div>
                  <div>Description</div>
                </div>

                {[
                  ["account", "入金先口座。後続ステップで accountId と照合します。"],
                  ["amount", "現金収入金額。0 より大きい数値のみ有効です。"],
                  ["occurredAt", "発生日。YYYY-MM-DD または日時形式を想定します。"],
                  ["memo", "店頭現金売上、イベント売上、現金補正入金などの補足メモ。"],
                  ["source", "任意。入金元、店舗、補助情報など。初期版では memo への統合も可。"],
                ].map(([name, description]) => (
                  <div
                    key={name}
                    className="grid grid-cols-[160px_1fr] border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
                  >
                    <div className="font-medium text-slate-900">{name}</div>
                    <div className="text-slate-600">{description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    CSV サンプルフォーマット
                  </div>
                  <div className="mt-2 text-xs leading-5 text-slate-500">
                    まずはこの形式で cash-income CSV を準備します。実際の取込処理は次ステップで preview / validation に接続します。
                  </div>
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600">
                  static sample
                </div>
              </div>

              <pre className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-6 text-slate-700">
                {[
                  "account,amount,occurredAt,memo,source",
                  "現金,12000,2026-04-24,店頭現金売上,横浜店",
                  "現金,8500,2026-04-25,イベント現金売上,展示会",
                  "現金,3000,2026-04-26,現金補正入金,手動調整",
                ].join("\n")}
              </pre>

              <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
                金額は数値のみ、発生日は YYYY-MM-DD または日時形式を想定します。口座名は後続ステップで accountId と照合します。
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Client-side Draft Preview
                  </div>
                  <div className="mt-2 text-xs leading-5 text-slate-500">
                    CSV を貼り付けて、保存前にブラウザ上だけで preview / validation を確認します。DB と API には接続しません。
                  </div>
                </div>
                <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                  client only
                </div>
              </div>

              <textarea
                value={cashCsvDraftText}
                onChange={(e) => setCashCsvDraftText(e.target.value)}
                rows={7}
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs leading-6 text-slate-700"
                placeholder="account,amount,occurredAt,memo,source"
              />

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={runCashClientPreview}
                  className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Preview CSV
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCashCsvDraftText("");
                    setCashPreviewRows([]);
                    setCashServerPreview(null);
                    setCashServerPreviewError("");
                    setCashPreviewMessage("Draft をクリアしました。");
                  }}
                  className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Clear Draft
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCashCsvDraftText(CASH_INCOME_SAMPLE_TEXT);
                    setCashPreviewRows([]);
                    setCashServerPreview(null);
                    setCashServerPreviewError("");
                    setCashPreviewMessage("サンプル CSV を復元しました。Preview CSV を押して確認してください。");
                  }}
                  className="inline-flex rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  Use sample
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const rows = parseCashIncomeCsvDraft(CASH_INCOME_SAMPLE_TEXT);
                    setCashCsvDraftText(CASH_INCOME_SAMPLE_TEXT);
                    setCashPreviewRows(rows);
                    setCashServerPreview(null);
                    setCashServerPreviewError("");
                    setCashPreviewMessage(
                      `サンプル CSV を復元し、preview を自動生成しました：rows=${rows.length}。`
                    );
                  }}
                  className="inline-flex rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                >
                  Use sample + preview
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCashCsvDraftText(CASH_INCOME_ERROR_SAMPLE_TEXT);
                    setCashPreviewRows([]);
                    setCashServerPreview(null);
                    setCashServerPreviewError("");
                    setCashPreviewMessage("エラー確認用サンプルをセットしました。Preview CSV を押して validation を確認してください。");
                  }}
                  className="inline-flex rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                >
                  Use error sample
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const rows = parseCashIncomeCsvDraft(CASH_INCOME_ERROR_SAMPLE_TEXT);
                    const errorCount = rows.filter((row) => row.status === "error").length;
                    const warningCount = rows.filter((row) => row.status === "warning").length;
                    setCashCsvDraftText(CASH_INCOME_ERROR_SAMPLE_TEXT);
                    setCashPreviewRows(rows);
                    setCashServerPreview(null);
                    setCashServerPreviewError("");
                    setCashPreviewMessage(
                      `エラー確認用サンプルをセットし、preview を自動生成しました：rows=${rows.length}, error=${errorCount}, warning=${warningCount}。`
                    );
                  }}
                  className="inline-flex rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
                >
                  Use error sample + preview
                </button>

                <div className="text-xs text-slate-500">
                  No DB write / No API call
                </div>
              </div>

              {cashPreviewMessage ? (
                <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-700">
                  {cashPreviewMessage}
                </div>
              ) : null}

              <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-600">
                エラー動作を確認する場合は「Use error sample」を押してから Preview CSV を実行してください。
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl bg-white p-3">
                  <div className="text-[11px] text-slate-500">Rows</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {cashPreviewStats.total}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <div className="text-[11px] text-slate-500">Valid</div>
                  <div className="mt-1 text-lg font-semibold text-emerald-700">
                    {cashPreviewStats.valid}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <div className="text-[11px] text-slate-500">Warning</div>
                  <div className="mt-1 text-lg font-semibold text-amber-700">
                    {cashPreviewStats.warning}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-3">
                  <div className="text-[11px] text-slate-500">Error</div>
                  <div className="mt-1 text-lg font-semibold text-rose-700">
                    {cashPreviewStats.error}
                  </div>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <div className="min-w-[900px]">
                  <div className="grid grid-cols-[70px_120px_120px_130px_1fr_120px_170px] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <div>Row</div>
                    <div>Account</div>
                    <div>Amount</div>
                    <div>Occurred</div>
                    <div>Memo</div>
                    <div>Source</div>
                    <div>Status</div>
                  </div>

                  {cashPreviewRows.length > 0 ? (
                    cashPreviewRows.map((row) => (
                      <div
                        key={`${row.rowNo}-${row.account}-${row.amount}-${row.memo}`}
                        className="grid grid-cols-[70px_120px_120px_130px_1fr_120px_170px] gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
                      >
                        <div className="text-slate-500">{row.rowNo}</div>
                        <div className="font-medium text-slate-900">{row.account || "-"}</div>
                        <div className="text-slate-700">
                          {row.amount > 0 ? `¥${row.amount.toLocaleString("ja-JP")}` : "-"}
                        </div>
                        <div className="text-slate-600">{row.occurredAt || "-"}</div>
                        <div className="text-slate-600">{row.memo || "-"}</div>
                        <div className="text-slate-600">{row.source || "-"}</div>
                        <div>
                          <div
                            className={
                              row.status === "valid"
                                ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200"
                                : row.status === "warning"
                                  ? "inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200"
                                  : "inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-200"
                            }
                          >
                            {formatCashDraftStatusLabel(row.status)}
                          </div>
                          {row.messages.length > 0 ? (
                            <div className="mt-1 text-[11px] leading-4 text-slate-500">
                              {row.messages.map(formatCashDraftMessage).join(" / ")}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-sm text-slate-500">
                      CSV を貼り付けるか Use sample を押してから、Preview CSV をクリックしてください。
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Pending Import Design
                  </div>
                  <div className="mt-2 text-xs leading-5 text-slate-500">
                    Preview 済みの行を、将来の transaction create flow に渡す想定 payload として確認します。現時点では保存せず、DB/API には接続しません。
                  </div>
                </div>
                <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                  design only
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-[11px] text-slate-500">Commit Type</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">OTHER</div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-[11px] text-slate-500">Direction</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">INCOME</div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-[11px] text-slate-500">Memo Prefix</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">[cash]</div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-600">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-semibold text-slate-900">Company Context</span>
                    <span className="ml-2">
                      {cashCompanyLoading
                        ? "companyId を取得中..."
                        : cashCompanyId
                          ? `companyId=${cashCompanyId}`
                          : "companyId 未取得"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadCashCompanyId()}
                    className="inline-flex rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    companyId 再取得
                  </button>
                </div>
                {cashCompanyError ? (
                  <div className="mt-2 text-rose-700">{cashCompanyError}</div>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-[11px] text-slate-500">Pending Rows</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {cashPendingStats.pendingRows}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-[11px] text-slate-500">Excluded Error Rows</div>
                  <div className="mt-1 text-lg font-semibold text-rose-700">
                    {cashPendingStats.excludedErrorRows}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-[11px] text-slate-500">Total Pending Amount</div>
                  <div className="mt-1 text-lg font-semibold text-emerald-700">
                    ¥{cashPendingStats.totalPendingAmount.toLocaleString("ja-JP")}
                  </div>
                </div>
              </div>

              {cashPendingStats.excludedErrorRows > 0 ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700">
                  エラー行は pending payload から除外されます。修正後に Preview CSV を再実行してください。
                </div>
              ) : null}

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                正式導入は後続ステップで transaction create flow に接続します。accountName は accountId 照合が必要なため、この段階では pending payload として表示のみ行います。
              </div>

              <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <div className="min-w-[920px]">
                  <div className="grid grid-cols-[70px_90px_100px_120px_120px_130px_1fr_120px] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <div>Row</div>
                    <div>Type</div>
                    <div>Direction</div>
                    <div>Account</div>
                    <div>Amount</div>
                    <div>Occurred</div>
                    <div>Memo</div>
                    <div>Source</div>
                  </div>

                  {cashPendingRows.length > 0 ? (
                    cashPendingRows.map((row) => (
                      <div
                        key={`pending-${row.rowNo}-${row.amount}-${row.memo}`}
                        className="grid grid-cols-[70px_90px_100px_120px_120px_130px_1fr_120px] gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
                      >
                        <div className="text-slate-500">{row.rowNo}</div>
                        <div className="font-semibold text-slate-900">{row.type}</div>
                        <div className="font-semibold text-slate-900">{row.direction}</div>
                        <div className="text-slate-700">{row.accountName || "-"}</div>
                        <div className="text-slate-700">
                          ¥{row.amount.toLocaleString("ja-JP")}
                        </div>
                        <div className="text-slate-600">{row.occurredAt || "-"}</div>
                        <div className="text-slate-600">{row.memo}</div>
                        <div className="text-slate-600">{row.source || "-"}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-sm text-slate-500">
                      Preview CSV を実行すると、エラー以外の行が pending import payload として表示されます。
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <div className="text-xs leading-5 text-slate-500">
                  次ステップでは、この payload を transaction create flow に接続し、accountName → accountId の照合と一括登録 API を追加します。
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {cashPendingStats.pendingRows > 0 ? (
                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">
                      後続 API 接続待ち
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void runCashServerPreview()}
                    disabled={
                      cashServerPreviewLoading ||
                      cashCompanyLoading ||
                      !cashCompanyId ||
                      cashPreviewRows.length === 0
                    }
                    className="inline-flex rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cashServerPreviewLoading ? "Server Preview..." : "Server Preview"}
                  </button>
                  <button
                    type="button"
                    disabled
                    className="inline-flex cursor-not-allowed rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white opacity-40"
                  >
                    次のステップへ進む
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
                Server contract preview only / No transaction commit / DB write not connected
              </div>

              {cashServerPreviewError ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700">
                  {cashServerPreviewError}
                </div>
              ) : null}

              {cashServerPreview ? (
                <div className="mt-4 rounded-[22px] border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        Server Preview Result
                      </div>
                      <div className="mt-1 text-xs leading-5 text-slate-500">
                        H4-A mock endpoint から返却された normalizedPayload です。保存処理はまだ実行しません。
                      </div>
                    </div>
                    <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                      {cashServerPreview.action}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-5">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">Total Rows</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {cashServerPreview.summary.totalRows}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">Pending</div>
                      <div className="mt-1 text-lg font-semibold text-emerald-700">
                        {cashServerPreview.summary.pendingRows}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">Error</div>
                      <div className="mt-1 text-lg font-semibold text-rose-700">
                        {cashServerPreview.summary.errorRows}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">Warning</div>
                      <div className="mt-1 text-lg font-semibold text-amber-700">
                        {cashServerPreview.summary.warningRows}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">Amount</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        ¥{cashServerPreview.summary.totalPendingAmount.toLocaleString("ja-JP")}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">Exact matched</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {cashServerAccountResolutionStats.exactMatched}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">Cash fallback matched</div>
                      <div className="mt-1 text-lg font-semibold text-emerald-700">
                        {cashServerAccountResolutionStats.cashFallbackMatched}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <div className="text-[11px] text-slate-500">Unresolved</div>
                      <div className="mt-1 text-lg font-semibold text-amber-700">
                        {cashServerAccountResolutionStats.unresolved}
                      </div>
                    </div>
                  </div>

                  {cashServerAccountResolutionStats.unresolved > 0 ? (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                      未解決の口座があります。正式取込前に口座名を修正してください。
                    </div>
                  ) : null}

                  <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <div className="min-w-[980px]">
                      <div className="grid grid-cols-[70px_120px_100px_120px_130px_1fr_150px_170px] gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        <div>Row</div>
                        <div>Status</div>
                        <div>Type</div>
                        <div>Amount</div>
                        <div>Occurred</div>
                        <div>Memo</div>
                        <div>Account</div>
                        <div>Account ID</div>
                      </div>

                      {cashServerPreview.rows.map((row) => (
                        <div
                          key={`server-${row.rowNo}-${row.matchStatus}`}
                          className="grid grid-cols-[70px_120px_100px_120px_130px_1fr_150px_170px] gap-3 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
                        >
                          <div className="text-slate-500">{row.rowNo}</div>
                          <div>
                            <div className="font-semibold text-slate-900">{row.matchStatus}</div>
                            {row.matchReason ? (
                              <div className="mt-1 text-[11px] leading-4 text-slate-500">
                                {row.matchReason}
                              </div>
                            ) : null}
                          </div>
                          <div className="text-slate-700">{row.normalizedPayload.type}</div>
                          <div className="text-slate-700">
                            ¥{row.normalizedPayload.amount.toLocaleString("ja-JP")}
                          </div>
                          <div className="text-slate-600">{row.normalizedPayload.occurredAt || "-"}</div>
                          <div className="text-slate-600">{row.normalizedPayload.memo}</div>
                          <div className="text-slate-600">
                            {row.normalizedPayload.accountName || "-"}
                          </div>
                          <div className="space-y-1">
                            <div className="font-mono text-[11px] text-slate-600">
                              {row.normalizedPayload.accountId || "unresolved"}
                            </div>
                            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              {formatCashAccountMatchMode(row.accountResolution?.matchMode)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
              <div className="text-sm font-semibold text-slate-900">
                現在の実装ステータス
              </div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs text-slate-500">Entry</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">
                    /app/data/import?module=cash-income から専用画面を表示
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs text-slate-500">Sample</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">
                    CSV サンプルフォーマット表示：完了
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs text-slate-500">Preview</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">
                    Client-side preview：完了。DB/API には未接続
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <div className="text-xs text-slate-500">Pending Payload</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">
                    server preview result UX / account resolution summary まで完了（No commit / No DB write）
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-5">
              <div className="text-sm font-semibold text-amber-900">
                次の開発予定
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-800">
                <li>1. CSV サンプルフォーマット表示：完了</li>
                <li>2. クライアント側 preview table placeholder：完了</li>
                <li>3. CSV validation と preview state：完了（client-side only）</li>
                <li>4. Pending import payload design：完了</li>
                <li>5. Pending payload summary linkage：完了</li>
                <li>6. Server preview contract 接続：完了</li>
                <li>7. accountName → accountId exact match contract：完了</li>
                <li>8. account alias / cash fallback matching：完了</li>
                <li>9. frontend companyId server preview：完了</li>
                <li>10. server preview result UX：完了</li>
                <li>11. 将来：正式登録 API を transaction create flow に接続</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href={`/${lang}/app/income/cash`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                現金収入ページへ戻る
              </Link>
              <Link
                href={`/${lang}/app/settings/accounts`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                入金先口座を設定する
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold text-slate-900">
            幂等导入工作台
          </div>
          <div className="mt-2 text-sm text-slate-500">
            Step105-EC：文件上传 -&gt; detect -&gt; 月份冲突弹窗 -&gt; preview -&gt; history 刷新。当前仍与既有 Amazon CSV foundation 卡片并行，不替换旧入口。
          </div>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
          module = {moduleMode}
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-medium text-slate-900">Import Source</div>

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
                  {filename ? `当前文件: ${filename}` : "尚未选择文件"}
                </div>
              </div>

              <input
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="h-11 w-full rounded-[14px] border border-black/8 bg-white px-3 text-sm"
                placeholder="filename.csv"
              />

              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={10}
                className="w-full rounded-[14px] border border-black/8 bg-white px-3 py-3 text-sm"
                placeholder="可直接粘贴 CSV 文本，或通过上方文件选择读取。"
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
                <div className="text-sm font-medium text-slate-900">Current Draft Summary</div>
                <div className="mt-1 text-xs text-slate-500">
                  当前 import 草稿、detect 结果与 preview 状态总览
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
                <div className="mt-2">
                  {renderTagList(detectResult?.fileMonths)}
                </div>
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

            {commitResult ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-[18px] bg-white p-3">
                    <div className="text-[11px] text-slate-500">Imported</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {commitResult.importedRows ?? 0}
                    </div>
                  </div>
                  <div className="rounded-[18px] bg-white p-3">
                    <div className="text-[11px] text-slate-500">Duplicate</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {commitResult.duplicateRows ?? 0}
                    </div>
                  </div>
                  <div className="rounded-[18px] bg-white p-3">
                    <div className="text-[11px] text-slate-500">Conflict</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {commitResult.conflictRows ?? 0}
                    </div>
                  </div>
                  <div className="rounded-[18px] bg-white p-3">
                    <div className="text-[11px] text-slate-500">Error</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {commitResult.errorRows ?? 0}
                    </div>
                  </div>
                  <div className="rounded-[18px] bg-white p-3">
                    <div className="text-[11px] text-slate-500">Deleted</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {commitResult.deletedRows ?? 0}
                    </div>
                  </div>
                </div>

                {commitResult.summary ? (
                  <div className="rounded-[20px] border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          Import Result Summary
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          reconciliation-style summary / commit 后导入结果总览
                        </div>
                      </div>
                      <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600">
                        integrity ={" "}
                        {commitResult.summary.integrity?.importedRowsMatchesCommittedCount
                          ? "OK"
                          : "CHECK"}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                      <div className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">Filename</div>
                            <div className="mt-1 break-all text-sm font-medium text-slate-900">
                              {commitResult.summary.filename || "-"}
                            </div>
                          </div>
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">Module</div>
                            <div className="mt-1 text-sm font-medium text-slate-900">
                              {commitResult.summary.module || "-"}
                            </div>
                          </div>
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">Created At</div>
                            <div className="mt-1 text-sm font-medium text-slate-900">
                              {formatDateTime(commitResult.summary.createdAt)}
                            </div>
                          </div>
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">Imported At</div>
                            <div className="mt-1 text-sm font-medium text-slate-900">
                              {formatDateTime(commitResult.summary.importedAt)}
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">File Months</div>
                            <div className="mt-2">
                              {renderTagList(commitResult.summary.months?.fileMonths)}
                            </div>
                          </div>
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">Conflict Months</div>
                            <div className="mt-2">
                              {renderTagList(commitResult.summary.months?.conflictMonths)}
                            </div>
                          </div>
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">Imported Months</div>
                            <div className="mt-2">
                              {renderTagList(commitResult.summary.months?.importedMonths)}
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">Staging Total</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">
                              {formatNumber(commitResult.summary.staging?.totalRows)}
                            </div>
                          </div>
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">Staging New</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">
                              {formatNumber(commitResult.summary.staging?.newRows)}
                            </div>
                          </div>
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">Staging Duplicate</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">
                              {formatNumber(commitResult.summary.staging?.duplicateRows)}
                            </div>
                          </div>
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">Staging Conflict/Error</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">
                              {formatNumber(
                                Number(commitResult.summary.staging?.conflictRows || 0) +
                                  Number(commitResult.summary.staging?.errorRows || 0)
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">Committed Count</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">
                              {formatNumber(commitResult.summary.transactions?.committedCount)}
                            </div>
                          </div>
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">Committed Amount</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">
                              ¥{formatNumber(commitResult.summary.transactions?.totalCommittedAmount)}
                            </div>
                          </div>
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">With Account</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">
                              {formatNumber(commitResult.summary.coverage?.withAccountCount)}
                            </div>
                          </div>
                          <div className="rounded-[16px] bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">With Category</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">
                              {formatNumber(commitResult.summary.coverage?.withCategoryCount)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-[16px] bg-slate-50 p-3">
                          <div className="text-[11px] text-slate-500">Direction Breakdown</div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                            <div>
                              <div className="text-[11px] text-slate-500">Income</div>
                              <div className="mt-1 text-sm font-semibold text-slate-900">
                                {formatNumber(commitResult.summary.transactions?.incomeCount)}
                              </div>
                            </div>
                            <div>
                              <div className="text-[11px] text-slate-500">Expense</div>
                              <div className="mt-1 text-sm font-semibold text-slate-900">
                                {formatNumber(commitResult.summary.transactions?.expenseCount)}
                              </div>
                            </div>
                            <div>
                              <div className="text-[11px] text-slate-500">Transfer</div>
                              <div className="mt-1 text-sm font-semibold text-slate-900">
                                {formatNumber(commitResult.summary.transactions?.transferCount)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[16px] bg-slate-50 p-3">
                          <div className="text-[11px] text-slate-500">Type Breakdown</div>
                          <div className="mt-3 space-y-2">
                            {Array.isArray(commitResult.summary.transactions?.byType) &&
                            commitResult.summary.transactions?.byType?.length ? (
                              commitResult.summary.transactions.byType.map((item) => (
                                <div
                                  key={item.type}
                                  className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm"
                                >
                                  <div className="font-medium text-slate-800">{item.type}</div>
                                  <div className="text-slate-600">
                                    {formatNumber(item.count)} / ¥{formatNumber(item.amount)}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-slate-500">-</div>
                            )}
                          </div>
                        </div>

                        <div className="rounded-[16px] bg-slate-50 p-3">
                          <div className="text-[11px] text-slate-500">Month Breakdown</div>
                          <div className="mt-3 space-y-2">
                            {Array.isArray(commitResult.summary.transactions?.byMonth) &&
                            commitResult.summary.transactions?.byMonth?.length ? (
                              commitResult.summary.transactions.byMonth.map((item) => (
                                <div
                                  key={item.month}
                                  className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm"
                                >
                                  <div className="font-medium text-slate-800">{item.month}</div>
                                  <div className="text-slate-600">
                                    {formatNumber(item.count)} / ¥{formatNumber(item.amount)}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-slate-500">-</div>
                            )}
                          </div>
                        </div>

                        <div className="rounded-[16px] bg-slate-50 p-3">
                          <div className="text-[11px] text-slate-500">Integrity Check</div>
                          <div className="mt-2 text-sm font-medium text-slate-900">
                            importedRowsMatchesCommittedCount ={" "}
                            {commitResult.summary.integrity?.importedRowsMatchesCommittedCount
                              ? "true"
                              : "false"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <ImportPreviewTable preview={previewResult} />
        <ImportHistoryList
          history={historyResult}
          loading={historyLoading}
          moduleLabel={moduleLabel}
        />
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
