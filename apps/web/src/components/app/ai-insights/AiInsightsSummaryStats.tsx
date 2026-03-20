import React from "react";
import { AiInsightsStatCard } from "./AiInsightsStatCard";

export function AiInsightsSummaryStats(props: {
  summary: {
    revenue?: number;
    profit?: number;
    unpaidAmount?: number;
    unpaidCount?: number;
    runwayMonths?: number;
    cash?: number;
  };
  profitMarginPct?: number;
  fmtJPY: (value?: number | null) => string;
}) {
  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
      <AiInsightsStatCard
        title="売上"
        value={props.fmtJPY(props.summary.revenue)}
        helper="dashboard summary"
        tone="primary"
      />
      <AiInsightsStatCard
        title="利益"
        value={props.fmtJPY(props.summary.profit)}
        helper={`profit margin ${Number(props.profitMarginPct ?? 0).toFixed(1)}%`}
        tone="success"
      />
      <AiInsightsStatCard
        title="未入金"
        value={props.fmtJPY(props.summary.unpaidAmount)}
        helper={`${props.summary.unpaidCount ?? 0} 件の未回収`}
        tone="warning"
      />
      <AiInsightsStatCard
        title="資金余力"
        value={`${props.summary.runwayMonths ?? 0} ヶ月`}
        helper={`現金 ${props.fmtJPY(props.summary.cash)}`}
        tone="default"
      />
    </section>
  );
}
