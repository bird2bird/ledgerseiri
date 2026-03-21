import React from "react";
import { AmazonReconciliationStatCard } from "@/components/app/amazon-reconciliation/AmazonReconciliationStatCard";

export function AmazonReconciliationStatsSection(props: {
  importJobsCount: number;
  exportJobsCount: number;
  totalFailed: number;
}) {
  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
      <AmazonReconciliationStatCard
        title="Import Jobs"
        value={props.importJobsCount}
        helper="import job total"
        tone="primary"
      />
      <AmazonReconciliationStatCard
        title="Export Jobs"
        value={props.exportJobsCount}
        helper="export job total"
        tone="success"
      />
      <AmazonReconciliationStatCard
        title="Failed Jobs"
        value={props.totalFailed}
        helper="import + export failed"
        tone="warning"
      />
      <AmazonReconciliationStatCard
        title="Current Mode"
        value="Connected"
        helper="real Step46 job baseline connected"
      />
    </section>
  );
}
