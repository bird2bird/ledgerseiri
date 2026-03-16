export type JournalsActionUiTone = "info" | "success" | "error";

export function getJournalsActionInitialTone(): JournalsActionUiTone {
  return "info";
}

export function getJournalsActionEmptyMessage(): string {
  return "";
}

export function getJournalsActionMissingSelectionMessage(): string {
  return "転記対象が選択されていません。";
}

export function getBulkPostShellSuccessMessage(): string {
  return "Step41Q-C: bulk-post 実行 feedback を標準化しました。次段階で journal API と実行 contract を接続します。";
}

export function getFlaggedReviewShellSuccessMessage(): string {
  return "Step41Q-D: flagged review action shell を接続しました。次段階で dedicated review contract を接続します。";
}

export async function runJournalsActionShell(delayMs: number = 400): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}
