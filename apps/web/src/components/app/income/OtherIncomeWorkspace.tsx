"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { IncomeRow } from "@/core/transactions/transactions";
import type { AccountItem } from "@/core/funds/api";
import type { TransactionCategoryItem } from "@/core/transactions/api";
import { createTransaction } from "@/core/transactions/api";
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
  deleteLoading: boolean;
  handleEditSave: (override?: { memo?: string }) => Promise<void>;
  handleDeleteSelected: () => Promise<void>;
  reloadRows: () => Promise<void>;
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

function normalizeOtherIncomeLookupText(value: string) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[（]/g, "(")
    .replace(/[）]/g, ")")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

function extractOtherIncomeCategoryMarker(value?: string | null) {
  const raw = String(value || "");
  const match = raw.match(/\[other-income-category:([^\]]+)\]/);
  return match?.[1]?.trim() || "";
}

function stripOtherIncomeMarkers(value?: string | null) {
  return String(value || "")
    .replace(/\s*\[other-income-category:[^\]]+\]\s*/g, " ")
    .replace(/\s*\[file-import:[^\]]+\]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getOtherIncomeCategoryLabel(row: IncomeRow) {
  const marker = extractOtherIncomeCategoryMarker(row.memo);
  return String(marker || row.label || "その他収入");
}

function getOtherIncomeMemo(row: IncomeRow) {
  return stripOtherIncomeMarkers(row.memo);
}

const OTHER_INCOME_STANDARD_CATEGORY_LABELS = [
  "サービス収入",
  "補助金・助成金",
  "返金・調整入金",
  "雑収入",
  "受取利息",
  "その他収入",
];

function normalizeOtherIncomeCategoryLabel(value?: string | null) {
  const raw = String(value || "").trim();
  return raw || "その他収入";
}

function buildOtherIncomeEditableMemo(args: {
  memo?: string | null;
  category?: string | null;
  previousCategory?: string | null;
}) {
  const category = normalizeOtherIncomeCategoryLabel(args.category);
  const previousCategory = normalizeOtherIncomeCategoryLabel(args.previousCategory);
  const rawMemo = stripOtherIncomeMarkers(args.memo || "");
  const normalizedMemo = rawMemo.trim();

  let visibleMemo = normalizedMemo || category;

  // Step109-Z1-C-FIX2:
  // If the memo was automatically generated from the previous category,
  // keep memo/category visually consistent when only the category is changed.
  // Custom user-written memo is preserved.
  if (
    previousCategory &&
    category !== previousCategory &&
    (normalizedMemo === previousCategory ||
      normalizedMemo.startsWith(`${previousCategory} /`) ||
      normalizedMemo.startsWith(`${previousCategory}／`))
  ) {
    visibleMemo = normalizedMemo.replace(previousCategory, category);
  }

  return `[other-income-category:${category}] ${visibleMemo}`.trim();
}

