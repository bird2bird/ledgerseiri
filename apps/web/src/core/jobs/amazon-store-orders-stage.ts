import type {
  AmazonStoreOrderFact,
  AmazonStoreOrdersPreviewResponse,
  AmazonStoreOrdersPreviewSummary,
  AmazonTransactionCharge,
  AmazonTransactionChargeSummary
} from "./types";

export type AmazonStoreOrdersStageSnapshot = {
  version: 2;
  savedAt: string;
  filename: string;
  summary: AmazonStoreOrdersPreviewSummary;
  facts: AmazonStoreOrderFact[];
  charges: AmazonTransactionCharge[];
  chargeSummary: AmazonTransactionChargeSummary;
};

const STORAGE_KEY = "ledgerseiri.amazon-store-orders.stage.v2";

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function emptyChargeSummary(): AmazonTransactionChargeSummary {
  return {
    orderSale: 0,
    adFee: 0,
    storageFee: 0,
    subscriptionFee: 0,
    fbaFee: 0,
    tax: 0,
    payout: 0,
    adjustment: 0,
    other: 0,
  };
}

function normalizeStageSnapshot(
  input: Partial<AmazonStoreOrdersStageSnapshot> | null | undefined
): AmazonStoreOrdersStageSnapshot | null {
  if (!input?.summary) return null;

  return {
    version: 2,
    savedAt: String(input.savedAt || new Date().toISOString()),
    filename: String(input.filename || input.summary.filename || "amazon-store-orders.csv"),
    summary: input.summary,
    facts: Array.isArray(input.facts) ? input.facts : [],
    charges: Array.isArray(input.charges) ? input.charges : [],
    chargeSummary: {
      ...emptyChargeSummary(),
      ...(input.chargeSummary || {}),
    },
  };
}

export function saveAmazonStoreOrdersStage(
  preview: AmazonStoreOrdersPreviewResponse
): AmazonStoreOrdersStageSnapshot | null {
  if (!canUseStorage()) return null;
  if (!preview?.summary) return null;

  const snapshot = normalizeStageSnapshot({
    version: 2,
    savedAt: new Date().toISOString(),
    filename: preview.summary.filename,
    summary: preview.summary,
    facts: Array.isArray(preview.facts) ? preview.facts : [],
    charges: Array.isArray(preview.charges) ? preview.charges : [],
    chargeSummary: {
      ...emptyChargeSummary(),
      ...(preview.chargeSummary || {}),
    },
  });

  if (!snapshot) return null;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  return snapshot;
}

export function loadAmazonStoreOrdersStage(): AmazonStoreOrdersStageSnapshot | null {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AmazonStoreOrdersStageSnapshot>;
    return normalizeStageSnapshot(parsed);
  } catch {
    return null;
  }
}

export function clearAmazonStoreOrdersStage() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
  // cleanup old key just in case
  window.localStorage.removeItem("ledgerseiri.amazon-store-orders.stage.v1");
}

export function hasAmazonStoreOrdersStage() {
  return !!loadAmazonStoreOrdersStage();
}
