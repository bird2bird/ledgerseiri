export type AmazonExplainItemKey =
  | "sales"
  | "fbaFee"
  | "ads"
  | "refund"
  | "other";

export type AmazonExplainItem = {
  key: AmazonExplainItemKey;
  label: string;
  amount: number;
  description: string;
};

export type ExplainConfidence = "low" | "medium" | "high";

export type AmazonPayoutExplain = {
  targetAmount: number;
  actualAmount: number;
  gapAmount: number;
  summary: string;
  explanationItems: AmazonExplainItem[];
  unexplainedRemainder: number;
  confidence: ExplainConfidence;
  coverageNote: string;
  trustNotes: string[];
};

export function getAmazonPayoutExplainMock(): AmazonPayoutExplain {
  return {
    targetAmount: 520000,
    actualAmount: 412000,
    gapAmount: 108000,
    summary:
      "今月のAmazon販売では、売上 ¥520,000 に対して、入金は ¥412,000 です。差額の主な要因は FBA手数料、広告費、返金です。",
    explanationItems: [
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
    unexplainedRemainder: 0,
    confidence: "high",
    coverageNote:
      "差額の主要因は現在のルールベース説明でカバーされています。",
    trustNotes: [
      "Amazon settlement / transaction データをもとに差額を整理します。",
      "手数料・広告費・返金などの内訳を見える化していきます。",
      "今後は Explain Engine と接続し、説明の精度をさらに高めます。",
    ],
  };
}
