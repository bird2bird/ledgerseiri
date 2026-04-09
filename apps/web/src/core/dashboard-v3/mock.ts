import type { BusinessViewType } from "@/core/business-view";
import type {
  DashboardV3Cockpit,
  DashboardV3DistributionBlock,
  DashboardV3ExplainSummary,
  DashboardV3Kpi,
  DashboardV3Range,
  DashboardV3TrendSeries,
  DashboardV3Alert,
} from "@/core/dashboard-v3/types";

function makeBaseKpis(): DashboardV3Kpi[] {
  return [
    { key: "sales", label: "売上", value: 520000, unit: "JPY", deltaLabel: "+8.2%" },
    { key: "payout", label: "入金", value: 412000, unit: "JPY", deltaLabel: "+5.0%" },
    { key: "gap", label: "差額", value: 108000, unit: "JPY", deltaLabel: "-2.1%" },
    { key: "orders", label: "注文数", value: 182, unit: "count", deltaLabel: "+6.4%" },
  ];
}

function makeBaseTrends(): DashboardV3TrendSeries[] {
  return [
    {
      key: "sales-orders",
      title: "売上 / 注文トレンド",
      primaryLabel: "売上",
      secondaryLabel: "注文数",
      points: [
        { label: "W1", value: 110000, secondaryValue: 40 },
        { label: "W2", value: 126000, secondaryValue: 45 },
        { label: "W3", value: 134000, secondaryValue: 47 },
        { label: "W4", value: 150000, secondaryValue: 50 },
      ],
    },
    {
      key: "payout-gap",
      title: "入金 / 差額トレンド",
      primaryLabel: "入金",
      secondaryLabel: "差額",
      points: [
        { label: "W1", value: 89000, secondaryValue: 21000 },
        { label: "W2", value: 98000, secondaryValue: 28000 },
        { label: "W3", value: 104000, secondaryValue: 29000 },
        { label: "W4", value: 121000, secondaryValue: 30000 },
      ],
    },
  ];
}

function makeBaseDistributions(): DashboardV3DistributionBlock[] {
  return [
    {
      key: "cost-breakdown",
      title: "費用構成",
      items: [
        { key: "fba", label: "FBA手数料", value: 58000 },
        { key: "ads", label: "広告費", value: 26000 },
        { key: "refund", label: "返金", value: 14000 },
        { key: "other", label: "その他", value: 10000 },
      ],
    },
    {
      key: "channel-breakdown",
      title: "チャネル構成",
      items: [
        { key: "amazon-jp", label: "Amazon JP", value: 470000 },
        { key: "other", label: "その他", value: 50000 },
      ],
    },
  ];
}

function makeBaseAlerts(): DashboardV3Alert[] {
  return [
    {
      key: "refund-risk",
      title: "返金率の高い商品があります",
      severity: "medium",
      summary: "一部 SKU で返金率が直近平均を上回っています。",
    },
    {
      key: "ads-efficiency",
      title: "広告効率が低下しています",
      severity: "high",
      summary: "広告費は増加していますが、入金改善への寄与が限定的です。",
    },
  ];
}

function makeBaseExplainSummaries(): DashboardV3ExplainSummary[] {
  return [
    {
      key: "sales-vs-payout",
      title: "売上と入金の差額",
      summary: "主因は FBA手数料、広告費、返金です。",
    },
    {
      key: "margin-pressure",
      title: "利益率の圧迫要因",
      summary: "広告費と返金コストが利益を押し下げています。",
    },
  ];
}

export function makeDashboardV3CockpitMock(args: {
  businessView: BusinessViewType;
  range?: DashboardV3Range;
}): DashboardV3Cockpit {
  return {
    businessView: args.businessView,
    range: args.range ?? "30d",
    source: "mock",
    summaryKpis: makeBaseKpis(),
    trendSeries: makeBaseTrends(),
    distributions: makeBaseDistributions(),
    alerts: makeBaseAlerts(),
    explainSummaries: makeBaseExplainSummaries(),
  };
}
