export type BillingPlanCode = "starter" | "standard" | "premium";

export type BillingPriceMeta = {
  monthlyJpy: number;
  monthlyLabel: string;
};

export const BILLING_PRICE_TABLE: Record<BillingPlanCode, BillingPriceMeta> = {
  starter: {
    monthlyJpy: 980,
    monthlyLabel: "¥980 / 月",
  },
  standard: {
    monthlyJpy: 1980,
    monthlyLabel: "¥1,980 / 月",
  },
  premium: {
    monthlyJpy: 3980,
    monthlyLabel: "¥3,980 / 月",
  },
};

export function getBillingPriceMeta(plan: BillingPlanCode): BillingPriceMeta {
  return BILLING_PRICE_TABLE[plan];
}

export function getBillingMonthlyPriceLabel(plan: BillingPlanCode): string {
  return BILLING_PRICE_TABLE[plan].monthlyLabel;
}
