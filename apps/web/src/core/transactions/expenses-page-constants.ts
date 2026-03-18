import type { ExpenseCategory } from "@/core/transactions/transactions";

export const EXPENSE_CATEGORY_ITEMS: ExpenseCategory[] = [
  "all",
  "advertising",
  "logistics",
  "payroll",
  "other",
];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  all: "全カテゴリ",
  advertising: "広告費",
  logistics: "物流費",
  payroll: "給与",
  other: "その他",
};

export function getExpensesPageTitle(category: ExpenseCategory) {
  if (category === "all") return "支出管理";
  return `支出管理 · ${EXPENSE_CATEGORY_LABELS[category]}`;
}

export function formatExpensesJPY(value: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getNowLocalInputValue() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
