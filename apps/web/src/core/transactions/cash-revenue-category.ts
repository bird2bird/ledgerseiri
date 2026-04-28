export type CashRevenueCategoryCode =
  | "PRODUCT_SALES"
  | "SERVICE_FEE"
  | "COMMISSION"
  | "EVENT_SALES"
  | "RENTAL_INCOME"
  | "SUBSCRIPTION"
  | "REIMBURSEMENT"
  | "REFUND_ADJUSTMENT"
  | "SUBSIDY_GRANT"
  | "MISC_REVENUE"
  | "OTHER_REVENUE";

export const CASH_REVENUE_CATEGORY_DEFAULT: CashRevenueCategoryCode = "PRODUCT_SALES";

export const CASH_REVENUE_CATEGORIES: {
  code: CashRevenueCategoryCode;
  label: string;
  description: string;
}[] = [
  { code: "PRODUCT_SALES", label: "商品売上", description: "商品・物販・店頭販売などの売上" },
  { code: "SERVICE_FEE", label: "サービス収入", description: "作業費・相談料・修理・制作などの役務収入" },
  { code: "COMMISSION", label: "手数料収入", description: "紹介料・代理手数料・仲介手数料" },
  { code: "EVENT_SALES", label: "イベント売上", description: "展示会・催事・ポップアップ販売" },
  { code: "RENTAL_INCOME", label: "レンタル収入", description: "設備・備品・スペースなどの貸出収入" },
  { code: "SUBSCRIPTION", label: "月額・継続収入", description: "月額契約・会費・継続課金収入" },
  { code: "REIMBURSEMENT", label: "立替金回収", description: "送料・材料費などの立替金回収" },
  { code: "REFUND_ADJUSTMENT", label: "返金・調整入金", description: "返金・差額調整・補正入金" },
  { code: "SUBSIDY_GRANT", label: "補助金・助成金", description: "事業に関係する補助金・助成金" },
  { code: "MISC_REVENUE", label: "雑収入", description: "事業に付随するその他の収入" },
  { code: "OTHER_REVENUE", label: "その他収入", description: "上記に当てはまらない収入" },
];

const CASH_REVENUE_CATEGORY_ALIASES: Record<string, CashRevenueCategoryCode> = {
  PRODUCT_SALES: "PRODUCT_SALES",
  商品売上: "PRODUCT_SALES",
  商品販売: "PRODUCT_SALES",
  販売収入: "PRODUCT_SALES",
  売上: "PRODUCT_SALES",
  物販売上: "PRODUCT_SALES",

  SERVICE_FEE: "SERVICE_FEE",
  サービス収入: "SERVICE_FEE",
  サービス売上: "SERVICE_FEE",
  サービス費用: "SERVICE_FEE",
  役務収入: "SERVICE_FEE",
  作業費: "SERVICE_FEE",
  修理代: "SERVICE_FEE",

  COMMISSION: "COMMISSION",
  手数料収入: "COMMISSION",
  紹介料: "COMMISSION",
  仲介手数料: "COMMISSION",
  コミッション: "COMMISSION",

  EVENT_SALES: "EVENT_SALES",
  イベント売上: "EVENT_SALES",
  催事売上: "EVENT_SALES",
  展示会売上: "EVENT_SALES",

  RENTAL_INCOME: "RENTAL_INCOME",
  レンタル収入: "RENTAL_INCOME",
  貸出収入: "RENTAL_INCOME",
  使用料収入: "RENTAL_INCOME",

  SUBSCRIPTION: "SUBSCRIPTION",
  月額収入: "SUBSCRIPTION",
  継続収入: "SUBSCRIPTION",
  会費収入: "SUBSCRIPTION",
  サブスク: "SUBSCRIPTION",

  REIMBURSEMENT: "REIMBURSEMENT",
  立替金回収: "REIMBURSEMENT",
  立替回収: "REIMBURSEMENT",

  REFUND_ADJUSTMENT: "REFUND_ADJUSTMENT",
  返金: "REFUND_ADJUSTMENT",
  調整入金: "REFUND_ADJUSTMENT",
  補正入金: "REFUND_ADJUSTMENT",
  差額調整: "REFUND_ADJUSTMENT",

  SUBSIDY_GRANT: "SUBSIDY_GRANT",
  補助金: "SUBSIDY_GRANT",
  助成金: "SUBSIDY_GRANT",

  MISC_REVENUE: "MISC_REVENUE",
  雑収入: "MISC_REVENUE",
  その他事業収入: "MISC_REVENUE",

  OTHER_REVENUE: "OTHER_REVENUE",
  その他収入: "OTHER_REVENUE",
  その他: "OTHER_REVENUE",
};

