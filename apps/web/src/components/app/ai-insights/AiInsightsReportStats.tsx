import React from "react";
import { AiInsightsStatCard } from "./AiInsightsStatCard";

export function AiInsightsReportStats(props: {
  incomeSummary?: Record<string, number>;
  expenseSummary?: Record<string, number>;
  cashflowSummary?: Record<string, number>;
  fmtJPY: (value?: number | null) => string;
}) {
  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <AiInsightsStatCard
        title="Income Report"
        value={props.fmtJPY(props.incomeSummary?.totalIncome)}
        helper={`rows ${Number(props.incomeSummary?.rowsCount ?? 0)}`}
        tone="primary"
      />
      <AiInsightsStatCard
        title="Expense Report"
        value={props.fmtJPY(props.expenseSummary?.totalExpense)}
        helper={`rows ${Number(props.expenseSummary?.rowsCount ?? 0)}`}
        tone="default"
      />
      <AiInsightsStatCard
        title="Cash Flow"
        value={props.fmtJPY(props.cashflowSummary?.netCash)}
        helper={`cash in ${props.fmtJPY(props.cashflowSummary?.cashIn)}`}
        tone="success"
      />
    </section>
  );
}
