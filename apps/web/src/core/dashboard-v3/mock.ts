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
import { getDashboardV3ExplainSummaries } from "@/core/dashboard-v3/explain-provider";

function makeBaseKpis(view: BusinessViewType): DashboardV3Kpi[] {
  if (view === "amazon") {
    return [
      { key: "sales", label: "売上", value: 520000, unit: "JPY", deltaLabel: "+8.2%" },
      { key: "payout", label: "入金", value: 412000, unit: "JPY", deltaLabel: "+5.0%" },
      { key: "gap", label: "差額", value: 108000, unit: "JPY", deltaLabel: "-2.1%" },
      { key: "orders", label: "注文数", value: 182, unit: "count", deltaLabel: "+6.4%" },
    ];
  }

  if (view === "ec") {
    return [
      { key: "sales", label: "売上", value: 460000, unit: "JPY", deltaLabel: "+5.1%" },
      { key: "payout", label: "入金", value: 398000, unit: "JPY", deltaLabel: "+4.0%" },
      { key: "gap", label: "差額", value: 62000, unit: "JPY", deltaLabel: "-1.3%" },
      { key: "orders", label: "注文数", value: 154, unit: "count", deltaLabel: "+3.9%" },
    ];
  }

  if (view === "restaurant") {
    return [
      { key: "sales", label: "売上", value: 680000, unit: "JPY", deltaLabel: "+3.5%" },
      { key: "payout", label: "入金", value: 655000, unit: "JPY", deltaLabel: "+3.1%" },
      { key: "gap", label: "差額", value: 25000, unit: "JPY", deltaLabel: "-0.6%" },
      { key: "orders", label: "注文数", value: 920, unit: "count", deltaLabel: "+2.2%" },
    ];
  }

  return [
    { key: "sales", label: "売上", value: 390000, unit: "JPY", deltaLabel: "+4.0%" },
    { key: "payout", label: "入金", value: 352000, unit: "JPY", deltaLabel: "+2.8%" },
    { key: "gap", label: "差額", value: 38000, unit: "JPY", deltaLabel: "-0.9%" },
    { key: "orders", label: "案件数", value: 96, unit: "count", deltaLabel: "+2.1%" },
  ];
}

function makeBaseTrends(view: BusinessViewType): DashboardV3TrendSeries[] {
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

function makeBaseDistributions(view: BusinessViewType): DashboardV3DistributionBlock[] {
  if (view === "restaurant") {
    return [
      {
        key: "cost-breakdown",
        title: "費用構成",
        items: [
          { key: "food", label: "食材原価", value: 120000 },
          { key: "labor", label: "人件費", value: 180000 },
          { key: "rent", label: "家賃等", value: 70000 },
          { key: "other", label: "その他", value: 30000 },
        ],
      },
      {
        key: "channel-breakdown",
        title: "売上構成",
        items: [
          { key: "in-store", label: "店内", value: 520000 },
          { key: "delivery", label: "配達", value: 160000 },
        ],
      },
    ];
  }

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

function makeBaseAlerts(view: BusinessViewType): DashboardV3Alert[] {
  if (view === "amazon") {
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

  if (view === "restaurant") {
    return [
      {
        key: "food-cost-pressure",
        title: "原価率が上昇しています",
        severity: "high",
        summary: "一部週で食材原価率が通常範囲を超えています。",
      },
    ];
  }

  return [
    {
      key: "cash-ops-watch",
      title: "資金繰り確認が必要です",
      severity: "medium",
      summary: "入金タイミングと費用発生タイミングの差を確認してください。",
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
    summaryKpis: makeBaseKpis(args.businessView),
    trendSeries: makeBaseTrends(args.businessView),
    distributions: makeBaseDistributions(args.businessView),
    alerts: makeBaseAlerts(args.businessView),
    explainSummaries: getDashboardV3ExplainSummaries({
      businessView: args.businessView,
    }),
  };
}
