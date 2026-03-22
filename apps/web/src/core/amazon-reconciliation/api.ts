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


export type PersistedReconciliationDecisionQuery = {
  companyId?: string;
  page?: number;
  limit?: number;
  decision?: string;
  candidateId?: string;
  persistenceKey?: string;
};

export type PersistedReconciliationDecisionPage = {
  items: PersistedReconciliationDecisionRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  filters: {
    decision: string | null;
    candidateId: string | null;
    persistenceKey: string | null;
  };
};

export async function loadPersistedDecisionRecordsPage(
  args?: PersistedReconciliationDecisionQuery,
): Promise<PersistedReconciliationDecisionPage> {
  const companyId = resolveReconciliationCompanyId(args?.companyId);
  const page = args?.page ?? 1;
  const limit = args?.limit ?? 50;

  const params = new URLSearchParams();
  params.set("companyId", companyId);
  params.set("page", String(page));
  params.set("limit", String(limit));

  if (args?.decision) params.set("decision", args.decision);
  if (args?.candidateId) params.set("candidateId", args.candidateId);
  if (args?.persistenceKey) params.set("persistenceKey", args.persistenceKey);

  const response = await fetch(`/api/reconciliation-decisions?${params.toString()}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: {
      "x-company-id": companyId,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "failed to load persisted reconciliation decisions");
  }

  const json = await response.json();

  if (Array.isArray(json)) {
    return {
      items: json,
      total: json.length,
      page: 1,
      limit,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
      filters: {
        decision: args?.decision ?? null,
        candidateId: args?.candidateId ?? null,
        persistenceKey: args?.persistenceKey ?? null,
      },
    };
  }

  return json;
}

export async function loadPersistedDecisionRecords(
  args?: PersistedReconciliationDecisionQuery,
): Promise<PersistedReconciliationDecisionRecord[]> {
  const page = await loadPersistedDecisionRecordsPage(args);
  return page.items;
}


function resolveReconciliationCompanyId(explicitCompanyId?: string): string {
  const explicit = explicitCompanyId?.trim();
  if (explicit) return explicit;

  if (typeof window !== "undefined") {
    const win = window as typeof window & {
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

    if (workspaceContextCompanyId?.trim()) {
      return workspaceContextCompanyId.trim();
    }
  }

  throw new Error("companyId is required for reconciliation api transport");
}
