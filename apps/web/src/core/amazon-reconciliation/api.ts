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


export async function submitDecisionPayload(args: {
  payload: import("./matching-engine").ReconciliationDecisionSubmitPayload;
}): Promise<import("./matching-engine").ReconciliationDecisionSubmitResult> {
  const response = await fetch("/api/reconciliation-decisions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(args.payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "failed to submit reconciliation decisions");
  }

  return response.json();
}
