import type { BusinessViewType } from "@/core/business-view";
import type { DashboardV3ExplainSummary } from "@/core/dashboard-v3/types";
import { getAmazonPayoutExplainMock } from "@/core/explain/amazon-payout-explain";

export function getDashboardV3ExplainSummaries(args: {
  businessView: BusinessViewType;
}): DashboardV3ExplainSummary[] {
  if (args.businessView === "amazon") {
    const explain = getAmazonPayoutExplainMock();

    return [
      {
        key: "sales-vs-payout",
        title: "売上と入金の差額",
        summary: explain.summary,
      },
      {
        key: "coverage-status",
        title: "Explain coverage",
        summary: explain.coverageNote,
      },
    ];
  }

  if (args.businessView === "ec") {
    return [
      {
        key: "ec-cash-conversion",
        title: "売上と回収の確認",
        summary: "売上と実際の入金・回収タイミングの差を重点的に確認します。",
      },
    ];
  }

  if (args.businessView === "restaurant") {
    return [
      {
        key: "restaurant-margin",
        title: "売上と利益圧力",
        summary: "売上に対して原価と日次費用がどの程度利益を圧迫しているかを確認します。",
      },
    ];
  }

  return [
    {
      key: "generic-cash-ops",
      title: "売上と資金繰り",
      summary: "売上・入金・費用の関係を整理して経営の見通しを立てます。",
    },
  ];
}
