import { loadJobsSnapshot } from "@/core/jobs";
import {
  createFallbackMatchingBaselineSummary,
  deriveMatchingBaselineSummary,
  deriveMatchingSummaryCardModel,
} from "./matching";
import { deriveMatchingEngineSummary, deriveMatchingExecutionPreview, deriveMatchingCandidates } from "./matching-engine";
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


  const resolvedMatching = matching ?? createFallbackMatchingBaselineSummary();
  const matchingCard = deriveMatchingSummaryCardModel(resolvedMatching);
  const engineSummary = deriveMatchingEngineSummary({
    matching: resolvedMatching,
    importItems,
    exportItems,
    importSummary,
    exportSummary,
  });
  const executionPreview = deriveMatchingExecutionPreview({
    engineSummary,
    importItems,
    exportItems,
  });
  const matchingCandidates = deriveMatchingCandidates({
    engineSummary,
    importItems,
    exportItems,
  });

  return {
    importItems,
    exportItems,
    importSummary,
    exportSummary,
    matching: resolvedMatching,
    matchingCard,
    engineSummary,
    executionPreview,
    matchingCandidates,
  };
}

export { createFallbackMatchingBaselineSummary, deriveMatchingBaselineSummary };
