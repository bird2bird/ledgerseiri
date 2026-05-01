"use client";

import React from "react";
import {
  LEDGER_SCOPES,
  type LedgerScope,
  validateLedgerCsvTextScope,
} from "@/core/ledger/ledger-scopes";
import { createTransaction, listTransactions } from "@/core/transactions/api";
import { listAccounts } from "@/core/funds/api";

type IncomeImportScope =
  | typeof LEDGER_SCOPES.CASH_INCOME
  | typeof LEDGER_SCOPES.OTHER_INCOME;

type IncomeImportStatus = "idle" | "reading" | "preview" | "committing" | "done" | "error";

// Step109-Z1-H7B-FIX3-INCOME-DIALOG-FETCH-ACCOUNTS-FALLBACK:
// The dialog accepts lightweight page options and can fetch account fallback when props.accounts is empty.
type IncomeImportAccountOption = {
  id?: string | null;
  value?: string | null;
  accountId?: string | null;
  name?: string | null;
  label?: string | null;
  accountName?: string | null;
};


type IncomePreviewRow = {
  rowNo: number;
  ledgerScope: IncomeImportScope;
  occurredAt: string;
  amount: number;
  currency: string;
  incomeCategory: string;
  payer: string;
  accountName: string;
  memo: string;
  status: "ok" | "error";
  messages: string[];
};

export type IncomeImportCommitResult = {
  importJobId?: string | null;
  imported: number;
  duplicate: number;
  error: number;
  amount: number;
};

export type IncomeImportDialogProps = {
  open: boolean;
  onClose: () => void;
  ledgerScope: IncomeImportScope;
  label: string;
  accounts: IncomeImportAccountOption[];
  defaultFilename?: string;
  onCommitted?: (result: IncomeImportCommitResult) => void | Promise<void>;
};

const INCOME_IMPORT_ALLOWED_EXTENSIONS = [".csv", ".tsv", ".txt", ".xlsx", ".xls"];
const INCOME_IMPORT_MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const INCOME_IMPORT_MAX_ROWS = 2000;

function isIncomeImportScope(scope: LedgerScope): scope is IncomeImportScope {
  return scope === LEDGER_SCOPES.CASH_INCOME || scope === LEDGER_SCOPES.OTHER_INCOME;
}

function formatJPY(value: number) {
  return `¥${Math.round(Number(value || 0)).toLocaleString("ja-JP")}`;
}

function normalizeText(value?: string | null) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[（]/g, "(")
    .replace(/[）]/g, ")")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

function normalizeDateKey(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const normalized = raw.replace(/\//g, "-");
  const parsed = new Date(normalized.includes("T") ? normalized : `${normalized}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return raw.slice(0, 10);

  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

function normalizeDateInput(value?: string | null) {
  const key = normalizeDateKey(value);
  if (!key) return "";
  return key;
}

function formatImportFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.ceil(bytes / 1024)} KB`;
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quote = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"' && quote && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (ch === '"') {
      quote = !quote;
      continue;
    }

    if ((ch === "," || ch === "\t") && !quote) {
      cells.push(current);
      current = "";
      continue;
    }

    current += ch;
  }

  cells.push(current);
  return cells.map((cell) => String(cell || "").trim());
}

function normalizeIncomeHeader(value: string) {
  const raw = String(value || "").trim();
  const map: Record<string, string> = {
    ledger_scope: "ledger_scope",
    ledgerscope: "ledger_scope",
    "ledger scope": "ledger_scope",

    occurred_at: "occurredAt",
    occurredAt: "occurredAt",
    date: "occurredAt",
    発生日: "occurredAt",
    日付: "occurredAt",
    取引日: "occurredAt",

    amount: "amount",
    金額: "amount",
    収入額: "amount",
    入金額: "amount",

    currency: "currency",

    income_category: "incomeCategory",
    income_source_category: "incomeCategory",
    revenueCategory: "incomeCategory",
    category: "incomeCategory",
    収入区分: "incomeCategory",
    売上区分: "incomeCategory",
    収入カテゴリ: "incomeCategory",
    カテゴリ: "incomeCategory",
    種別: "incomeCategory",
    区分: "incomeCategory",

    payer: "payer",
    income_source: "payer",
    source: "payer",
    入金元: "payer",
    収入元: "payer",
    店舗: "payer",

    account_name: "accountName",
    accountName: "accountName",
    account: "accountName",
    cash_account: "accountName",
    ledger_account: "accountName",
    口座: "accountName",
    口座名: "accountName",
    入金口座: "accountName",

    memo: "memo",
    メモ: "memo",
    摘要: "memo",
    備考: "memo",
  };

  return map[raw] || raw;
}

