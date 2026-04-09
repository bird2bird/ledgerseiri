export type AmazonAhaBreakdownItem = {
  key: "fbaFee" | "ads" | "refund" | "other";
  label: string;
  amount: number;
  description: string;
};

export type AmazonAhaData = {
  salesAmount: number;
  payoutAmount: number;
  gapAmount: number;
  summary: string;
  breakdown: AmazonAhaBreakdownItem[];
  trustNotes: string[];
};

export function formatJPY(value: number): string {
  return `¥${Number(value || 0).toLocaleString("ja-JP")}`;
}

export function getAmazonAhaMock(): AmazonAhaData {
  return {
    salesAmount: 520000,
    payoutAmount: 412000,
    gapAmount: 108000,
    summary:
      "今月のAmazon販売では、売上 ¥520,000 に対して、入金は ¥412,000 です。差額の主な要因は FBA手数料、広告費、返金です。",
    breakdown: [
      {
        key: "fbaFee",
        label: "FBA手数料",
        amount: 58000,
        description: "配送・フルフィルメント関連の手数料",
      },
      {
        key: "ads",
        label: "広告費",
        amount: 26000,
        description: "スポンサープロダクト等の広告コスト",
      },
      {
        key: "refund",
        label: "返金",
        amount: 14000,
        description: "返品や返金対応による控除",
      },
      {
        key: "other",
        label: "その他調整",
        amount: 10000,
        description: "細かな調整項目や未分類の差額",
      },
    ],
    trustNotes: [
      "Amazon settlement / transaction データをもとに差額を整理します。",
      "手数料・広告費・返金などの内訳を見える化していきます。",
      "Step85-D 以降で Explain Engine と接続し、説明の精度を上げます。",
    ],
  };
}
