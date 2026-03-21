import React from "react";
import type { ExportJobItem, ImportJobItem, MetaSummary } from "@/core/jobs";
import { AmazonReconciliationJobSummaryCard } from "./AmazonReconciliationJobSummaryCard";

export function AmazonReconciliationJobSection(props: {
  lang: string;
  importSummary: MetaSummary | null;
  exportSummary: MetaSummary | null;
  recentImport: ImportJobItem[];
  recentExport: ExportJobItem[];
}) {
  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <AmazonReconciliationJobSummaryCard
        mode="import"
        lang={props.lang}
        summary={props.importSummary}
        items={props.recentImport}
      />

      <AmazonReconciliationJobSummaryCard
        mode="export"
        lang={props.lang}
        summary={props.exportSummary}
        items={props.recentExport}
      />
    </section>
  );
}
