import { loadJobsSnapshot } from "@/core/jobs";
import {
  createFallbackMatchingBaselineSummary,
  deriveMatchingBaselineSummary,
  deriveMatchingSummaryCardModel,
} from "./matching";
import { deriveMatchingEngineSummary, deriveMatchingExecutionPreview, deriveMatchingCandidates, buildCandidateDecisionRecords, buildDecisionSubmitPayload } from "./matching-engine";
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
  const decisionRecords = buildCandidateDecisionRecords(matchingCandidates);
  const submitPayloadPreview = buildDecisionSubmitPayload({
    records: decisionRecords,
  });
  const submitResultPreview = null;

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
    decisionRecords,
    submitPayloadPreview,
    submitResultPreview,
  };
}

export { createFallbackMatchingBaselineSummary, deriveMatchingBaselineSummary };


export async function submitDecisionPayloadMock(args: {
  payload: import("./matching-engine").ReconciliationDecisionSubmitPayload;
}): Promise<import("./matching-engine").ReconciliationDecisionSubmitResult> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  return {
    acceptedCount: args.payload.items.length,
    submittedAt: args.payload.submittedAt,
    persistenceKeys: args.payload.items.map((item) => item.persistenceKey),
  };
}
