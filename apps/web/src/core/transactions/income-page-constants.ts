import type { IncomeCategory } from "@/core/transactions/transactions";

export const INCOME_CATEGORY_ITEMS: IncomeCategory[] = [
  "all",
  "store-order",
  "cash",
  "other",
];

export const INCOME_CATEGORY_LABELS: Record<IncomeCategory, string> = {
  all: "全カテゴリ",
  "store-order": "店舗注文",
  cash: "現金収入",
  other: "その他",
};

export function getIncomePageTitle(category: IncomeCategory) {
  if (category === "all") return "収入管理";
  return `収入管理 · ${INCOME_CATEGORY_LABELS[category]}`;
}

export function formatIncomeJPY(value: number) {
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
