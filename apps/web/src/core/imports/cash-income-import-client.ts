import { normalizeCashRevenueCategory } from "@/core/transactions/cash-revenue-category";

export const CASH_INCOME_SAMPLE_TEXT = [
  "account,amount,occurredAt,memo,source,revenueCategory",
  "現金,12000,2026-04-24,店頭現金売上,横浜店,商品売上",
  "現金,8500,2026-04-25,イベント現金売上,展示会,イベント売上",
  "現金,3000,2026-04-26,現金補正入金,手動調整,返金・調整入金",
].join("\n");

export const CASH_INCOME_ERROR_SAMPLE_TEXT = [
  "account,amount,occurredAt,memo,source",
  ",12000,2026-04-24,店頭現金売上,横浜店",
  "現金,-1,2026-04-25,イベント現金売上,展示会",
  "現金,3000,abc,,手動調整",
].join("\n");

export type CashIncomeDraftRow = {
  rowNo: number;
  account: string;
  amount: number;
  occurredAt: string;
  memo: string;
  source: string;
  revenueCategory: string;
  status: "valid" | "warning" | "error";
  messages: string[];
};

export function formatCashDraftMessage(message: string) {
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

export function formatCashDraftStatusLabel(status: CashIncomeDraftRow["status"]) {
  if (status === "valid") return "OK";
  if (status === "warning") return "確認";
  return "エラー";
}

export function formatCashAccountMatchMode(value?: string | null) {
  if (value === "exact_name") return "完全一致";
  if (value === "cash_fallback") return "現金口座 fallback";
  return "未解決";
}

export function formatCashServerMatchReason(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  return raw
    .split(" / ")
    .map((message) => {
      if (message === "accountName could not be resolved") {
        return "口座名を既存の入金先口座と照合できません";
      }
      if (message === "accountName is required") return "口座名が未入力です";
      if (message === "amount must be greater than 0") {
        return "金額は 0 より大きい数値を入力してください";
      }
      if (message === "occurredAt is required") return "発生日が未入力です";
      if (message === "occurredAt is not parseable") {
        return "発生日を日付形式で入力してください";
      }
      if (message === "memo is recommended") return "メモの入力を推奨します";
      return message;
    })
    .join(" / ");
}

export function splitCsvLine(line: string) {
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

export function parseCashIncomeCsvDraft(csvText: string): CashIncomeDraftRow[] {
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
    revenueCategory: hasHeader ? header.indexOf("revenueCategory") : 5,
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
    const revenueCategory =
      columnIndex.revenueCategory >= 0
        ? normalizeCashRevenueCategory(String(cells[columnIndex.revenueCategory] || "").trim())
        : normalizeCashRevenueCategory(`${memo} ${source}`);

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
      revenueCategory,
      status: hasError ? "error" : messages.length > 0 ? "warning" : "valid",
      messages,
    };
  });
}
