export type DashboardMetricSemantic = {
  key: string;
  label: string;
  definition: string;
  whyItMatters: string;
};

export const DASHBOARD_V3_METRIC_SEMANTICS: DashboardMetricSemantic[] = [
  {
    key: "sales",
    label: "売上",
    definition: "対象期間の販売総額。",
    whyItMatters: "需要の大きさと販売規模を把握するための起点です。",
  },
  {
    key: "payout",
    label: "入金",
    definition: "実際に受け取った金額。",
    whyItMatters: "キャッシュとして入ってきた実額を把握できます。",
  },
  {
    key: "gap",
    label: "差額",
    definition: "売上と入金のズレ。",
    whyItMatters: "手数料・広告費・返金など、利益や資金繰りへの圧力を可視化します。",
  },
  {
    key: "orders",
    label: "注文数",
    definition: "対象期間の注文件数。",
    whyItMatters: "売上変化が単価起因か件数起因かを見る判断材料になります。",
  },
];

export function getDashboardMetricSemantics() {
  return DASHBOARD_V3_METRIC_SEMANTICS;
}
