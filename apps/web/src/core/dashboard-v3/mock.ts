import type { BusinessViewType } from "@/core/business-view";
import type {
  DashboardV3Cockpit,
  DashboardV3DistributionBlock,
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
      { key: "payout", label: "回収", value: 398000, unit: "JPY", deltaLabel: "+4.0%" },
      { key: "gap", label: "未回収差額", value: 62000, unit: "JPY", deltaLabel: "-1.3%" },
      { key: "orders", label: "受注数", value: 154, unit: "count", deltaLabel: "+3.9%" },
    ];
  }

  if (view === "restaurant") {
    return [
      { key: "sales", label: "売上", value: 680000, unit: "JPY", deltaLabel: "+3.5%" },
      { key: "payout", label: "入金", value: 655000, unit: "JPY", deltaLabel: "+3.1%" },
      { key: "gap", label: "利益圧力", value: 25000, unit: "JPY", deltaLabel: "-0.6%" },
      { key: "orders", label: "来店/注文", value: 920, unit: "count", deltaLabel: "+2.2%" },
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
  if (view === "restaurant") {
    return [
      {
        key: "sales-orders",
        title: "売上 / 来店トレンド",
        primaryLabel: "売上",
        secondaryLabel: "来店/注文",
        points: [
          { label: "W1", value: 150000, secondaryValue: 210 },
          { label: "W2", value: 168000, secondaryValue: 225 },
          { label: "W3", value: 176000, secondaryValue: 235 },
          { label: "W4", value: 186000, secondaryValue: 250 },
        ],
      },
      {
        key: "payout-gap",
        title: "入金 / 利益圧力トレンド",
        primaryLabel: "入金",
        secondaryLabel: "利益圧力",
        points: [
          { label: "W1", value: 158000, secondaryValue: 7000 },
          { label: "W2", value: 161000, secondaryValue: 5000 },
          { label: "W3", value: 166000, secondaryValue: 6000 },
          { label: "W4", value: 170000, secondaryValue: 7000 },
        ],
      },
    ];
  }

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

  if (view === "ec") {
    return [
      {
        key: "cost-breakdown",
        title: "費用構成",
        items: [
          { key: "shipping", label: "配送費", value: 32000 },
          { key: "ads", label: "広告費", value: 21000 },
          { key: "returns", label: "返品", value: 9000 },
          { key: "other", label: "その他", value: 12000 },
        ],
      },
      {
        key: "channel-breakdown",
        title: "チャネル構成",
        items: [
          { key: "shop", label: "自社EC", value: 260000 },
          { key: "mall", label: "モール", value: 200000 },
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
      {
        key: "payout-gap-pressure",
        title: "差額圧力が継続しています",
        severity: "high",
        summary: "差額が高止まりしており、利益と入金の圧迫が続いています。",
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
      {
        key: "labor-pressure",
        title: "人件費圧力が上昇しています",
        severity: "medium",
        summary: "ピーク時間帯の人件費負担が増えています。",
      },
    ];
  }

  if (view === "ec") {
    return [
      {
        key: "cash-ops-watch",
        title: "回収タイミングの確認が必要です",
        severity: "medium",
        summary: "売上計上と実際の回収タイミングの差が広がっています。",
      },
      {
        key: "cost-pressure",
        title: "配送・返品コストが増加しています",
        severity: "high",
        summary: "配送費と返品コストが粗利を圧迫しています。",
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