function buildOtherIncomeImportedMemo(args: {
  memo?: string | null;
  source?: string | null;
  category?: string | null;
  fileName?: string | null;
}) {
  const category = String(args.category || "その他収入").trim() || "その他収入";
  const visibleMemo = stripOtherIncomeMarkers(args.memo || category);
  const sourcePart = args.source ? ` / ${args.source}` : "";
  const filePart = args.fileName ? ` [file-import:${args.fileName}]` : "";
  return `[other-income-category:${category}] ${visibleMemo}${sourcePart}${filePart}`.trim();
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
  if (label === "CSV取込") return "その他収入CSV/Excel取込";
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


const OTHER_INCOME_IMPORT_ALLOWED_EXTENSIONS = [".csv", ".tsv", ".txt", ".xlsx", ".xls"];
const OTHER_INCOME_IMPORT_MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const OTHER_INCOME_IMPORT_MAX_ROWS = 2000;

type OtherIncomeDraftRow = {
  account: string;
  category: string;
  amount: number;
  occurredAt: string;
  memo: string;
  source: string;
  status: "ready" | "warning" | "error";
  messages: string[];
};

function splitOtherIncomeCsvLine(line: string) {
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
    if (ch === "," && !quote) {
      cells.push(current);
      current = "";
      continue;
    }
    current += ch;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function escapeOtherIncomeCsvCell(value: string) {
  const raw = String(value ?? "");
  if (raw.includes(",") || raw.includes('"') || raw.includes("\n") || raw.includes("\r")) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function normalizeOtherIncomeHeader(value: string) {
  const raw = String(value || "").trim();
  const map: Record<string, string> = {
    "口座": "account",
    "口座名": "account",
    "入金口座": "account",
    "account": "account",
    "accountName": "account",

    "カテゴリ": "category",
    "カテゴリー": "category",
    "収入カテゴリ": "category",
    "種別": "category",
    "区分": "category",
    "category": "category",

    "金額": "amount",
    "収入額": "amount",
    "amount": "amount",

    "発生日": "occurredAt",
    "日付": "occurredAt",
    "取引日": "occurredAt",
    "occurredAt": "occurredAt",

    "メモ": "memo",
    "摘要": "memo",
    "備考": "memo",
    "memo": "memo",

    "収入元": "source",
    "入金元": "source",
    "店舗": "source",
    "source": "source",
  };
  return map[raw] || raw;
}


function normalizeOtherIncomeDecodeLookup(value: string) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[（]/g, "(")
    .replace(/[）]/g, ")")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

function countOtherIncomeMojibake(value: string) {
  const text = String(value || "");
  const replacementCount = (text.match(/\uFFFD/g) || []).length;
  const halfWidthKatakanaCount = (text.match(/[\uFF61-\uFF9F]/g) || []).length;
  const brokenGlyphCount = (text.match(/[�･｡｢｣､]/g) || []).length;
  const classicEucAsCp932Count = (text.match(/･[ァ-ヶｦ-ﾟ]|｡[ァ-ヶｦ-ﾟ]|･ｵ|･ﾓ|･ｹ|｡ｼ/g) || []).length;

  return replacementCount * 12 + brokenGlyphCount * 8 + halfWidthKatakanaCount * 4 + classicEucAsCp932Count * 60;
}

function scoreOtherIncomeDecodedText(value: string) {
  const text = String(value || "");
  const japaneseCount = (text.match(/[ぁ-んァ-ヶ一-龠]/g) || []).length;
  const headerHits = [
    "口座",
    "収入カテゴリ",
    "収入区分",
    "金額",
    "発生日",
    "メモ",
    "収入元",
    "account",
    "category",
    "amount",
    "occurredAt",
  ].filter((token) => text.includes(token)).length;

  return headerHits * 1000 + japaneseCount * 4 - countOtherIncomeMojibake(text) * 100;
}

function scoreOtherIncomeDecodedCsv(
  value: string,
  context?: {
    accounts?: AccountItem[];
    txCategories?: TransactionCategoryItem[];
  }
) {
  const text = String(value || "");
  let score = scoreOtherIncomeDecodedText(text);

  const rows = parseOtherIncomeCsvDraft(text).slice(0, 120);
  const accounts = context?.accounts ?? [];
  const txCategories = context?.txCategories ?? [];

  const knownCategoryTokens = [
    "サービス",
    "補助金",
    "助成金",
    "返金",
    "調整",
    "商品売上",
    "イベント",
    "雑収入",
    "受取利息",
  ];

  for (const row of rows) {
    const category = String(row.category || "");
    const account = String(row.account || "");
    const memo = String(row.memo || "");

    const categoryMojibake = countOtherIncomeMojibake(category);
    const accountMojibake = countOtherIncomeMojibake(account);
    const memoMojibake = countOtherIncomeMojibake(memo);

    score -= categoryMojibake * 500;
    score -= accountMojibake * 200;
    score -= memoMojibake * 80;

    if (category && /[ぁ-んァ-ヶ一-龠]/.test(category)) score += 120;
    if (account && /[ぁ-んァ-ヶ一-龠]/.test(account)) score += 60;
    if (memo && /[ぁ-んァ-ヶ一-龠]/.test(memo)) score += 30;

    if (knownCategoryTokens.some((token) => category.includes(token) || memo.includes(token))) {
      score += 700;
    }

    const normalizedCategory = normalizeOtherIncomeDecodeLookup(category);
    if (normalizedCategory) {
      const categoryHit = txCategories.some((item) => {
        const name = normalizeOtherIncomeDecodeLookup(item.name);
        return name === normalizedCategory || name.includes(normalizedCategory) || normalizedCategory.includes(name);
      });
      if (categoryHit) score += 500;
    }

    const normalizedAccount = normalizeOtherIncomeDecodeLookup(account);
    if (normalizedAccount) {
      const accountHit = accounts.some((item) => {
        const name = normalizeOtherIncomeDecodeLookup(item.name);
        return name === normalizedAccount || name.includes(normalizedAccount) || normalizedAccount.includes(name);
      });
      if (accountHit) score += 250;
    }

    if (row.status !== "error") score += 20;
  }

  return score;
}

function safeDecodeOtherIncomeCsv(buffer: ArrayBuffer, encoding: string) {
  try {
    return new TextDecoder(encoding).decode(buffer);
  } catch {
    return "";
  }
}

function decodeOtherIncomeCsvBuffer(
  buffer: ArrayBuffer,
  context?: {
    accounts?: AccountItem[];
    txCategories?: TransactionCategoryItem[];
  }
) {
  const candidates = [
    { text: safeDecodeOtherIncomeCsv(buffer, "utf-8"), label: "UTF-8" },
    { text: safeDecodeOtherIncomeCsv(buffer, "shift_jis"), label: "Shift_JIS/CP932" },
    { text: safeDecodeOtherIncomeCsv(buffer, "euc-jp"), label: "EUC-JP" },
    { text: safeDecodeOtherIncomeCsv(buffer, "iso-2022-jp"), label: "ISO-2022-JP" },
  ].filter((item) => item.text);

  let best = candidates[0] ?? { text: "", label: "UTF-8" };
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const candidate of candidates) {
    const candidateScore = scoreOtherIncomeDecodedCsv(candidate.text, context);
    if (candidateScore > bestScore) {
      best = candidate;
      bestScore = candidateScore;
    }
  }

  return {
    text: best.text,
    encoding: best.label,
  };
}


function formatOtherIncomeImportFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.ceil(bytes / 1024)} KB`;
}

function escapeOtherIncomeCsvHeaderCell(value: string) {
  const raw = String(value ?? "");
  if (raw.includes(",") || raw.includes("\"") || raw.includes("\n")) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function normalizeOtherIncomeFileCsvHeaders(csvText: string) {
  const lines = String(csvText || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/);

  if (lines.length === 0) return csvText;

  const header = splitOtherIncomeCsvLine(lines[0]).map((cell) => String(cell || "").trim());
  const headerMap: Record<string, string> = {
    "口座": "account",
    "口座名": "account",
    "入金口座": "account",
    "accountName": "account",
    "account": "account",

    "カテゴリ": "category",
    "カテゴリー": "category",
    "収入カテゴリ": "category",
    "収入区分": "category",
    "種別": "category",
    "区分": "category",
    "category": "category",

    "金額": "amount",
    "収入額": "amount",
    "amount": "amount",

    "発生日": "occurredAt",
    "日付": "occurredAt",
    "取引日": "occurredAt",
    "occurredAt": "occurredAt",

    "メモ": "memo",
    "摘要": "memo",
    "備考": "memo",
    "memo": "memo",

    "収入元": "source",
    "入金元": "source",
    "店舗": "source",
    "source": "source",
  };

  const normalizedHeader = header.map((cell) => headerMap[cell] || normalizeOtherIncomeHeader(cell));
  const changed = normalizedHeader.join(",") !== header.join(",");

  if (!changed) return csvText;

  return [
    normalizedHeader.map(escapeOtherIncomeCsvHeaderCell).join(","),
    ...lines.slice(1),
  ].join("\n");
}

async function readOtherIncomeFileAsCsvText(file: File) {
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


function parseOtherIncomeCsvDraft(csvText: string): OtherIncomeDraftRow[] {
  const lines = String(csvText || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const first = splitOtherIncomeCsvLine(lines[0]).map(normalizeOtherIncomeHeader);
  const hasHeader =
    first.includes("account") ||
    first.includes("category") ||
    first.includes("amount") ||
    first.includes("occurredAt");

  const header = hasHeader ? first : ["account", "category", "amount", "occurredAt", "memo", "source"];
  const body = hasHeader ? lines.slice(1) : lines;

  const index = {
    account: header.indexOf("account"),
    category: header.indexOf("category"),
    amount: header.indexOf("amount"),
    occurredAt: header.indexOf("occurredAt"),
    memo: header.indexOf("memo"),
    source: header.indexOf("source"),
  };

  return body.map((line) => {
    const cells = splitOtherIncomeCsvLine(line);
    const account = index.account >= 0 ? String(cells[index.account] || "").trim() : "";
    const category = index.category >= 0 ? String(cells[index.category] || "").trim() : "";
    const amountRaw = index.amount >= 0 ? String(cells[index.amount] || "").replace(/[¥,\s]/g, "") : "";
    const amount = Number(amountRaw || 0);
    const occurredAt = index.occurredAt >= 0 ? String(cells[index.occurredAt] || "").trim() : "";
    const memo = index.memo >= 0 ? String(cells[index.memo] || "").trim() : "";
    const source = index.source >= 0 ? String(cells[index.source] || "").trim() : "";

    const messages: string[] = [];
    if (!account) messages.push("口座が未指定のため既定口座を使用します");
    if (!category) messages.push("収入カテゴリが未指定のため既定カテゴリを使用します");
    if (!Number.isFinite(amount) || amount <= 0) messages.push("金額が不正です");
    if (!occurredAt || Number.isNaN(new Date(occurredAt).getTime())) messages.push("発生日が不正です");
    if (!memo) messages.push("メモの入力を推奨します");

    const hasError = messages.some((message) => message.includes("不正") || message.includes("未指定"));

    return {
      account,
      category,
      amount,
      occurredAt,
      memo,
      source,
      status: hasError ? "error" : messages.length > 0 ? "warning" : "ready",
      messages,
    };
  });
}

function resolveOtherIncomeAccountId(accountName: string, accounts: AccountItem[]) {
  const raw = String(accountName || "").trim();
  if (!raw) return "";

  const normalizedRaw = normalizeOtherIncomeLookupText(raw);

  const exact = accounts.find((item) => normalizeOtherIncomeLookupText(item.name) === normalizedRaw);
  if (exact) return exact.id;

  const loose = accounts.find((item) => {
    const name = normalizeOtherIncomeLookupText(item.name);
    return name.includes(normalizedRaw) || normalizedRaw.includes(name);
  });

  return loose?.id || "";
}

function resolveOtherIncomeCategoryId(categoryName: string, categories: TransactionCategoryItem[]) {
  const raw = String(categoryName || "").trim();
  if (!raw) return "";

  const normalizedRaw = normalizeOtherIncomeLookupText(raw);

  const exact = categories.find((item) => normalizeOtherIncomeLookupText(item.name) === normalizedRaw);
  if (exact) return exact.id;

  const loose = categories.find((item) => {
    const name = normalizeOtherIncomeLookupText(item.name);
    return name.includes(normalizedRaw) || normalizedRaw.includes(name);
  });

  if (loose) return loose.id;

  const alias = (() => {
    if (raw.includes("サービス")) return "サービス";
    if (raw.includes("補助金") || raw.includes("助成金")) return "補助";
    if (raw.includes("返金") || raw.includes("調整")) return "調整";
    if (raw.includes("雑")) return "雑";
    if (raw.includes("手数料")) return "手数料";
    return "";
  })();

  if (alias) {
    const aliasNormalized = normalizeOtherIncomeLookupText(alias);
    const aliasHit = categories.find((item) => normalizeOtherIncomeLookupText(item.name).includes(aliasNormalized));
    if (aliasHit) return aliasHit.id;
  }

  return "";
}

function buildOtherIncomeTaxCsv(rows: IncomeRow[]) {
  const header = ["発生日", "収入区分", "金額", "口座", "収入元", "メモ"];
  const lines = rows.map((row) =>
    [
      row.date || "",
      getOtherIncomeCategoryLabel(row),
      String(Number(row.amount || 0)),
      row.account || "",
      row.store || "",
      getOtherIncomeMemo(row) || "",
    ].map(escapeOtherIncomeCsvCell).join(",")
  );

  return [header.join(","), ...lines].join("\r\n");
}

function downloadOtherIncomeTextFile(args: { filename: string; text: string }) {
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

type OtherIncomeDashboardRange = "30d" | "90d" | "12m" | "custom";
type OtherIncomeDashboardGranularity = "day" | "week" | "month";

type OtherIncomeDashboardPoint = {
  key: string;
  label: string;
  amount: number;
  count: number;
  start: Date;
  end: Date;
};

function getOtherIncomeRangeDays(range: OtherIncomeDashboardRange) {
  if (range === "12m") return 365;
  if (range === "90d") return 90;
  return 30;
}

function getOtherIncomeRangeLabel(range: OtherIncomeDashboardRange) {
  if (range === "custom") return "カスタム期間";
  if (range === "12m") return "直近12ヶ月";
  if (range === "90d") return "直近90日";
  return "直近30日";
}

function getOtherIncomeRangeDefaultGranularity(range: OtherIncomeDashboardRange): OtherIncomeDashboardGranularity {
  if (range === "30d") return "day";
  return "week";
}

function getOtherIncomeAutoGranularityForDays(days: number): OtherIncomeDashboardGranularity {
  if (!Number.isFinite(days) || days <= 31) return "day";
  if (days <= 180) return "week";
  return "month";
}

function parseOtherIncomeDateInput(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const date = new Date(`${raw}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : cloneOtherIncomeDate(date);
}

function formatOtherIncomeDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatOtherIncomeCreateDateInput(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}\/\d{2}\/\d{2}/.test(raw)) return raw.slice(0, 10).replace(/\//g, "-");
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw.slice(0, 10);

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw.slice(0, 10);

  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

function formatOtherIncomeCreateDateDisplay(value?: string | null) {
  const input = formatOtherIncomeCreateDateInput(value);
  return input ? input.replace(/-/g, "/") : "-";
}

function getOtherIncomeInclusiveRangeDays(start: Date, end: Date) {
  const diff = cloneOtherIncomeDate(end).getTime() - cloneOtherIncomeDate(start).getTime();
  return Math.max(1, Math.round(diff / 86400000) + 1);
}

function getOtherIncomeGranularityLabel(granularity: OtherIncomeDashboardGranularity) {
  if (granularity === "month") return "月別";
  if (granularity === "week") return "週別";
  return "日別";
}

function cloneOtherIncomeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addOtherIncomeDays(date: Date, days: number) {
  const next = cloneOtherIncomeDate(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addOtherIncomeMonths(date: Date, months: number) {
  const next = new Date(date.getFullYear(), date.getMonth(), 1);
  next.setMonth(next.getMonth() + months);
  return next;
}

function startOfOtherIncomeWeek(date: Date) {
  const next = cloneOtherIncomeDate(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

function startOfOtherIncomeMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatOtherIncomeDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatOtherIncomeShortDate(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatOtherIncomeMonthLabel(date: Date) {
  return `${date.getFullYear()}/${date.getMonth() + 1}`;
}

function getOtherIncomeDashboardLatestDate(rows: IncomeRow[]) {
  const maxMs = rows.reduce((max, row) => Math.max(max, parseOtherIncomeDateMs(row)), 0);
  return maxMs > 0 ? cloneOtherIncomeDate(new Date(maxMs)) : cloneOtherIncomeDate(new Date());
}

function getOtherIncomeRangeStartDate(rows: IncomeRow[], range: OtherIncomeDashboardRange) {
  const latest = getOtherIncomeDashboardLatestDate(rows);
  return addOtherIncomeDays(latest, -(getOtherIncomeRangeDays(range) - 1));
}

function isOtherIncomeRowInDashboardRange(row: IncomeRow, rows: IncomeRow[], range: OtherIncomeDashboardRange) {
  const ms = parseOtherIncomeDateMs(row);
  if (ms <= 0) return false;
  const current = cloneOtherIncomeDate(new Date(ms));
  const latest = getOtherIncomeDashboardLatestDate(rows);
  const start = getOtherIncomeRangeStartDate(rows, range);
  return current.getTime() >= start.getTime() && current.getTime() <= latest.getTime();
}

function getOtherIncomeBucketStart(date: Date, granularity: OtherIncomeDashboardGranularity) {
  if (granularity === "month") return startOfOtherIncomeMonth(date);
  if (granularity === "week") return startOfOtherIncomeWeek(date);
  return cloneOtherIncomeDate(date);
}

function getOtherIncomeBucketEnd(start: Date, granularity: OtherIncomeDashboardGranularity) {
  if (granularity === "month") return addOtherIncomeDays(addOtherIncomeMonths(start, 1), -1);
  if (granularity === "week") return addOtherIncomeDays(start, 6);
  return cloneOtherIncomeDate(start);
}

function getOtherIncomeBucketLabel(start: Date, end: Date, granularity: OtherIncomeDashboardGranularity) {
  if (granularity === "month") return formatOtherIncomeMonthLabel(start);
  if (granularity === "week") return `${formatOtherIncomeShortDate(start)}–${formatOtherIncomeShortDate(end)}`;
  return formatOtherIncomeShortDate(start);
}

function getOtherIncomeBucketStep(start: Date, granularity: OtherIncomeDashboardGranularity) {
  if (granularity === "month") return addOtherIncomeMonths(start, 1);
  if (granularity === "week") return addOtherIncomeDays(start, 7);
  return addOtherIncomeDays(start, 1);
}

function buildOtherIncomeDashboardSeries(
  rows: IncomeRow[],
  range: OtherIncomeDashboardRange,
  granularity: OtherIncomeDashboardGranularity,
  customBounds?: { start: Date; end: Date } | null
): OtherIncomeDashboardPoint[] {
  const latest = customBounds?.end ? cloneOtherIncomeDate(customBounds.end) : getOtherIncomeDashboardLatestDate(rows);
  const rawStart = customBounds?.start ? cloneOtherIncomeDate(customBounds.start) : getOtherIncomeRangeStartDate(rows, range);
  const start = getOtherIncomeBucketStart(rawStart, granularity);
  const buckets = new Map<string, OtherIncomeDashboardPoint>();

  let cursor = cloneOtherIncomeDate(start);
  let guard = 0;
  while (cursor.getTime() <= latest.getTime() && guard < 500) {
    const bucketStart = getOtherIncomeBucketStart(cursor, granularity);
    const bucketEnd = getOtherIncomeBucketEnd(bucketStart, granularity);
    const key = formatOtherIncomeDateKey(bucketStart);
    buckets.set(key, {
      key,
      label: getOtherIncomeBucketLabel(bucketStart, bucketEnd, granularity),
      amount: 0,
      count: 0,
      start: bucketStart,
      end: bucketEnd,
    });
    cursor = getOtherIncomeBucketStep(bucketStart, granularity);
    guard += 1;
  }

  for (const row of rows) {
    const ms = parseOtherIncomeDateMs(row);
    if (ms <= 0) continue;
    const rowDate = cloneOtherIncomeDate(new Date(ms));
    if (rowDate.getTime() < rawStart.getTime() || rowDate.getTime() > latest.getTime()) continue;

    const bucketStart = getOtherIncomeBucketStart(rowDate, granularity);
    const key = formatOtherIncomeDateKey(bucketStart);
    const bucket = buckets.get(key);
    if (!bucket) continue;

    bucket.amount += Number(row.amount || 0);
    bucket.count += 1;
  }

  return Array.from(buckets.values()).sort((a, b) => a.start.getTime() - b.start.getTime());
}

function getOtherIncomeNiceChartMax(points: OtherIncomeDashboardPoint[]) {
  const max = Math.max(0, ...points.map((point) => Number(point.amount || 0)));
  if (max <= 0) return 10000;
  const power = Math.pow(10, Math.max(3, Math.floor(Math.log10(max))));
  return Math.ceil(max / power) * power;
}

function getOtherIncomePeakPoint(points: OtherIncomeDashboardPoint[]) {
  return points.reduce<OtherIncomeDashboardPoint | null>((peak, point) => {
    if (!peak || point.amount > peak.amount) return point;
    return peak;
  }, null);
}

function getOtherIncomeXAxisLabelEvery(points: OtherIncomeDashboardPoint[]) {
  if (points.length <= 8) return 1;
  if (points.length <= 18) return 2;
  if (points.length <= 36) return 5;
  if (points.length <= 60) return 8;
  return 12;
}

function buildOtherIncomeSegmentedLinePaths<
  T extends { x: number; y: number | null; amount: number; isPartialLatest?: boolean }
>(plot: T[]) {
  const segments: T[][] = [];
  let current: T[] = [];

  for (const point of plot) {
    // Step109-Z1-E-FIX3-v2:
    // Latest partial week/month should be shown as a dot/bar,
    // but not connected into the trend line because the period is not complete.
    if (point.amount > 0 && point.y != null && !point.isPartialLatest) {
      current.push(point);
      continue;
    }

    if (current.length > 0) {
      segments.push(current);
      current = [];
    }
  }

  if (current.length > 0) {
    segments.push(current);
  }

  return segments.map((segment) =>
    segment.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")
  );
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
    deleteLoading,
    handleEditSave,
    handleDeleteSelected,
    reloadRows,
  } = props;

  const [sortMode, setSortMode] = React.useState<OtherIncomeSortMode>("date_desc");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [drawerRow, setDrawerRow] = React.useState<IncomeRow | null>(null);
  const [editCategoryLabel, setEditCategoryLabel] = React.useState("その他収入");
  const [otherIncomeSourceFilter, setOtherIncomeSourceFilter] = React.useState("all");
  const [otherIncomeDashboardRange, setOtherIncomeDashboardRange] =
    React.useState<OtherIncomeDashboardRange>("30d");
  const [otherIncomeCustomStartDate, setOtherIncomeCustomStartDate] = React.useState("");
  const [otherIncomeCustomEndDate, setOtherIncomeCustomEndDate] = React.useState("");
  const [otherIncomeDraftStartDate, setOtherIncomeDraftStartDate] = React.useState("");
  const [otherIncomeDraftEndDate, setOtherIncomeDraftEndDate] = React.useState("");
  const [otherIncomeStatusGranularity, setOtherIncomeStatusGranularity] =
    React.useState<OtherIncomeDashboardGranularity>("day");
  const [otherIncomeTrendHoverKey, setOtherIncomeTrendHoverKey] = React.useState<string | null>(null);
  const [otherIncomeStatusHoverKey, setOtherIncomeStatusHoverKey] = React.useState<string | null>(null);
  const otherIncomeFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [importLoading, setImportLoading] = React.useState(false);
  const [importFeedback, setImportFeedback] = React.useState<{
    kind: "success" | "error";
    title: string;
    message: string;
    importedRows?: number;
    blockedRows?: number;
    importedAmount?: number;
  } | null>(null);

  const totalAmount = React.useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    [rows]
  );
  const categorySummary = React.useMemo(() => buildOtherIncomeCategorySummary(rows), [rows]);
  const otherIncomeEditCategoryOptions = React.useMemo(() => {
    const labels = new Set<string>();

    for (const label of OTHER_INCOME_STANDARD_CATEGORY_LABELS) labels.add(label);
    for (const item of categorySummary) labels.add(item.label);
    for (const item of txCategories) {
      if (item.direction !== "INCOME") continue;
      const name = String(item.name || "").trim();
      if (!name) continue;
      if (name.includes("現金")) continue;
      if (name.includes("店舗注文")) continue;
      labels.add(name);
    }

    return Array.from(labels);
  }, [categorySummary, txCategories]);
  const accountCount = React.useMemo(
    () => new Set(rows.map((row) => String(row.account || "-"))).size,
    [rows]
  );

  const otherIncomeSourceOptions = React.useMemo(() => {
    const values = new Set<string>();

    for (const row of rows) {
      const source = String(row.store || "").trim();
      if (source) values.add(source);
    }

    return Array.from(values).sort((a, b) => a.localeCompare(b, "ja-JP"));
  }, [rows]);


  const otherIncomeDraftRangeIsValid = React.useMemo(() => {
    return Boolean(
      parseOtherIncomeDateInput(otherIncomeDraftStartDate) &&
        parseOtherIncomeDateInput(otherIncomeDraftEndDate)
    );
  }, [otherIncomeDraftStartDate, otherIncomeDraftEndDate]);

  const otherIncomeDraftRangeDirty =
    otherIncomeDraftStartDate !== otherIncomeCustomStartDate ||
    otherIncomeDraftEndDate !== otherIncomeCustomEndDate;

  const otherIncomeCustomRangeBounds = React.useMemo(() => {
    const fallbackEnd = getOtherIncomeDashboardLatestDate(rows);
    const fallbackStart = addOtherIncomeDays(fallbackEnd, -29);

    const parsedStart = parseOtherIncomeDateInput(otherIncomeCustomStartDate) ?? fallbackStart;
    const parsedEnd = parseOtherIncomeDateInput(otherIncomeCustomEndDate) ?? fallbackEnd;

    const start = parsedStart.getTime() <= parsedEnd.getTime() ? parsedStart : parsedEnd;
    const end = parsedStart.getTime() <= parsedEnd.getTime() ? parsedEnd : parsedStart;

    return { start, end };
  }, [rows, otherIncomeCustomStartDate, otherIncomeCustomEndDate]);

  const otherIncomeDashboardRangeDays = React.useMemo(() => {
    if (otherIncomeDashboardRange === "custom") {
      return getOtherIncomeInclusiveRangeDays(
        otherIncomeCustomRangeBounds.start,
        otherIncomeCustomRangeBounds.end
      );
    }

    return getOtherIncomeRangeDays(otherIncomeDashboardRange);
  }, [otherIncomeDashboardRange, otherIncomeCustomRangeBounds]);

  const otherIncomeDashboardRangeLabel = React.useMemo(() => {
    if (otherIncomeDashboardRange !== "custom") {
      return getOtherIncomeRangeLabel(otherIncomeDashboardRange);
    }

    return `${formatOtherIncomeShortDate(otherIncomeCustomRangeBounds.start)}–${formatOtherIncomeShortDate(
      otherIncomeCustomRangeBounds.end
    )}`;
  }, [otherIncomeDashboardRange, otherIncomeCustomRangeBounds]);

  const otherIncomeDashboardRows = React.useMemo(() => {
    return rows.filter((row) => {
      const source = String(row.store || "").trim();
      const sourceOk = otherIncomeSourceFilter === "all" || source === otherIncomeSourceFilter;
      if (!sourceOk) return false;

      if (otherIncomeDashboardRange === "custom") {
        const ms = parseOtherIncomeDateMs(row);
        if (ms <= 0) return false;
        const rowDate = cloneOtherIncomeDate(new Date(ms));
        return (
          rowDate.getTime() >= otherIncomeCustomRangeBounds.start.getTime() &&
          rowDate.getTime() <= otherIncomeCustomRangeBounds.end.getTime()
        );
      }

      return isOtherIncomeRowInDashboardRange(row, rows, otherIncomeDashboardRange);
    });
  }, [rows, otherIncomeSourceFilter, otherIncomeDashboardRange, otherIncomeCustomRangeBounds]);

  const otherIncomeDashboardAmount = React.useMemo(
    () => otherIncomeDashboardRows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    [otherIncomeDashboardRows]
  );

  const otherIncomeDashboardAccountCount = React.useMemo(
    () => new Set(otherIncomeDashboardRows.map((row) => String(row.account || "-"))).size,
    [otherIncomeDashboardRows]
  );

  const otherIncomeDashboardLatestDate = getLatestOtherIncomeDate(otherIncomeDashboardRows);
  const otherIncomeDashboardAverage = formatOtherIncomeAverage(
    otherIncomeDashboardRows,
    otherIncomeDashboardAmount
  );

  const otherIncomeTrendGranularity =
    otherIncomeDashboardRange === "custom"
      ? getOtherIncomeAutoGranularityForDays(otherIncomeDashboardRangeDays)
      : getOtherIncomeRangeDefaultGranularity(otherIncomeDashboardRange);
  const otherIncomeTrendPoints = React.useMemo(
    () => buildOtherIncomeDashboardSeries(
      otherIncomeDashboardRows,
      otherIncomeDashboardRange,
      otherIncomeTrendGranularity,
      otherIncomeDashboardRange === "custom" ? otherIncomeCustomRangeBounds : null
    ),
    [otherIncomeDashboardRows, otherIncomeDashboardRange, otherIncomeTrendGranularity, otherIncomeCustomRangeBounds]
  );

  const otherIncomeStatusPoints = React.useMemo(
    () => buildOtherIncomeDashboardSeries(
      otherIncomeDashboardRows,
      otherIncomeDashboardRange,
      otherIncomeStatusGranularity,
      otherIncomeDashboardRange === "custom" ? otherIncomeCustomRangeBounds : null
    ),
    [otherIncomeDashboardRows, otherIncomeDashboardRange, otherIncomeStatusGranularity, otherIncomeCustomRangeBounds]
  );

  const otherIncomeTrendMax = getOtherIncomeNiceChartMax(otherIncomeTrendPoints);
  const otherIncomeStatusMax = getOtherIncomeNiceChartMax(otherIncomeStatusPoints);
  const otherIncomePeakTrendPoint = getOtherIncomePeakPoint(otherIncomeTrendPoints);
  const otherIncomePeakStatusPoint = getOtherIncomePeakPoint(otherIncomeStatusPoints);
  const otherIncomeLatestTrendPoint = otherIncomeTrendPoints[otherIncomeTrendPoints.length - 1] ?? null;
  const otherIncomeLatestStatusPoint = otherIncomeStatusPoints[otherIncomeStatusPoints.length - 1] ?? null;



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
  
  // Step109-Z1-E-FIX7:
  // Keep custom-range date inputs as draft state.
  // KPI / charts continue to follow the applied state (otherIncomeDraftStartDate / otherIncomeDraftEndDate)
  // until the user clicks "確定".
  const [otherIncomeDraftCustomStartDate, setOtherIncomeDraftCustomStartDate] = useState(otherIncomeDraftStartDate);
  const [otherIncomeDraftCustomEndDate, setOtherIncomeDraftCustomEndDate] = useState(otherIncomeDraftEndDate);

  useEffect(() => {
    setOtherIncomeDraftCustomStartDate(otherIncomeDraftStartDate);
    setOtherIncomeDraftCustomEndDate(otherIncomeDraftEndDate);
  }, [otherIncomeDraftStartDate, otherIncomeDraftEndDate]);

  const isOtherIncomeCustomRangeValid =
    !!otherIncomeDraftCustomStartDate &&
    !!otherIncomeDraftCustomEndDate &&
    otherIncomeDraftCustomStartDate <= otherIncomeDraftCustomEndDate;

  const isOtherIncomeCustomRangeDirty =
    otherIncomeDraftCustomStartDate !== otherIncomeDraftStartDate ||
    otherIncomeDraftCustomEndDate !== otherIncomeDraftEndDate;

  const handleOtherIncomeCustomRangeCancel = () => {
    setOtherIncomeDraftCustomStartDate(otherIncomeDraftStartDate);
    setOtherIncomeDraftCustomEndDate(otherIncomeDraftEndDate);
  };

  const handleOtherIncomeCustomRangeApply = () => {
    if (!isOtherIncomeCustomRangeValid) return;
    setOtherIncomeDraftStartDate(otherIncomeDraftCustomStartDate);
    setOtherIncomeDraftEndDate(otherIncomeDraftCustomEndDate);
  };

  const otherIncomeCreateCategoryOptions = useMemo(() => {
    const discovered = Array.from(
      new Set(
        (rows || [])
          .map((row) => normalizeOtherIncomeCategoryLabel(getOtherIncomeCategoryLabel(row)))
          .filter(Boolean)
      )
    );

    return Array.from(
      new Set([
        ...OTHER_INCOME_STANDARD_CATEGORY_LABELS,
        ...discovered,
      ])
    );
  }, [rows]);


  // Step109-Z1-E-FIX7B:

  const [otherIncomeCreateCategoryLabel, setOtherIncomeCreateCategoryLabel] = React.useState(
    OTHER_INCOME_STANDARD_CATEGORY_LABELS[0] || "その他収入"
  );

    // Step109-Z1-E-FIX7D-v3:
  // Persist manual create category through [other-income-category:*] memo marker.
  // The backend categoryId can remain a generic OTHER category; table/summary/filter use this marker.
  const submitOtherIncomeCreateWithCategory = React.useCallback(async () => {
    const categoryLabel =
      otherIncomeCreateCategoryLabel || OTHER_INCOME_STANDARD_CATEGORY_LABELS[0] || "その他収入";

    await submitCreate({
      memo: buildOtherIncomeEditableMemo({
        memo,
        category: categoryLabel,
      }),
    });
  }, [memo, otherIncomeCreateCategoryLabel, submitCreate]);

  // Step109-Z1-E-FIX7D-v4: repaired malformed drawer save onClick after replacing legacy inline handler.
  const handleOtherIncomeDrawerSave = React.useCallback(async () => {
    if (drawerMode === "create") {
      await submitOtherIncomeCreateWithCategory();
      return;
    }

    await handleEditSave();
  }, [drawerMode, submitOtherIncomeCreateWithCategory, handleEditSave]);

const pageWindow = buildOtherIncomePageWindow(safeCurrentPage, totalPages);
  const filteredAmount = filteredRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const activeOtherIncomeCategoryLabel = categoryFilter === "all" ? "全区分" : categoryFilter;
  const filteredCategorySummary = React.useMemo(
    () => buildOtherIncomeCategorySummary(filteredRows),
    [filteredRows]
  );

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
    if (otherIncomeSourceFilter === "all") return;
    if (!otherIncomeSourceOptions.includes(otherIncomeSourceFilter)) {
      setOtherIncomeSourceFilter("all");
    }
  }, [otherIncomeSourceFilter, otherIncomeSourceOptions]);

  React.useEffect(() => {
    if (otherIncomeDashboardRange !== "custom") {
      setOtherIncomeStatusGranularity(getOtherIncomeRangeDefaultGranularity(otherIncomeDashboardRange));
      return;
    }

    setOtherIncomeStatusGranularity(getOtherIncomeAutoGranularityForDays(otherIncomeDashboardRangeDays));
  }, [otherIncomeDashboardRange, otherIncomeDashboardRangeDays]);

  React.useEffect(() => {
    if (otherIncomeDashboardRange !== "custom") return;

    const latest = getOtherIncomeDashboardLatestDate(rows);
    const start = addOtherIncomeDays(latest, -29);
    const defaultStart = formatOtherIncomeDateInput(start);
    const defaultEnd = formatOtherIncomeDateInput(latest);

    const appliedStart = otherIncomeCustomStartDate || defaultStart;
    const appliedEnd = otherIncomeCustomEndDate || defaultEnd;

    if (!otherIncomeCustomStartDate) {
      setOtherIncomeCustomStartDate(appliedStart);
    }
    if (!otherIncomeCustomEndDate) {
      setOtherIncomeCustomEndDate(appliedEnd);
    }
    if (!otherIncomeDraftStartDate) {
      setOtherIncomeDraftStartDate(appliedStart);
    }
    if (!otherIncomeDraftEndDate) {
      setOtherIncomeDraftEndDate(appliedEnd);
    }
  }, [
    otherIncomeDashboardRange,
    rows,
    otherIncomeCustomStartDate,
    otherIncomeCustomEndDate,
    otherIncomeDraftStartDate,
    otherIncomeDraftEndDate,
  ]);

  React.useEffect(() => {
    if (action !== "edit") return;
    if (!selectedRow) return;
    setDrawerRow(selectedRow);
    setEditAmount(String(selectedRow.amount || ""));
    setEditMemo(getOtherIncomeMemo(selectedRow));
    setEditCategoryLabel(getOtherIncomeCategoryLabel(selectedRow));
  }, [action, selectedRow, setEditAmount, setEditMemo]);

  function openEdit(row: IncomeRow) {
    onSelectRow(row.id);
    setEditAmount(String(row.amount || ""));
    setEditMemo(getOtherIncomeMemo(row));
    setEditCategoryLabel(getOtherIncomeCategoryLabel(row));
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
    await handleEditSave({
      memo: buildOtherIncomeEditableMemo({
        memo: editMemo,
        category: editCategoryLabel,
        previousCategory: editingRow ? getOtherIncomeCategoryLabel(editingRow) : null,
      }),
    });
    await reloadRows();
    setCategoryFilter("all");
    setCurrentPage(1);
    closeDrawer();
  }

  async function deleteSelectedOtherIncome() {
    if (!editingRow) return;
    onSelectRow(editingRow.id);
    await handleDeleteSelected();
    await reloadRows();
    setCategoryFilter("all");
    setCurrentPage(1);
    closeDrawer();
  }


  async function handleOtherIncomeFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file || importLoading) return;

    setImportLoading(true);
    setImportFeedback(null);

    try {
      const lowerFileName = file.name.toLowerCase();
      const allowedExtension = OTHER_INCOME_IMPORT_ALLOWED_EXTENSIONS.some((extension) =>
        lowerFileName.endsWith(extension)
      );

      if (!allowedExtension) {
        throw new Error("対応しているファイル形式は CSV / TSV / TXT / Excel（.xlsx, .xls）です。");
      }

      if (file.size > OTHER_INCOME_IMPORT_MAX_FILE_SIZE_BYTES) {
        throw new Error(
          `ファイルサイズが大きすぎます。上限は ${formatOtherIncomeImportFileSize(OTHER_INCOME_IMPORT_MAX_FILE_SIZE_BYTES)} です。`
        );
      }

      const rawCsv = await readOtherIncomeFileAsCsvText(file);
      const normalizedCsv = normalizeOtherIncomeFileCsvHeaders(rawCsv);
      const draftRows = parseOtherIncomeCsvDraft(normalizedCsv);
      const validRows = draftRows.filter((row) => row.status !== "error");

      if (draftRows.length === 0) {
        throw new Error("取込できる行がありません。CSV / Excel の内容を確認してください。");
      }

      if (draftRows.length > OTHER_INCOME_IMPORT_MAX_ROWS) {
        throw new Error(
          `一度に取込できる行数は ${OTHER_INCOME_IMPORT_MAX_ROWS.toLocaleString("ja-JP")} 行までです。ファイルを分割して再度取込してください。`
        );
      }
      if (validRows.length === 0) {
        throw new Error(draftRows.flatMap((row) => row.messages)[0] || "有効なその他収入行がありません。");
      }

      let importedRows = 0;
      let blockedRows = draftRows.length - validRows.length;
      let importedAmount = 0;

      for (const row of validRows) {
        const accountIdForRow =
          resolveOtherIncomeAccountId(row.account, accounts) || accountId || accounts[0]?.id || null;
        const categoryIdForRow =
          resolveOtherIncomeCategoryId(row.category, txCategories) || categoryId || txCategories[0]?.id || null;
        const occurredAt = new Date(row.occurredAt);

        if (!Number.isFinite(Number(row.amount || 0)) || Number(row.amount || 0) <= 0 || Number.isNaN(occurredAt.getTime())) {
          blockedRows += 1;
          continue;
        }

        await createTransaction({
          accountId: accountIdForRow,
          categoryId: categoryIdForRow,
          type: "OTHER",
          direction: "INCOME",
          amount: Number(row.amount || 0),
          currency: "JPY",
          occurredAt: occurredAt.toISOString(),
          memo: buildOtherIncomeImportedMemo({
            memo: row.memo,
            source: row.source,
            category: row.category || "その他収入",
            fileName: file.name,
          }),
        });

        importedRows += 1;
        importedAmount += Number(row.amount || 0);
      }

      await reloadRows();
      setCurrentPage(1);

      setImportFeedback({
        kind: importedRows > 0 ? "success" : "error",
        title: importedRows > 0 ? "その他収入CSVの取込が完了しました" : "取込できる行がありませんでした",
        message:
          importedRows > 0
            ? `CSV からその他収入を登録し、一覧を再取得しました。Excel/CSV 解析方式: Cash Income parity reader`
            : "金額・発生日を確認してください。口座名・収入カテゴリは一致しない場合でも取込し、区分はメモ内マーカーで保持します。",
        importedRows,
        blockedRows,
        importedAmount,
      });
    } catch (e: unknown) {
      setImportFeedback({
        kind: "error",
        title: "その他収入CSVの取込に失敗しました",
        message: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setImportLoading(false);
    }
  }

  function handleOtherIncomeTaxExport() {
    const csv = buildOtherIncomeTaxCsv(filteredRows);
    const date = new Date();
    const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const suffix = categoryFilter === "all" ? "all" : "filtered";
    downloadOtherIncomeTextFile({
      filename: `other-income-tax-export-${suffix}-${stamp}.csv`,
      text: csv,
    });
  }

  const normalizedActions = sidebarActions.map((item) => ({
    ...item,
    label: getOtherIncomeActionLabel(item.label),
    href: getOtherIncomeActionHref({ item, lang }),
  }));

  return (
    <div className="space-y-6" data-scope="other-income-workspace-productized-z1a">
      <section
        data-scope="other-income-top-dashboard-merged-fix1-v3 other-income-custom-range-fix5"
        className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">その他収入</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Amazon 以外の入金、サービス収入、補助金、調整入金などを現金収入ページと同じ操作感で管理します。
            </p>
          </div>
          <Link
            href={`/${lang}/app/income`}
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            収入 root に戻る
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">収入元選択</span>
            <select
              value={otherIncomeSourceFilter}
              onChange={(event) => {
                setOtherIncomeSourceFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-slate-400"
            >
              <option value="all">全収入元</option>
              {otherIncomeSourceOptions.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">現在範囲</span>
            <select
              value={otherIncomeDashboardRange}
              onChange={(event) => setOtherIncomeDashboardRange(event.target.value as OtherIncomeDashboardRange)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-slate-400"
            >
              <option value="30d">直近30日</option>
              <option value="90d">直近90日</option>
              <option value="12m">直近12ヶ月</option>
              <option value="custom">カスタム期間</option>
            </select>
          </label>
        </div>

        {otherIncomeDashboardRange === "custom" ? (
          <div
            data-scope="other-income-custom-range-fix5 other-income-custom-range-apply-cancel-fix6"
            className="mt-4 grid gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_1fr_auto]"
          >
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">開始日</span>
              <input
                type="date"
                value={otherIncomeDraftCustomStartDate}
                onChange={(event) => setOtherIncomeDraftCustomStartDate(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-slate-400"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">終了日</span>
              <input
                type="date"
                value={otherIncomeDraftCustomEndDate}
                onChange={(event) => setOtherIncomeDraftCustomEndDate(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-slate-400"
              />
            </label>
            <div className="flex items-end justify-end gap-2">
              <button
                type="button"
                onClick={handleOtherIncomeCustomRangeApply}
                disabled={!isOtherIncomeCustomRangeDirty || !isOtherIncomeCustomRangeValid}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-900 bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500"
              >
                確定
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-[22px] bg-slate-50 px-5 py-5">
            <div className="text-sm font-medium text-slate-500">表示中のその他収入</div>
            <div className="mt-3 text-xl font-bold text-slate-950">
              {formatIncomeJPY(otherIncomeDashboardAmount)}
            </div>
          </div>
          <div className="rounded-[22px] bg-slate-50 px-5 py-5">
            <div className="text-sm font-medium text-slate-500">明細数</div>
            <div className="mt-3 text-xl font-bold text-slate-950">
              {otherIncomeDashboardRows.length.toLocaleString("ja-JP")}
            </div>
          </div>
          <div className="rounded-[22px] bg-slate-50 px-5 py-5">
            <div className="text-sm font-medium text-slate-500">口座数</div>
            <div className="mt-3 text-xl font-bold text-slate-950">
              {otherIncomeDashboardAccountCount.toLocaleString("ja-JP")}
            </div>
          </div>
          <div className="rounded-[22px] bg-slate-50 px-5 py-5">
            <div className="text-sm font-medium text-slate-500">平均金額</div>
            <div className="mt-3 text-xl font-bold text-slate-950">
              {otherIncomeDashboardAverage}
            </div>
            <div className="mt-2 text-xs text-slate-500">最新日 {otherIncomeDashboardLatestDate}</div>
          </div>
        </div>
      </section>


      <section
        data-scope="other-income-chart-dashboard-parity-z1e other-income-chart-smoothing-fix2 other-income-weekly-chart-polish-fix3-v2 other-income-remove-latest-badge-fix4"
        className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]"
      >
        <div className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xl font-semibold text-slate-950">収入推移</div>
              <div className="mt-2 text-sm leading-6 text-slate-500">
                選択した期間に応じて、日別・週別・月別に自動集計したその他収入の推移です。
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
              <div className="text-xs font-semibold text-slate-500">表示範囲</div>
              <div className="mt-1 text-sm font-bold text-slate-900">{otherIncomeDashboardRangeLabel}</div>
              <div className="mt-1 text-xs text-slate-500">
                表示粒度 {getOtherIncomeGranularityLabel(otherIncomeTrendGranularity)} / 表示点数 {otherIncomeTrendPoints.length}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">合計その他収入</div>
              <div className="mt-2 text-lg font-bold text-slate-950">{formatIncomeJPY(otherIncomeDashboardAmount)}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">最大発生日</div>
              <div className="mt-2 text-lg font-bold text-slate-950">
                {otherIncomePeakTrendPoint ? otherIncomePeakTrendPoint.label : "-"}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">最新発生</div>
              <div className="mt-2 text-lg font-bold text-slate-950">
                {otherIncomeLatestTrendPoint
                  ? `${otherIncomeLatestTrendPoint.label} / ${formatIncomeJPY(otherIncomeLatestTrendPoint.amount)}`
                  : "-"}
              </div>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[26px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4">
            <svg viewBox="0 0 640 280" className="h-[300px] w-full overflow-visible">
              {(() => {
                const padding = { top: 22, right: 24, bottom: 44, left: 70 };
                const innerWidth = 640 - padding.left - padding.right;
                const innerHeight = 280 - padding.top - padding.bottom;
                const points = otherIncomeTrendPoints;
                const max = otherIncomeTrendMax;
                const labelEvery = getOtherIncomeXAxisLabelEvery(points);
                const latestDataDate = getOtherIncomeDashboardLatestDate(otherIncomeDashboardRows);
                const plot = points.map((point, index) => {
                  const x = padding.left + (points.length <= 1 ? innerWidth : (index / Math.max(1, points.length - 1)) * innerWidth);
                  const hasData = point.amount > 0;
                  const isPartialLatest =
                    otherIncomeTrendGranularity !== "day" &&
                    hasData &&
                    point.start.getTime() <= latestDataDate.getTime() &&
                    point.end.getTime() > latestDataDate.getTime() &&
                    index === points.length - 1;
                  const y = hasData ? padding.top + innerHeight - (point.amount / max) * innerHeight : null;
                  return { ...point, x, y, hasData, isPartialLatest };
                });
                const linePaths = buildOtherIncomeSegmentedLinePaths(plot);
                const hoveredTrendPoint = plot.find((point) => point.key === otherIncomeTrendHoverKey && point.hasData) ?? null;

                return (
                  <>
                    {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                      const y = padding.top + innerHeight - tick * innerHeight;
                      const value = Math.round(max * tick);
                      return (
                        <g key={tick}>
                          <line x1={padding.left} y1={y} x2={padding.left + innerWidth} y2={y} stroke="#E2E8F0" />
                          <text x={padding.left - 12} y={y + 4} textAnchor="end" fontSize="12" fill="#475569">
                            {formatIncomeJPY(value)}
                          </text>
                        </g>
                      );
                    })}
                    {plot.map((point, index) => {
                      const isLast = index === plot.length - 1;
                      const isPenultimate = index === plot.length - 2;
                      const showLabel = (index % labelEvery === 0 || isLast) && !(isPenultimate && plot.length > 8);
                      return showLabel ? (
                        <text
                          key={point.key}
                          x={point.x}
                          y={padding.top + innerHeight + 30}
                          textAnchor="middle"
                          fontSize="12"
                          fill="#334155"
                        >
                          {point.label}
                        </text>
                      ) : null;
                    })}
                    {linePaths.map((path, index) => (
                      <path
                        key={`trend-line-${index}`}
                        d={path}
                        fill="none"
                        stroke="#0F172A"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}
                    {plot.map((point, index) => {
                      if (!point.hasData || point.y == null) return null;

                      const isLatest = index === plot.length - 1;
                      const isPeak = otherIncomePeakTrendPoint?.key === point.key && point.amount > 0;
                      const isHovered = otherIncomeTrendHoverKey === point.key;
                      const dotRadius = isHovered ? 7 : isPeak ? 5.5 : isLatest ? 5 : 3.5;

                      return (
                        <g
                          key={point.key}
                          onMouseEnter={() => setOtherIncomeTrendHoverKey(point.key)}
                          onMouseLeave={() => setOtherIncomeTrendHoverKey(null)}
                          className="cursor-pointer"
                        >
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r={Math.max(12, dotRadius + 7)}
                            fill="transparent"
                          />
                          {point.isPartialLatest ? (
                            <line
                              x1={point.x}
                              y1={point.y}
                              x2={point.x}
                              y2={padding.top + innerHeight}
                              stroke="#059669"
                              strokeDasharray="4 4"
                              opacity="0.55"
                            />
                          ) : null}
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r={dotRadius}
                            fill={isLatest ? "#059669" : isPeak ? "#2563EB" : "#2563EB"}
                            stroke="white"
                            strokeWidth="2"
                          />
                        </g>
                      );
                    })}
                    {hoveredTrendPoint && hoveredTrendPoint.y != null ? (
                      <g className="pointer-events-none">
                        {(() => {
                          const tooltipWidth = 148;
                          const tooltipHeight = 58;
                          const tooltipX = Math.min(
                            Math.max(hoveredTrendPoint.x - tooltipWidth / 2, padding.left),
                            padding.left + innerWidth - tooltipWidth
                          );
                          const tooltipY = Math.max(hoveredTrendPoint.y - tooltipHeight - 14, padding.top + 2);

                          return (
                            <>
                              <line
                                x1={hoveredTrendPoint.x}
                                y1={padding.top}
                                x2={hoveredTrendPoint.x}
                                y2={padding.top + innerHeight}
                                stroke="#CBD5E1"
                                strokeDasharray="4 4"
                              />
                              <rect
                                x={tooltipX}
                                y={tooltipY}
                                width={tooltipWidth}
                                height={tooltipHeight}
                                rx="14"
                                fill="#0F172A"
                                opacity="0.96"
                              />
                              <text x={tooltipX + 14} y={tooltipY + 22} fontSize="12" fontWeight="700" fill="#FFFFFF">
                                {hoveredTrendPoint.label}
                              </text>
                              <text x={tooltipX + 14} y={tooltipY + 42} fontSize="12" fill="#CBD5E1">
                                {formatIncomeJPY(hoveredTrendPoint.amount)} / {hoveredTrendPoint.count}件
                              </text>
                            </>
                          );
                        })()}
                      </g>
                    ) : null}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xl font-semibold text-slate-950">収入状況</div>
              <div className="mt-2 text-sm leading-6 text-slate-500">
                期間別の収入合計を比較します。表示範囲は左側の収入推移と連動します。
              </div>
            </div>
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
              {(["day", "week", "month"] as OtherIncomeDashboardGranularity[]).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setOtherIncomeStatusGranularity(unit)}
                  className={[
                    "rounded-full px-3 py-1.5 text-xs font-bold transition",
                    otherIncomeStatusGranularity === unit
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {getOtherIncomeGranularityLabel(unit).replace("別", "")}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">表示単位</div>
              <div className="mt-2 text-lg font-bold text-slate-950">
                {getOtherIncomeGranularityLabel(otherIncomeStatusGranularity)}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">最大区間</div>
              <div className="mt-2 text-lg font-bold text-slate-950">
                {otherIncomePeakStatusPoint
                  ? `${otherIncomePeakStatusPoint.label} / ${formatIncomeJPY(otherIncomePeakStatusPoint.amount)}`
                  : "-"}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2 text-xs text-slate-500">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-600" />
            <span>青色の棒は最新区間です</span>
          </div>

          <div className="mt-5 overflow-hidden rounded-[26px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4">
            <svg viewBox="0 0 460 280" className="h-[300px] w-full overflow-visible">
              {(() => {
                const padding = { top: 22, right: 18, bottom: 44, left: 66 };
                const innerWidth = 460 - padding.left - padding.right;
                const innerHeight = 280 - padding.top - padding.bottom;
                const points = otherIncomeStatusPoints;
                const max = otherIncomeStatusMax;
                const labelEvery = getOtherIncomeXAxisLabelEvery(points);
                const latestDataDate = getOtherIncomeDashboardLatestDate(otherIncomeDashboardRows);
                const barCount = Math.max(1, points.length);
                const gap = barCount > 40 ? 2 : barCount > 24 ? 4 : 8;
                const columnWidth = Math.max(4, Math.min(32, (innerWidth - gap * Math.max(0, barCount - 1)) / barCount));

                return (
                  <>
                    {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                      const y = padding.top + innerHeight - tick * innerHeight;
                      const value = Math.round(max * tick);
                      return (
                        <g key={tick}>
                          <line x1={padding.left} y1={y} x2={padding.left + innerWidth} y2={y} stroke="#E2E8F0" />
                          <text x={padding.left - 12} y={y + 4} textAnchor="end" fontSize="12" fill="#475569">
                            {formatIncomeJPY(value)}
                          </text>
                        </g>
                      );
                    })}
                    {points.map((point, index) => {
                      const x = padding.left + index * (columnWidth + gap);
                      const h = (point.amount / max) * innerHeight;
                      const y = padding.top + innerHeight - h;
                      const isLatest = index === points.length - 1;
                      const isPeak = otherIncomePeakStatusPoint?.key === point.key && point.amount > 0;
                      const isHovered = otherIncomeStatusHoverKey === point.key;

                      const isPartialLatest =
                        otherIncomeStatusGranularity !== "day" &&
                        point.amount > 0 &&
                        point.start.getTime() <= latestDataDate.getTime() &&
                        point.end.getTime() > latestDataDate.getTime() &&
                        index === points.length - 1;

                      return (
                        <g
                          key={point.key}
                          onMouseEnter={() => setOtherIncomeStatusHoverKey(point.key)}
                          onMouseLeave={() => setOtherIncomeStatusHoverKey(null)}
                          className="cursor-pointer"
                        >
                          <rect
                            x={x}
                            y={padding.top}
                            width={Math.max(columnWidth, 8)}
                            height={innerHeight}
                            fill="transparent"
                          />
                          <rect
                            x={x}
                            y={y}
                            width={columnWidth}
                            height={Math.max(2, h)}
                            rx={Math.min(10, columnWidth / 2)}
                            fill={isLatest ? "#2563EB" : isPeak ? "#475569" : "#64748B"}
                            opacity={isHovered || isLatest || isPeak ? "1" : "0.78"}
                          />
                          {isHovered && point.amount > 0 ? (
                            <g className="pointer-events-none">
                              {(() => {
                                const tooltipWidth = 138;
                                const tooltipHeight = 56;
                                const tooltipX = Math.min(
                                  Math.max(x + columnWidth / 2 - tooltipWidth / 2, padding.left),
                                  padding.left + innerWidth - tooltipWidth
                                );
                                const tooltipY = Math.max(y - tooltipHeight - 12, padding.top + 2);

                                return (
                                  <>
                                    <rect
                                      x={tooltipX}
                                      y={tooltipY}
                                      width={tooltipWidth}
                                      height={tooltipHeight}
                                      rx="14"
                                      fill="#0F172A"
                                      opacity="0.96"
                                    />
                                    <text x={tooltipX + 14} y={tooltipY + 22} fontSize="12" fontWeight="700" fill="#FFFFFF">
                                      {point.label}
                                    </text>
                                    <text x={tooltipX + 14} y={tooltipY + 42} fontSize="12" fill="#CBD5E1">
                                      {formatIncomeJPY(point.amount)} / {point.count}件
                                    </text>
                                  </>
                                );
                              })()}
                            </g>
                          ) : null}
                          {(() => {
                            const isLast = index === points.length - 1;
                            const isPenultimate = index === points.length - 2;
                            const showLabel = (index % labelEvery === 0 || isLast) && !(isPenultimate && points.length > 8);
                            return showLabel ? (
                              <text
                                x={x + columnWidth / 2}
                                y={padding.top + innerHeight + 30}
                                textAnchor="middle"
                                fontSize="11"
                                fill="#334155"
                              >
                                {point.label}
                              </text>
                            ) : null;
                          })()}
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
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

            if (item.label === "その他収入CSV/Excel取込") {
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => otherIncomeFileInputRef.current?.click()}
                  disabled={importLoading}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {importLoading ? "取込中..." : item.label}
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

      <div
        data-scope="other-income-layout-parity-z1d"
        className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-slate-900">その他収入明細</div>
            <div className="mt-1 text-sm text-slate-500">
              その他収入明細を一覧で確認できます。行をクリックすると編集 drawer が開きます。
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700">並び替え</span>
            <select
              value={sortMode}
              onChange={(e) => {
                setSortMode(e.target.value as OtherIncomeSortMode);
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

        {categorySummary.length > 0 ? (
          <div
            data-scope="other-income-category-summary-panel-z1d"
            className="mt-4 rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">収入区分別サマリー</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">
                  その他収入を税務申告・税理士確認で使いやすい区分に整理しています。
                </div>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                表示中 {categorySummary.length} 区分
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {categorySummary.map((item) => {
                const active = categoryFilter === item.label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setCategoryFilter(active ? "all" : item.label)}
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
        ) : (
          <div
            data-scope="other-income-category-summary-empty-z1d"
            className="mt-4 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-sm text-slate-500"
          >
            その他収入データがまだありません。新規登録または CSV/Excel 取込を行うと、ここに収入区分別の集計が表示されます。
          </div>
        )}

        <div
          data-scope="other-income-category-filter-tax-export-z1d"
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
                現在: {activeOtherIncomeCategoryLabel}
              </span>
              <button
                type="button"
                data-scope="other-income-tax-export-z1d"
                onClick={handleOtherIncomeTaxExport}
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
              onClick={() => setCategoryFilter("all")}
              className={[
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                categoryFilter === "all"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              全部
            </button>
            {categorySummary.map((item) => {
              const active = categoryFilter === item.label;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setCategoryFilter(item.label)}
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
                {formatIncomeJPY(filteredAmount)}
              </span>
            </div>
            <div>
              出力区分:{" "}
              <span className="font-semibold text-slate-800">
                {filteredCategorySummary.length} 区分
              </span>
            </div>
          </div>
        </div>

        {selectedRow ? (
          <div
            data-scope="other-income-selected-row-summary-z1d"
            className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <div className="grid gap-3 md:grid-cols-5">
              <div>
                <div className="text-xs text-slate-500">発生日</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.date}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">種別</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{getOtherIncomeCategoryLabel(selectedRow)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">口座</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{selectedRow.account || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">収入元</div>
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
                {getOtherIncomeMemo(selectedRow)}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[140px_1.1fr_1fr_180px_140px] gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            <div>発生日</div>
            <div>種別</div>
            <div>メモ・収入元</div>
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
                    <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800">
                      {getOtherIncomeCategoryLabel(row)}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-600">{getOtherIncomeMemo(row) || "-"}</div>
                    <div className="mt-1 text-xs text-slate-500">{row.store || "-"}</div>
                  </div>
                  <div className="text-slate-600">{row.account || "-"}</div>
                  <div className="text-right font-medium text-slate-900">
                    {formatIncomeJPY(row.amount)}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="border-t border-slate-100 bg-white px-6 py-12">
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                <div className="text-base font-medium text-slate-900">
                  {categoryFilter === "all" ? "その他収入データがまだ登録されていません" : "選択した収入区分の明細はありません"}
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  「新規その他収入」または「その他収入CSV/Excel取込」からデータを追加すると、ここに明細が表示されます。
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="text-sm text-slate-500">
            全 {totalRows.toLocaleString("ja-JP")} 行のうち、{pageStartRow} - {pageEndRow} 行を表示
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
                  className={[
                    "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition",
                    page === safeCurrentPage
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
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
                      : "選択したその他収入データの金額・収入区分・メモを編集します。"}
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

              {drawerMode === "edit" && editingRow ? (
                <div data-scope="other-income-edit-category-z1c-v2 other-income-drawer-polish-fix2" className="space-y-2 rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-semibold text-slate-900">収入区分</label>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
                      summary/filter 同期
                    </span>
                  </div>
                  <select
                    value={editCategoryLabel}
                    onChange={(event) => setEditCategoryLabel(event.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-slate-400"
                  >
                    {otherIncomeEditCategoryOptions.map((label) => (
                      <option key={label} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
                    保存後、収入区分別サマリー・フィルター・税務CSVに反映されます。
                  </div>
                </div>
              ) : null}

              {drawerMode === "edit" ? (
                <div data-scope="other-income-delete-action-z1c-v2" className="flex justify-start">
                  <button
                    type="button"
                    onClick={deleteSelectedOtherIncome}
                    disabled={deleteLoading || editSaveLoading}
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleteLoading ? "削除中..." : "削除"}
                  </button>
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
                {/* Step109-Z1-E-FIX7C: create drawer category options use stable Other Income labels, not empty txCategories. */}
                    {/* Step109-Z1-E-FIX7D-v3: persist selected category through memo marker on create save. */}
                      <div className="mb-2 text-sm font-medium text-slate-700">収入カテゴリ</div>
                      <select
                        value={otherIncomeCreateCategoryLabel}
                        onChange={(e) => {
                          const nextLabel = e.target.value || OTHER_INCOME_STANDARD_CATEGORY_LABELS[0] || "その他収入";
                          const previousLabel =
                            otherIncomeCreateCategoryLabel || OTHER_INCOME_STANDARD_CATEGORY_LABELS[0] || "その他収入";

                          setOtherIncomeCreateCategoryLabel(nextLabel);

                          const matchedCategory = txCategories.find((item) => {
                            const itemName = normalizeOtherIncomeCategoryLabel(item.name);
                            const optionName = normalizeOtherIncomeCategoryLabel(nextLabel);
                            return (
                              itemName === optionName ||
                              itemName.includes(optionName) ||
                              optionName.includes(itemName)
                            );
                          });

                          if (matchedCategory) {
                            setCategoryId(matchedCategory.id);
                          }

                          const currentVisibleMemo = stripOtherIncomeMarkers(memo || "");
                          if (
                            !currentVisibleMemo ||
                            currentVisibleMemo === previousLabel ||
                            currentVisibleMemo.startsWith(`${previousLabel} /`) ||
                            currentVisibleMemo.startsWith(`${previousLabel}／`)
                          ) {
                            setMemo(nextLabel);
                          }
                        }}
                        disabled={formLoading || submitLoading}
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 disabled:bg-slate-50"
                      >
                        {otherIncomeCreateCategoryOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
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
                        type="date"
                        value={formatOtherIncomeCreateDateInput(occurredAt)}
                        onChange={(e) => setOccurredAt(e.target.value)}
                        disabled={formLoading || submitLoading}
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 disabled:bg-slate-50"
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
                      収入区分はメモ内の管理タグとして保存され、サマリー・フィルター・税務CSVに反映されます。
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
                      {drawerMode === "create" ? formatOtherIncomeCreateDateDisplay(occurredAt) : editingRow?.date || "-"}
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
                  type="button" onClick={handleOtherIncomeDrawerSave}
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
