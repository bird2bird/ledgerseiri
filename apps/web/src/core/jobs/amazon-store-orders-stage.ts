import type {
  AmazonStoreOrderFact,
  AmazonStoreOrdersPreviewResponse,
  AmazonStoreOrdersPreviewSummary,
  AmazonTransactionCharge,
  AmazonTransactionChargeSummary
} from "./types";

export type AmazonStoreOrdersStageSnapshot = {
  version: 1;
  savedAt: string;
  filename: string;
  summary: AmazonStoreOrdersPreviewSummary;
  facts: AmazonStoreOrderFact[];
  charges: AmazonTransactionCharge[];
  chargeSummary: AmazonTransactionChargeSummary;
};

const STORAGE_KEY = "ledgerseiri.amazon-store-orders.stage.v1";

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function saveAmazonStoreOrdersStage(
  preview: AmazonStoreOrdersPreviewResponse
): AmazonStoreOrdersStageSnapshot | null {
  if (!canUseStorage()) return null;
  if (!preview?.summary) return null;

  const snapshot: AmazonStoreOrdersStageSnapshot = {
    version: 1,
    savedAt: new Date().toISOString(),
    filename: preview.summary.filename,
    summary: preview.summary,
    facts: Array.isArray(preview.facts) ? preview.facts : [],
    charges: Array.isArray(preview.charges) ? preview.charges : [],
    chargeSummary: preview.chargeSummary || {
      adFee: 0,
      storageFee: 0,
      subscriptionFee: 0,
      fbaFee: 0,
      tax: 0,
      payout: 0,
      adjustment: 0,
      other: 0,
    },
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  return snapshot;
}

export function loadAmazonStoreOrdersStage(): AmazonStoreOrdersStageSnapshot | null {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as AmazonStoreOrdersStageSnapshot;
    if (!parsed || parsed.version !== 1) return null;
    if (!parsed.summary || !Array.isArray(parsed.facts)) return null;

    return parsed;
  } catch {
    return null;
  }
}

export function clearAmazonStoreOrdersStage() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function hasAmazonStoreOrdersStage() {
  return !!loadAmazonStoreOrdersStage();
}
