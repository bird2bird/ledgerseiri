import { loadJobsSnapshot } from "@/core/jobs";
import {
  createFallbackMatchingBaselineSummary,
  deriveMatchingBaselineSummary,
} from "./matching";
import type { AmazonReconciliationSnapshot } from "./types";

export async function loadAmazonReconciliationSnapshot(): Promise<AmazonReconciliationSnapshot> {
  const jobs = await loadJobsSnapshot();

  const importItems = jobs.importItems;
  const exportItems = jobs.exportItems;
  const importSummary = jobs.importMeta?.summary ?? null;
  const exportSummary = jobs.exportMeta?.summary ?? null;

  const matching = deriveMatchingBaselineSummary({
    importItems,
    exportItems,
    importSummary,
    exportSummary,
  });

  return {
    importItems,
    exportItems,
    importSummary,
    exportSummary,
    matching: matching ?? createFallbackMatchingBaselineSummary(),
  };
}

export { createFallbackMatchingBaselineSummary, deriveMatchingBaselineSummary };
