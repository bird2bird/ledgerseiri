import type { TransferStatus } from "@/core/transactions/transactions";

export const FUND_TRANSFER_STATUS_ITEMS: TransferStatus[] = [
  "all",
  "scheduled",
  "completed",
];

export const FUND_TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  all: "すべて",
  scheduled: "予定",
  completed: "完了",
};

export function getFundTransferPageTitle() {
  return "資金移動";
}

export function formatFundTransferJPY(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}

export function getNowLocalInputValue() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
