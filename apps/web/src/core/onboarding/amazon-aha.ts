import {
  type ExplainConfidence,
  getAmazonPayoutExplainMock,
} from "@/core/explain/amazon-payout-explain";

export type AmazonAhaBreakdownItem = {
  key: string;
  label: string;
  amount: number;
  description: string;
};

export type AmazonAhaViewModel = {
  salesAmount: number;
  payoutAmount: number;
  gapAmount: number;
  summary: string;
  breakdown: AmazonAhaBreakdownItem[];
  trustNotes: string[];
  confidence: ExplainConfidence;
  coverageNote: string;
  unexplainedRemainder: number;
};

export function formatJPY(value: number): string {
  return `¥${Number(value || 0).toLocaleString("ja-JP")}`;
}

export function getAmazonAhaViewModelMock(): AmazonAhaViewModel {
  const explain = getAmazonPayoutExplainMock();

  return {
    salesAmount: explain.targetAmount,
    payoutAmount: explain.actualAmount,
    gapAmount: explain.gapAmount,
    summary: explain.summary,
    breakdown: explain.explanationItems.map((item) => ({
      key: item.key,
      label: item.label,
      amount: item.amount,
      description: item.description,
    })),
    trustNotes: explain.trustNotes,
    confidence: explain.confidence,
    coverageNote: explain.coverageNote,
    unexplainedRemainder: explain.unexplainedRemainder,
  };
}
