import type { JournalTab } from "@/core/transactions/transactions";

export const JOURNALS_TAB_ITEMS: JournalTab[] = [
  "all",
  "unposted",
  "posted",
  "flagged",
];

export const JOURNALS_TAB_LABELS: Record<JournalTab, string> = {
  all: "すべて",
  unposted: "未転記",
  posted: "転記済み",
  flagged: "要確認",
};

export function formatJournalJPY(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`;
}
