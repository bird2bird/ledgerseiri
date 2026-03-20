import type { ExportJobItem, ImportJobItem, MetaSummary } from "@/core/jobs";

export type AmazonReconciliationSnapshot = {
  importItems: ImportJobItem[];
  exportItems: ExportJobItem[];
  importSummary: MetaSummary | null;
  exportSummary: MetaSummary | null;
  totalFailed: number;
};