async function readIncomeImportFileAsCsvText(file: File) {
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

function parseIncomeCsvPreviewRows(args: {
  csvText: string;
  ledgerScope: IncomeImportScope;
}): IncomePreviewRow[] {
  const lines = String(args.csvText || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const rawHeader = splitCsvLine(lines[0]);
  const normalizedHeader = rawHeader.map(normalizeIncomeHeader);
  const hasHeader =
    normalizedHeader.includes("ledger_scope") ||
    normalizedHeader.includes("occurredAt") ||
    normalizedHeader.includes("amount") ||
    normalizedHeader.includes("accountName");

  const header = hasHeader
    ? normalizedHeader
    : ["ledger_scope", "occurredAt", "amount", "currency", "incomeCategory", "payer", "accountName", "memo"];
  const body = hasHeader ? lines.slice(1) : lines;

  const index = {
    ledgerScope: header.indexOf("ledger_scope"),
    occurredAt: header.indexOf("occurredAt"),
    amount: header.indexOf("amount"),
    currency: header.indexOf("currency"),
    incomeCategory: header.indexOf("incomeCategory"),
    payer: header.indexOf("payer"),
    accountName: header.indexOf("accountName"),
    memo: header.indexOf("memo"),
  };

  return body.map((line, rowIndex) => {
    const cells = splitCsvLine(line);
    const ledgerScope = String(cells[index.ledgerScope] || "").trim() as IncomeImportScope;
    const occurredAt = index.occurredAt >= 0 ? String(cells[index.occurredAt] || "").trim() : "";
    const amountRaw = index.amount >= 0 ? String(cells[index.amount] || "").replace(/[¥,\s]/g, "") : "";
    const amount = Number(amountRaw || 0);
    const currency = index.currency >= 0 ? String(cells[index.currency] || "JPY").trim() || "JPY" : "JPY";
    const incomeCategory =
      index.incomeCategory >= 0 ? String(cells[index.incomeCategory] || "").trim() : "";
    const payer = index.payer >= 0 ? String(cells[index.payer] || "").trim() : "";
    const accountName = index.accountName >= 0 ? String(cells[index.accountName] || "").trim() : "";
    const memo = index.memo >= 0 ? String(cells[index.memo] || "").trim() : "";

    const messages: string[] = [];

    if (!ledgerScope) messages.push("ledger_scope が未入力です");
    if (ledgerScope && ledgerScope !== args.ledgerScope) {
      messages.push(`ledger_scope が現在ページと一致しません: ${ledgerScope}`);
    }
    if (!occurredAt || Number.isNaN(new Date(normalizeDateInput(occurredAt)).getTime())) {
      messages.push("発生日が不正です");
    }
    if (!Number.isFinite(amount) || amount <= 0) messages.push("金額が不正です");
    if (!accountName) messages.push("口座名が未入力です");
    if (!incomeCategory) {
      messages.push(args.ledgerScope === LEDGER_SCOPES.CASH_INCOME ? "収入区分が未入力です" : "収入カテゴリが未入力です");
    }

    return {
      rowNo: rowIndex + 2,
      ledgerScope,
      occurredAt,
      amount,
      currency,
      incomeCategory,
      payer,
      accountName,
      memo,
      status: messages.length > 0 ? "error" : "ok",
      messages,
    };
  });
}

function getIncomeAccountId(item: IncomeImportAccountOption) {
  return String(item.id || item.value || item.accountId || "").trim();
}

function getIncomeAccountName(item: IncomeImportAccountOption) {
  return String(item.name || item.label || item.accountName || "").trim();
}

function normalizeAccountAlias(value?: string | null) {
  return normalizeText(value)
    .replace(/\(sample\)$/g, "")
    .replace(/sample$/g, "")
    .replace(/サンプル$/g, "");
}

// Step109-Z1-H7B-FIX4-DEDUPE-INCOME-ACCOUNT-HELPERS
// Step109-Z1-H7B-FIX4B-VERIFY-AND-BUILD-INCOME-DIALOG
function resolveIncomeAccountId(accountName: string, accounts: IncomeImportAccountOption[]) {
  const raw = String(accountName || "").trim();
  const normalizedRaw = normalizeAccountAlias(raw);

  const normalizedAccounts = accounts
    .map((item) => ({
      id: getIncomeAccountId(item),
      name: getIncomeAccountName(item),
      normalizedName: normalizeAccountAlias(getIncomeAccountName(item)),
    }))
    .filter((item) => item.id && item.name);

  if (!normalizedRaw) {
    const firstCash = normalizedAccounts.find((item) => {
      const name = item.normalizedName;
      return name.includes("現金") || name.includes("cash");
    });
    return firstCash?.id || normalizedAccounts[0]?.id || "";
  }

  const exact = normalizedAccounts.find((item) => item.normalizedName === normalizedRaw);
  if (exact) return exact.id;

  const loose = normalizedAccounts.find((item) => {
    const name = item.normalizedName;
    return name.includes(normalizedRaw) || normalizedRaw.includes(name);
  });
  if (loose) return loose.id;

  const cashFallback = normalizedAccounts.find((item) => {
    const name = item.normalizedName;
    return (
      name.includes("現金") ||
      name.includes("cash") ||
      normalizedRaw.includes("現金") ||
      normalizedRaw.includes("cash")
    );
  });

  return cashFallback?.id || "";
}

function stripImportMarkers(value?: string | null) {
  return String(value || "")
    .replace(/\s*\[file-import:[^\]]+\]\s*/g, " ")
    .replace(/\s*\[income_import_job:[^\]]+\]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildIncomeImportedMemo(args: {
  ledgerScope: IncomeImportScope;
  category: string;
  memo: string;
  payer: string;
  fileName: string;
}) {
  const category = String(args.category || "").trim();
  const visibleMemo = stripImportMarkers(args.memo || category || args.payer || "収入");
  const payerPart = args.payer ? ` / ${args.payer}` : "";
  const filePart = ` [file-import:${args.fileName}]`;

  if (args.ledgerScope === LEDGER_SCOPES.OTHER_INCOME) {
    const finalCategory = category || "その他収入";
    return `[other-income-category:${finalCategory}] ${visibleMemo}${payerPart}${filePart}`.trim();
  }

  const finalCategory = category || "現金収入";
  return `[cash] [cash-revenue-category:${finalCategory}] ${visibleMemo}${payerPart}${filePart}`.trim();
}

function buildIncomeDedupeKey(args: {
  accountName: string;
  amount: number;
  occurredAt: string;
  memo: string;
}) {
  return [
    normalizeText(args.accountName),
    String(Math.round(Number(args.amount || 0))),
    normalizeDateKey(args.occurredAt),
    normalizeText(stripImportMarkers(args.memo)),
  ].join("__");
}

export function IncomeImportDialog(props: IncomeImportDialogProps) {
  const {
    open,
    onClose,
    ledgerScope,
    label,
    accounts,
    defaultFilename,
    onCommitted,
  } = props;

  const [status, setStatus] = React.useState<IncomeImportStatus>("idle");
  const [fileName, setFileName] = React.useState(defaultFilename || "");
  const [csvText, setCsvText] = React.useState("");
  const [previewRows, setPreviewRows] = React.useState<IncomePreviewRow[]>([]);
  const [message, setMessage] = React.useState("");
  const [commitMessage, setCommitMessage] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [fallbackAccounts, setFallbackAccounts] = React.useState<IncomeImportAccountOption[]>([]);

  const effectiveAccounts = React.useMemo(
    () => (accounts.length > 0 ? accounts : fallbackAccounts),
    [accounts, fallbackAccounts]
  );

  React.useEffect(() => {
    if (!open || accounts.length > 0) return;

    let alive = true;

    listAccounts()
      .then((res) => {
        if (!alive) return;

        setFallbackAccounts(
          (res.items ?? []).map((item) => ({
            id: item.id,
            name: item.name,
          }))
        );
      })
      .catch(() => {
        if (!alive) return;
        setFallbackAccounts([]);
      });

    return () => {
      alive = false;
    };
  }, [accounts.length, open]);

  const expectedScopeOk = isIncomeImportScope(ledgerScope);

  const summary = React.useMemo(() => {
    const okRows = previewRows.filter((row) => row.status === "ok");
    const errorRows = previewRows.filter((row) => row.status === "error");

    return {
      totalRows: previewRows.length,
      okRows: okRows.length,
      errorRows: errorRows.length,
      totalAmount: okRows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
      accountMissing: okRows.filter((row) => !resolveIncomeAccountId(row.accountName, effectiveAccounts)).length,
    };
  }, [effectiveAccounts, previewRows]);

  React.useEffect(() => {
    if (!open) return;

    setStatus("idle");
    setFileName(defaultFilename || "");
    setCsvText("");
    setPreviewRows([]);
    setMessage("");
    setCommitMessage("");
  }, [defaultFilename, open]);

  if (!open) return null;

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) return;

    setStatus("reading");
    setMessage("");
    setCommitMessage("");
    setFileName(file.name);

    try {
      const lower = file.name.toLowerCase();
      const allowed = INCOME_IMPORT_ALLOWED_EXTENSIONS.some((extension) => lower.endsWith(extension));
      if (!allowed) {
        throw new Error("対応しているファイル形式は CSV / TSV / TXT / Excel（.xlsx, .xls）です。");
      }

      if (file.size > INCOME_IMPORT_MAX_FILE_SIZE_BYTES) {
        throw new Error(
          `ファイルサイズが大きすぎます。上限は ${formatImportFileSize(INCOME_IMPORT_MAX_FILE_SIZE_BYTES)} です。`
        );
      }

      const text = await readIncomeImportFileAsCsvText(file);
      setCsvText(text);
      runPreview(text, file.name);
    } catch (error) {
      setStatus("error");
      setPreviewRows([]);
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  function runPreview(sourceText = csvText, sourceFileName = fileName) {
    if (!expectedScopeOk) {
      setStatus("error");
      setMessage(`未対応の ledger_scope です: ${ledgerScope}`);
      return;
    }

    try {
      setCommitMessage("");

      const scopeValidation = validateLedgerCsvTextScope({
        currentScope: ledgerScope,
        csvText: sourceText,
      });

      if (!scopeValidation.ok) {
        setStatus("error");
        setPreviewRows([]);
        setMessage(
          `${label} 用テンプレートではない可能性があります。\n現在ページの ledger_scope は「${ledgerScope}」です。\n${scopeValidation.messageJa}`
        );
        return;
      }

      const rows = parseIncomeCsvPreviewRows({
        csvText: sourceText,
        ledgerScope,
      });

      if (rows.length > INCOME_IMPORT_MAX_ROWS) {
        throw new Error(
          `一度に取込できる行数は ${INCOME_IMPORT_MAX_ROWS.toLocaleString("ja-JP")} 行までです。ファイルを分割してください。`
        );
      }

      setPreviewRows(rows);
      setStatus("preview");
      setFileName(sourceFileName || defaultFilename || "");
      const errorRows = rows.filter((row) => row.status === "error").length;

      if (errorRows > 0) {
        setMessage(
          `${label} のCSVにエラー行があります。正式登録前に発生日・金額・収入区分・口座名を確認してください。対象行: ${rows.length} / エラー: ${errorRows}`
        );
      } else {
        setMessage(`${label} の取込プレビューを生成しました。対象行: ${rows.length} / OK: ${rows.length} / エラー: 0`);
      }
    } catch (error) {
      setStatus("error");
      setPreviewRows([]);
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleCommit() {
    if (status === "committing") return;

    const okRows = previewRows.filter((row) => row.status === "ok");
    if (okRows.length === 0 || summary.errorRows > 0) return;

    setStatus("committing");
    setCommitMessage("");

    try {
      const existing = await listTransactions("INCOME");
      const existingKeys = new Set(
        (existing.items ?? []).map((item) =>
          buildIncomeDedupeKey({
            accountName: item.accountName || "",
            amount: Number(item.amount || 0),
            occurredAt: item.occurredAt || "",
            memo: item.memo || "",
          })
        )
      );

      const seenInFile = new Set<string>();
      // Step109-Z1-H7D-INCOME-IMPORT-JOB-MARKER:
      // Client-side import batch id for post-commit page return banner/highlight.
      // Step109-Z1-H7D-FIX2-INCOME-IMPORT-JOB-MARKER:
      // Client-side import batch id for post-commit banner/highlight on income pages.
      const importJobId = `income-${ledgerScope}-${Date.now().toString(36)}`;
      let imported = 0;
      let duplicate = 0;
      let error = 0;
      let amount = 0;

      for (const row of okRows) {
        const accountId = resolveIncomeAccountId(row.accountName, effectiveAccounts);
        const occurredAt = new Date(normalizeDateInput(row.occurredAt));

        if (!accountId || Number.isNaN(occurredAt.getTime())) {
          error += 1;
          continue;
        }

        const memoForTransaction = buildIncomeImportedMemo({
          ledgerScope,
          category: row.incomeCategory,
          memo: row.memo,
          payer: row.payer,
          fileName: fileName || defaultFilename || "income-import.csv",
        });

        const dedupeKey = buildIncomeDedupeKey({
          accountName: row.accountName,
          amount: row.amount,
          occurredAt: row.occurredAt,
          memo: `${memoForTransaction} [income_import_job:${importJobId}]`,
        });

        if (existingKeys.has(dedupeKey) || seenInFile.has(dedupeKey)) {
          duplicate += 1;
          continue;
        }

        await createTransaction({
          accountId,
          categoryId: null,
          type: "OTHER",
          direction: "INCOME",
          amount: Number(row.amount || 0),
          currency: row.currency || "JPY",
          occurredAt: occurredAt.toISOString(),
          // Step109-Z1-H7D-FIX2A-F2-CREATE-TRANSACTION-MEMO-IMPORT-JOB: persist client import batch id for return banner/highlight.
          memo: `${memoForTransaction} [income_import_job:${importJobId}]`,
        });

        existingKeys.add(dedupeKey);
        seenInFile.add(dedupeKey);
        imported += 1;
        amount += Number(row.amount || 0);
      }

      setStatus("done");
      setCommitMessage(
        `${label} の正式登録が完了しました。登録: ${imported} / 重複: ${duplicate} / エラー: ${error} / 金額: ${formatJPY(amount)}`
      );

      await onCommitted?.({
        importJobId,
        imported,
        duplicate,
        error,
        amount,
      });
    } catch (error) {
      setStatus("error");
      setCommitMessage(error instanceof Error ? error.message : String(error));
    }
  }

  const canCommit =
    status !== "committing" &&
    summary.totalRows > 0 &&
    summary.okRows > 0 &&
    summary.errorRows === 0;

  const isErrorMessage = status === "error" || summary.errorRows > 0;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-8 py-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">{label}CSV/Excel取込</h2>
            <p className="mt-2 text-sm text-slate-600">
              ledger_scope = <span className="font-bold text-emerald-700">{ledgerScope}</span> のテンプレートだけを受け付けます。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            閉じる
          </button>
        </div>

        <div className="grid max-h-[calc(92vh-112px)] gap-5 overflow-y-auto p-8 lg:grid-cols-[1fr_1.25fr]">
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="text-base font-bold text-emerald-900">{label} 専用インポート</div>
              <p className="mt-2 text-sm font-medium leading-6 text-emerald-800">
                各ページのテンプレートダウンロードから取得したCSVを使用してください。
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt,.xlsx,.xls"
              className="hidden"
              onChange={handleFileSelected}
            />

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
              >
                ファイルを選択
              </button>
              <div className="text-sm font-medium text-slate-500">
                現在ファイル: <span className="text-slate-700">{fileName || "-"}</span>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800">
              {fileName || defaultFilename || `${ledgerScope}-template.csv`}
            </div>

            <textarea
              value={csvText}
              onChange={(event) => {
                setCsvText(event.target.value);
                setCommitMessage("");
              }}
              placeholder="CSV テキストを貼り付けることもできます。"
              className="mt-4 min-h-[280px] w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 font-mono text-sm leading-6 text-slate-950 outline-none transition focus:border-slate-400"
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => runPreview()}
                disabled={!csvText.trim() || status === "reading" || status === "committing"}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                開始導入検測
              </button>
              <button
                type="button"
                onClick={() => {
                  setCsvText("");
                  setPreviewRows([]);
                  setMessage("");
                  setCommitMessage("");
                  setStatus("idle");
                }}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                クリア
              </button>
            </div>

            {message ? (
              <div
                className={
                  isErrorMessage
                    ? "mt-4 whitespace-pre-line rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold leading-6 text-rose-700"
                    : "mt-4 whitespace-pre-line rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-700"
                }
              >
                {message}
              </div>
            ) : null}
          </section>

          <section className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-bold text-slate-950">Income Validation Result</div>
                  <p className="mt-1 text-sm text-slate-500">
                    ledger_scope・発生日・金額・収入区分・口座名を検証した結果です。
                  </p>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
                  {ledgerScope}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-bold text-slate-500">対象行数</div>
                  <div className="mt-2 text-2xl font-bold text-slate-950">{summary.totalRows}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-bold text-slate-500">OK / エラー</div>
                  <div className="mt-2 text-2xl font-bold text-slate-950">
                    {summary.okRows} / {summary.errorRows}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-bold text-slate-500">合計金額</div>
                  <div className="mt-2 text-2xl font-bold text-slate-950">{formatJPY(summary.totalAmount)}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-bold text-slate-500">口座未解決</div>
                  <div className="mt-2 text-2xl font-bold text-slate-950">{summary.accountMissing}</div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-bold text-slate-950">収入 Preview Table</div>
                  <p className="mt-1 text-sm text-slate-500">
                    日付・金額・収入区分・入金元・口座・メモを確認します。
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600">
                  rows: {previewRows.length}
                </span>
              </div>

              <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left">行</th>
                      <th className="px-4 py-3 text-left">日付</th>
                      <th className="px-4 py-3 text-right">金額</th>
                      <th className="px-4 py-3 text-left">区分</th>
                      <th className="px-4 py-3 text-left">入金元</th>
                      <th className="px-4 py-3 text-left">口座</th>
                      <th className="px-4 py-3 text-left">メモ</th>
                      <th className="px-4 py-3 text-left">状態</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {previewRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-sm font-medium text-slate-500">
                          まだ preview 行はありません。
                        </td>
                      </tr>
                    ) : (
                      previewRows.map((row) => (
                        <tr key={`${row.rowNo}-${row.memo}-${row.amount}`}>
                          <td className="px-4 py-3 text-slate-500">{row.rowNo}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{row.occurredAt}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-950">{formatJPY(row.amount)}</td>
                          <td className="px-4 py-3 text-slate-700">{row.incomeCategory || "-"}</td>
                          <td className="px-4 py-3 text-slate-700">{row.payer || "-"}</td>
                          <td className="px-4 py-3 text-slate-700">{row.accountName || "-"}</td>
                          <td className="px-4 py-3 text-slate-700">{row.memo || "-"}</td>
                          <td className="px-4 py-3">
                            {row.status === "ok" ? (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                OK
                              </span>
                            ) : (
                              <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                                {row.messages[0] || "エラー"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-bold text-slate-950">正式登録</div>
                  <p className="mt-1 text-sm text-slate-500">
                    H7B/H7C 以降で各ページからこの dialog を直接開き、登録後にページを自動更新します。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCommit}
                  disabled={!canCommit}
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {status === "committing" ? "登録中..." : "収入を正式登録"}
                </button>
              </div>

              {commitMessage ? (
                <div
                  className={
                    status === "error"
                      ? "mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700"
                      : "mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700"
                  }
                >
                  {commitMessage}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default IncomeImportDialog;
