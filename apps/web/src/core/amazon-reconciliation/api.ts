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
  companyId?: string;
}): Promise<import("./matching-engine").ReconciliationDecisionSubmitResult> {
  const companyId = resolveReconciliationCompanyId(args.companyId);
  const response = await fetch(
    `/api/reconciliation-decisions?companyId=${encodeURIComponent(companyId)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-company-id": companyId,
      },
      credentials: "include",
      body: JSON.stringify(args.payload),
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "failed to submit reconciliation decisions");
  }

  return response.json();
}


export type PersistedReconciliationDecisionRecord = {
  id: string;
  candidateId: string;
  decision: string;
  persistenceKey: string;
  confidence: number;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
};

export async function loadPersistedDecisionRecords(args?: {
  companyId?: string;
}): Promise<PersistedReconciliationDecisionRecord[]> {
  const companyId = resolveReconciliationCompanyId(args?.companyId);
  const response = await fetch(
    `/api/reconciliation-decisions?companyId=${encodeURIComponent(companyId)}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        "x-company-id": companyId,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "failed to load persisted reconciliation decisions");
  }

  return response.json();
}


function resolveReconciliationCompanyId(explicitCompanyId?: string): string {
  if (explicitCompanyId) return explicitCompanyId;

  if (typeof window !== "undefined") {
    const win = window as typeof window & {
      __LS_COMPANY_ID__?: string;
      __LS_WORKSPACE_CONTEXT__?: {
        companyId?: string;
        workspaceId?: string;
        company?: {
          id?: string;
        };
      };
    };

    const workspaceContextCompanyId =
      win.__LS_WORKSPACE_CONTEXT__?.companyId ||
      win.__LS_WORKSPACE_CONTEXT__?.company?.id;

    if (workspaceContextCompanyId) return workspaceContextCompanyId;

    if (win.__LS_COMPANY_ID__) return win.__LS_COMPANY_ID__;

    const fromLocalStorage =
      window.localStorage.getItem("ls_company_id") ||
      window.localStorage.getItem("companyId") ||
      window.localStorage.getItem("workspace_company_id");

    if (fromLocalStorage) return fromLocalStorage;
  }

  return "demo-company";
}
