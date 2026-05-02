"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  commitExpenseImport,
  commitExpenseImportJob,
  previewExpenseImport,
  type ExpenseImportCommitResponse,
  type ExpenseImportJobCommitResponse,
  type ExpenseImportPreviewResponse,
} from "@/core/imports";
import {
  validateLedgerCsvTextScope,
  type LedgerScope,
} from "@/core/ledger/ledger-scopes";

type ExpenseImportDialogRow = {
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

export type ExpenseImportDialogProps = {
  open: boolean;
  onClose: () => void;
  ledgerScope: LedgerScope;
  label: string;
  category: string;
  defaultFilename?: string;
  onCommitted?: (result: ExpenseImportCommitResponse) => void | Promise<void>;
};

function formatNumber(value?: number | null) {
  return Number(value || 0).toLocaleString("ja-JP");
}

function splitExpenseImportCsvLine(line: string) {
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

function getExpenseImportCell(row: Record<string, string>, keys: string[]) {
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

function buildExpenseDialogPreviewRows(args: {
  ledgerScope: LedgerScope;
  csvText: string;
}) {
  const scopeResult = validateLedgerCsvTextScope({
    currentScope: args.ledgerScope,
    csvText: args.csvText,
  });

  if (!scopeResult.ok) {
    throw new Error(scopeResult.messageJa);
  }

  const lines = String(args.csvText || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error(
      "CSVに登録対象のデータ行がありません。1行目はヘッダー、2行目以降に支出データを入力してください。"
    );
  }

  const headers = splitExpenseImportCsvLine(lines[0]).map(
    normalizeExpenseImportHeader
  );
  const rows: ExpenseImportDialogRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitExpenseImportCsvLine(lines[i]);
    const raw: Record<string, string> = {};

    headers.forEach((header, index) => {
      raw[header] = cells[index] ?? "";
    });

    const occurredAt = getExpenseImportCell(raw, [
      "occurred_at",
      "payment_date",
      "date",
      "発生日",
      "支払日",
    ]);
    const amount = parseExpenseImportAmount(
      getExpenseImportCell(raw, ["amount", "金額"])
    );
    const currency =
      getExpenseImportCell(raw, ["currency", "通貨"]) || "JPY";
    const category = getExpenseImportCell(raw, [
      "expense_category",
      "payroll_category",
      "category",
      "費目",
      "支出区分",
    ]);
    const vendor = getExpenseImportCell(raw, [
      "vendor",
      "payee",
      "supplier",
      "支払先",
      "仕入先",
    ]);
    const accountName = getExpenseImportCell(raw, [
      "account_name",
      "account",
      "口座",
      "支払口座",
    ]);
    const evidenceNo = getExpenseImportCell(raw, [
      "evidence_no",
      "invoice_no",
      "receipt_no",
      "証憑番号",
      "請求書番号",
    ]);
    const memo = getExpenseImportCell(raw, ["memo", "メモ", "摘要"]);
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

function summarizeExpenseDialogRows(rows: ExpenseImportDialogRow[]) {
  const okRows = rows.filter((row) => row.status === "ok");
  const errorRows = rows.filter((row) => row.status === "error");
  const totalAmount = okRows.reduce(
    (sum, row) => sum + Number(row.amount || 0),
    0
  );
  const evidenceMissing = rows.filter((row) => !row.evidenceNo).length;
  const accountCount = new Set(
    rows.map((row) => row.accountName).filter(Boolean)
  ).size;

  return {
    totalRows: rows.length,
    okRows: okRows.length,
    errorRows: errorRows.length,
    totalAmount,
    evidenceMissing,
    accountCount,
  };
}

function normalizeExpenseDialogError(args: {
  error: unknown;
  label: string;
  ledgerScope: LedgerScope;
  filename: string;
}) {
  const raw =
    args.error instanceof Error
      ? args.error.message
      : String(args.error || "unknown error");
  const lower = raw.toLowerCase();

  if (lower.includes("ledger_scope") || raw.includes("現在ページ")) {
    return [
      `${args.label} 用テンプレートではない可能性があります。`,
      `現在ページの ledger_scope は「${args.ledgerScope}」です。`,
      "このページのテンプレートダウンロードから取得したCSVを使用してください。",
      `対象ファイル: ${args.filename || "-"}`,
      raw,
    ].join("\n");
  }

  if (raw.includes("データ行がありません") || lower.includes("empty")) {
    return [
      "CSVに登録対象のデータ行がありません。",
      "1行目はヘッダー、2行目以降に支出データを入力してください。",
      `対象ファイル: ${args.filename || "-"}`,
      raw,
    ].join("\n");
  }

  if (
    raw.includes("日付未入力") ||
    raw.includes("金額未入力") ||
    raw.includes("支出区分未入力") ||
    raw.includes("証憑番号未入力") ||
    raw.includes("エラー行")
  ) {
    return [
      `${args.label} のCSVに未入力または修正が必要な行があります。`,
      "プレビュー表の状態列を確認し、該当行を修正してください。",
      "必須項目: ledger_scope / 発生日 / 金額 / 支出区分 / 証憑番号",
      raw,
    ].join("\n");
  }

  return [
    `${args.label} の取込で確認が必要です。`,
    "テンプレート、ledger_scope、必須項目、日付・金額の形式を確認してください。",
    raw,
  ].join("\n");
}

// Step109-Z1-H6A-EXPENSE-IMPORT-DIALOG:
// Reusable scoped expense CSV/Excel import dialog.
// H6A only creates this component. Existing /app/data/import flow remains unchanged.
// Step109-Z1-H9-2B-EXPENSE-BACKEND-PREVIEW:
// Send locally validated expense preview rows to backend ImportJob/ImportStagingRow.
// H9-2 only switches preview. Formal registration remains on legacy commitExpenseImport.
async function previewExpenseImportOnBackend(args: {
  ledgerScope: LedgerScope;
  filename: string;
  category: string;
  rows: ExpenseImportDialogRow[];
}): Promise<ExpenseImportPreviewResponse> {
  const data = await previewExpenseImport({
    filename: args.filename,
    ledgerScope: args.ledgerScope,
    category: args.category,
    rows: args.rows,
  });

  const importJobId = String(data.importJobId || "").trim();

  if (!importJobId) {
    throw new Error("Backend ImportJob が作成されませんでした。もう一度プレビューを実行してください。");
  }

  if (data.ledgerScope && data.ledgerScope !== args.ledgerScope) {
    throw new Error(`Backend preview ledgerScope mismatch: ${data.ledgerScope}`);
  }

  return data;
}

// Step109-Z1-H9-3-EXPENSE-BACKEND-COMMIT:
// Adapt the new ImportJob commit response to the legacy onCommitted shape used by pages.
function adaptExpenseJobCommitToLegacyResponse(
  result: ExpenseImportJobCommitResponse
): ExpenseImportCommitResponse {
  const importedRows = Number(result.imported || 0);
  const duplicateRows = Number(result.duplicate || 0);
  const errorRows = Number(result.error || 0);
  const totalImportedAmount = Number(result.amount || 0);
  const totalRows = Number(result.totalRows || importedRows + duplicateRows + errorRows);
  const filename = result.filename ?? null;
  const createdTransactionIds = Array.isArray(result.createdTransactionIds)
    ? result.createdTransactionIds
    : [];

  return {
    ok: result.ok,
    action: "expense-import-commit",
    module: result.ledgerScope,
    companyId: result.companyId,
    filename,
    importJobId: result.importJobId,
    importedRows,
    duplicateRows,
    blockedRows: 0,
    errorRows,
    totalImportedAmount,
    createdTransactionIds,
    job: {
      id: result.importJobId,
      filename,
      status: result.ok ? "SUCCEEDED" : "FAILED",
      totalRows,
      successRows: importedRows,
      failedRows: errorRows,
      importedAt: null,
    },
    message: result.message || "",
  };
}

export function ExpenseImportDialog(props: ExpenseImportDialogProps) {
  const {
    open,
    onClose,
    ledgerScope,
    label,
    category,
    defaultFilename,
    onCommitted,
  } = props;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [filename, setFilename] = useState(
    defaultFilename || `${ledgerScope}-template.csv`
  );
  const [csvText, setCsvText] = useState("");
  const [previewRows, setPreviewRows] = useState<ExpenseImportDialogRow[]>([]);
  const [backendImportJobId, setBackendImportJobId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [commitResult, setCommitResult] =
    useState<ExpenseImportCommitResponse | null>(null);

  const summary = useMemo(
    () => summarizeExpenseDialogRows(previewRows),
    [previewRows]
  );

  const canPreview = Boolean(csvText.trim() && filename.trim());
  const canCommit =
    previewRows.length > 0 &&
    summary.errorRows === 0 &&
    Boolean(backendImportJobId) &&
    !commitLoading;

  if (!open) return null;

  async function handleFileSelected(file: File | null) {
    if (!file) return;

    try {
      const text = await file.text();
      setFilename(file.name || `${ledgerScope}-template.csv`);
      setCsvText(text);
      setPreviewRows([]);
      setBackendImportJobId(null);
      setCommitResult(null);
      setError("");
      setMessage(`${label} テンプレートを読み取りました: ${file.name}`);
    } catch (err) {
      setMessage("");
      setError(
        normalizeExpenseDialogError({
          error: err,
          label,
          ledgerScope,
          filename: file.name || filename,
        })
      );
    }
  }

  async function runPreview() {
    if (!canPreview) return;

    setLoading(true);
    setError("");
    setMessage("");
    setCommitResult(null);

    try {
      const rows = buildExpenseDialogPreviewRows({
        ledgerScope,
        csvText,
      });
      const nextSummary = summarizeExpenseDialogRows(rows);
      setPreviewRows(rows);
      setBackendImportJobId(null);

      if (nextSummary.errorRows > 0) {
        setError(
          [
            `${label} のCSVにエラー行があります。`,
            "正式登録前に日付・金額・支出区分・証憑番号を確認してください。",
            `対象行: ${nextSummary.totalRows} / OK: ${nextSummary.okRows} / エラー: ${nextSummary.errorRows}`,
          ].join("\n")
        );
        return;
      }

      const backendPreview = await previewExpenseImportOnBackend({
        ledgerScope,
        filename,
        category,
        rows,
      });
      const importJobId = String(backendPreview.importJobId || "").trim();
      setBackendImportJobId(importJobId);

      setMessage(
        `${label} の取込プレビューを生成しました。対象行: ${nextSummary.totalRows} / OK: ${nextSummary.okRows} / エラー: ${nextSummary.errorRows} / Backend ImportJob: ${importJobId}`
      );
    } catch (err) {
      setPreviewRows([]);
      setError(
        normalizeExpenseDialogError({
          error: err,
          label,
          ledgerScope,
          filename,
        })
      );
    } finally {
      setLoading(false);
    }
  }

  async function runCommit() {
    if (!canCommit) return;

    setCommitLoading(true);
    setError("");
    setMessage("");
    setCommitResult(null);

    try {
      const importJobId = String(backendImportJobId || "").trim();

      if (!importJobId) {
        throw new Error("Backend ImportJob がありません。先に検証を実行してください。");
      }

      const backendResult = await commitExpenseImportJob(importJobId, {});
      const result = adaptExpenseJobCommitToLegacyResponse(backendResult);

      setCommitResult(result);
      setMessage(
        `${label} の正式登録が完了しました。登録: ${result.importedRows} / 重複: ${result.duplicateRows} / エラー: ${result.errorRows} / 金額: ¥${formatNumber(result.totalImportedAmount)} / Backend ImportJob: ${result.importJobId}`
      );

      await onCommitted?.(result);
    } catch (err) {
      setCommitResult(null);
      setError(
        normalizeExpenseDialogError({
          error: err,
          label,
          ledgerScope,
          filename,
        })
      );
    } finally {
      setCommitLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${label}CSV/Excel取込`}
    >
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-black/10">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <div className="text-xl font-bold text-slate-950">
              {label}CSV/Excel取込
            </div>
            <div className="mt-1 text-sm text-slate-500">
              ledger_scope ={" "}
              <span className="font-semibold text-emerald-700">
                {ledgerScope}
              </span>{" "}
              のテンプレートだけを受け付けます。
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            閉じる
          </button>
        </div>

        <div className="grid max-h-[calc(92vh-88px)] gap-4 overflow-y-auto p-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <div className="font-bold">{label} 専用インポート</div>
              <div className="mt-1 text-xs leading-5">
                各ページのテンプレートダウンロードから取得したCSVを使用してください。
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.tsv,text/csv,text/plain"
              className="hidden"
              onChange={(event) => {
                void handleFileSelected(event.target.files?.[0] ?? null);
                event.currentTarget.value = "";
              }}
            />

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                ファイルを選択
              </button>
              <span className="text-sm text-slate-500">
                現在ファイル: {filename || "-"}
              </span>
            </div>

            <input
              value={filename}
              onChange={(event) => setFilename(event.target.value)}
              className="h-11 w-full rounded-[14px] border border-black/8 bg-white px-3 text-sm"
              placeholder={`${ledgerScope}-template.csv`}
            />

            <textarea
              value={csvText}
              onChange={(event) => {
                setCsvText(event.target.value);
                setPreviewRows([]);
                setBackendImportJobId(null);
                setCommitResult(null);
              }}
              rows={11}
              className="w-full rounded-[14px] border border-black/8 bg-white px-3 py-3 text-sm leading-6"
              placeholder="CSV テキストを貼り付けることもできます。ledger_scope は現在ページと一致している必要があります。"
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void runPreview()}
                disabled={loading || !canPreview}
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading ? "検証中..." : "開始導入検測"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCsvText("");
                  setPreviewRows([]);
                  setBackendImportJobId(null);
                  setError("");
                  setMessage("");
                  setCommitResult(null);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                クリア
              </button>
            </div>

            {message ? (
              <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-700">
                {message}
              </div>
            ) : null}

            {error ? (
              <div className="whitespace-pre-line rounded-[18px] border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-700">
                {error}
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-[22px] border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-base font-bold text-slate-950">
                    Expense Validation Result
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    ledger_scope・必須項目・証憑番号を検証した結果です。
                  </div>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                  {ledgerScope}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[16px] bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-500">
                    対象行数
                  </div>
                  <div className="mt-1 text-xl font-bold text-slate-950">
                    {formatNumber(summary.totalRows)}
                  </div>
                </div>
                <div className="rounded-[16px] bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-500">
                    OK / エラー
                  </div>
                  <div className="mt-1 text-xl font-bold text-slate-950">
                    {formatNumber(summary.okRows)} /{" "}
                    {formatNumber(summary.errorRows)}
                  </div>
                </div>
                <div className="rounded-[16px] bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-500">
                    合計金額
                  </div>
                  <div className="mt-1 text-xl font-bold text-slate-950">
                    ¥{formatNumber(summary.totalAmount)}
                  </div>
                </div>
                <div className="rounded-[16px] bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-500">
                    証憑不足 / 口座数
                  </div>
                  <div className="mt-1 text-xl font-bold text-slate-950">
                    {formatNumber(summary.evidenceMissing)} /{" "}
                    {formatNumber(summary.accountCount)}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-base font-bold text-slate-950">
                    支出 Preview Table
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    日付・金額・支出区分・支払先・口座・証憑番号・メモを確認します。
                  </div>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">
                  rows: {formatNumber(previewRows.length)}
                </span>
              </div>

              <div className="overflow-x-auto rounded-[18px] border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="px-3 py-2">行</th>
                      <th className="px-3 py-2">日付</th>
                      <th className="px-3 py-2 text-right">金額</th>
                      <th className="px-3 py-2">区分</th>
                      <th className="px-3 py-2">支払先</th>
                      <th className="px-3 py-2">口座</th>
                      <th className="px-3 py-2">証憑</th>
                      <th className="px-3 py-2">メモ</th>
                      <th className="px-3 py-2">状態</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.length ? (
                      previewRows.map((row) => (
                        <tr key={`${row.rowNo}-${row.evidenceNo || row.memo}`}>
                          <td className="px-3 py-2 text-slate-500">
                            {row.rowNo}
                          </td>
                          <td className="px-3 py-2">{row.occurredAt || "-"}</td>
                          <td className="px-3 py-2 text-right font-semibold">
                            ¥{formatNumber(row.amount)}
                          </td>
                          <td className="px-3 py-2">{row.category || "-"}</td>
                          <td className="px-3 py-2">{row.vendor || "-"}</td>
                          <td className="px-3 py-2">{row.accountName || "-"}</td>
                          <td className="px-3 py-2">{row.evidenceNo || "-"}</td>
                          <td className="px-3 py-2">{row.memo || "-"}</td>
                          <td className="px-3 py-2">
                            {row.status === "ok" ? (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                                OK
                              </span>
                            ) : (
                              <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                                {row.error || "ERROR"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-3 py-8 text-center text-sm text-slate-500"
                        >
                          まだ preview 行はありません。
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-base font-bold text-slate-950">
                    正式登録
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    H6B 以降で各ページからこの dialog を直接開き、登録後にページを自動更新します。
                    {backendImportJobId ? (
                      <span className="ml-1 font-semibold text-emerald-700">
                        Backend ImportJob: {backendImportJobId}
                      </span>
                    ) : (
                      <span className="ml-1 font-semibold text-amber-700">
                        先に検証を実行してください。
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void runCommit()}
                  disabled={!canCommit}
                  className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {commitLoading ? "登録中..." : "支出を正式登録"}
                </button>
              </div>

              {commitResult ? (
                <div className="mt-4 rounded-[18px] border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                  imported={commitResult.importedRows} / duplicate=
                  {commitResult.duplicateRows} / error={commitResult.errorRows}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