export function normalizeCashRevenueCategory(value?: string | null): CashRevenueCategoryCode {
  const raw = String(value || "").trim();
  if (!raw) return CASH_REVENUE_CATEGORY_DEFAULT;

  const marker = raw.match(/\[revenue-category:([A-Z_]+)\]/);
  const markerCode = marker?.[1] || "";
  if (markerCode && CASH_REVENUE_CATEGORIES.some((item) => item.code === markerCode)) {
    return markerCode as CashRevenueCategoryCode;
  }

  const direct = CASH_REVENUE_CATEGORY_ALIASES[raw];
  if (direct) return direct;

  const upper = raw.toUpperCase();
  const upperDirect = CASH_REVENUE_CATEGORY_ALIASES[upper];
  if (upperDirect) return upperDirect;

  if (raw.includes("補助金") || raw.includes("助成金")) return "SUBSIDY_GRANT";
  if (raw.includes("返金") || raw.includes("調整") || raw.includes("補正")) return "REFUND_ADJUSTMENT";
  if (raw.includes("立替")) return "REIMBURSEMENT";
  if (raw.includes("イベント") || raw.includes("催事") || raw.includes("展示会")) return "EVENT_SALES";
  if (raw.includes("レンタル") || raw.includes("貸出") || raw.includes("使用料")) return "RENTAL_INCOME";
  if (raw.includes("月額") || raw.includes("会費") || raw.includes("継続") || raw.includes("サブスク")) return "SUBSCRIPTION";
  if (raw.includes("手数料") || raw.includes("紹介料") || raw.includes("仲介")) return "COMMISSION";
  if (raw.includes("サービス") || raw.includes("役務") || raw.includes("作業") || raw.includes("修理")) return "SERVICE_FEE";
  if (raw.includes("雑収入")) return "MISC_REVENUE";
  if (raw.includes("売上") || raw.includes("販売") || raw.includes("商品")) return "PRODUCT_SALES";

  return CASH_REVENUE_CATEGORY_DEFAULT;
}

export function getCashRevenueCategoryLabel(value?: string | null): string {
  const code = normalizeCashRevenueCategory(value);
  return CASH_REVENUE_CATEGORIES.find((item) => item.code === code)?.label ?? "商品売上";
}

export function stripCashRevenueCategoryMarker(value?: string | null): string {
  return String(value || "")
    .replace(/\s*\[revenue-category:[A-Z_]+\]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveCashRevenueCategoryFromText(args: {
  memo?: string | null;
  label?: string | null;
  categoryName?: string | null;
}): CashRevenueCategoryCode {
  const memo = String(args.memo || "");
  const marker = memo.match(/\[revenue-category:([A-Z_]+)\]/);
  if (marker?.[1]) return normalizeCashRevenueCategory(marker[1]);

  return normalizeCashRevenueCategory(
    [args.categoryName, args.label, args.memo].filter(Boolean).join(" ")
  );
}

export function buildCashRevenueCategoryMemo(args: {
  memo?: string | null;
  revenueCategory?: string | null;
  prefixCash?: boolean;
}): string {
  const code = normalizeCashRevenueCategory(args.revenueCategory);
  const visibleMemo =
    stripCashRevenueCategoryMarker(args.memo)
      .replace(/^\s*\[cash\]\s*/i, "")
      .trim() || getCashRevenueCategoryLabel(code);

  return `${args.prefixCash ? "[cash] " : ""}[revenue-category:${code}] ${visibleMemo}`.trim();
}
