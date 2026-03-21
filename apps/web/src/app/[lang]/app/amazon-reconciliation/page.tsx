"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { AmazonReconciliationStatsSection } from "@/components/app/amazon-reconciliation/AmazonReconciliationStatsSection";
import { AmazonReconciliationHero } from "@/components/app/amazon-reconciliation/AmazonReconciliationHero";
import { AmazonReconciliationJobSection } from "@/components/app/amazon-reconciliation/AmazonReconciliationJobSection";
import { AmazonReconciliationMatchingSection } from "@/components/app/amazon-reconciliation/AmazonReconciliationMatchingSection";
import { AmazonReconciliationEngineSummaryCard } from "@/components/app/amazon-reconciliation/AmazonReconciliationEngineSummaryCard";
import { AmazonReconciliationExecutionPreviewCard } from "@/components/app/amazon-reconciliation/AmazonReconciliationExecutionPreviewCard";
import { AmazonReconciliationCandidateListCard } from "@/components/app/amazon-reconciliation/AmazonReconciliationCandidateListCard";
import { AmazonReconciliationBottomSection } from "@/components/app/amazon-reconciliation/AmazonReconciliationBottomSection";
import { AmazonReconciliationLoadingState } from "@/components/app/amazon-reconciliation/AmazonReconciliationLoadingState";
import { AmazonReconciliationErrorState } from "@/components/app/amazon-reconciliation/AmazonReconciliationErrorState";
import { useAmazonReconciliationPageState } from "@/components/app/amazon-reconciliation/useAmazonReconciliationPageState";
import { loadPersistedDecisionRecords, submitDecisionPayload } from "@/core/amazon-reconciliation";

type CandidateDecision = "approved" | "rejected";

type SubmittedDecisionRecord = {
  candidateId: string;
  decision: CandidateDecision | "pending";
  persistenceKey: string;
  confidence: number;
};

export default function AmazonReconciliationPage() {
  const params = useParams<{ lang: string }>();
  const lang = normalizeLang(params?.lang) as Lang;

  const {
    loading,
    error,
    snapshot,
    load,
    importSummary,
    exportSummary,
    recentImport,
    recentExport,
  engineSummary,
    executionPreview,
    matchingCandidates,
    decisionRecords,
    submitPayloadPreview,
    submitResultPreview,
    } = useAmazonReconciliationPageState();

  const [candidateDecisionById, setCandidateDecisionById] = useState<
    Record<string, CandidateDecision | undefined>
  >({});
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);

  const handleApproveCandidate = (candidateId: string) => {
    setCandidateDecisionById((prev) => ({
      ...prev,
      [candidateId]: "approved",
    }));
  };

  const handleRejectCandidate = (candidateId: string) => {
    setCandidateDecisionById((prev) => ({
      ...prev,
      [candidateId]: "rejected",
    }));
  };

  const handleToggleCandidateSelection = (candidateId: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId],
    );
  };

  const handleSelectAllVisible = () => {
    setSelectedCandidateIds(matchingCandidates.map((candidate) => candidate.id));
  };

  const handleClearSelection = () => {
    setSelectedCandidateIds([]);
  };

  const handleBatchApprove = () => {
    setCandidateDecisionById((prev) => {
      const next = { ...prev };
      for (const candidateId of selectedCandidateIds) {
        next[candidateId] = "approved";
      }
      return next;
    });
  };

  const handleBatchReject = () => {
    setCandidateDecisionById((prev) => {
      const next = { ...prev };
      for (const candidateId of selectedCandidateIds) {
        next[candidateId] = "rejected";
      }
      return next;
    });
  };

  const displayCandidates = useMemo(() => matchingCandidates, [matchingCandidates]);

  

  const [isSubmittingDecisions, setIsSubmittingDecisions] = useState(false);
  const [submittedDecisionRecords, setSubmittedDecisionRecords] = useState<SubmittedDecisionRecord[]>([]);
  const [lastSubmittedAt, setLastSubmittedAt] = useState<string | null>(null);
  const [persistedDecisionRecords, setPersistedDecisionRecords] = useState<
    Array<{
      id: string;
      candidateId: string;
      decision: string;
      persistenceKey: string;
      confidence: number;
      submittedAt: string;
      createdAt: string;
      updatedAt: string;
    }>
  >([]);

  const persistedDecisionByCandidateId = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    for (const record of persistedDecisionRecords) {
      map[record.candidateId] = record.decision;
    }
    return map;
  }, [persistedDecisionRecords]);
  const [persistedLoadError, setPersistedLoadError] = useState("");

  const decisionRecordsForSubmit = useMemo<SubmittedDecisionRecord[]>(() => {
    return decisionRecords.map((record) => {
      const localDecision = candidateDecisionById[record.candidateId];
      return {
        candidateId: record.candidateId,
        decision: localDecision ?? record.decision,
        persistenceKey: record.persistenceKey,
        confidence: record.confidence,
      };
    });
  }, [candidateDecisionById, decisionRecords]);

  const effectiveSubmitPayload = useMemo(() => {
    const previewItems = submitPayloadPreview?.items ?? [];
    const itemByCandidateId = new Map(previewItems.map((item) => [item.candidateId, item]));

    return {
      submittedAt: new Date().toISOString(),
      items: decisionRecordsForSubmit
        .filter((record) => record.decision !== "pending")
        .map((record) => {
          const preview = itemByCandidateId.get(record.candidateId);
          return {
            candidateId: record.candidateId,
            decision: (record.decision === "approved" ? "approved" : "rejected") as "approved" | "rejected",
            persistenceKey: preview?.persistenceKey ?? record.persistenceKey,
            confidence: preview?.confidence ?? record.confidence,
          };
        }),
    };
  }, [decisionRecordsForSubmit, submitPayloadPreview]);

  const refreshPersistedDecisionRecords = useCallback(async () => {
    try {
      setPersistedLoadError("");
      const rows = await loadPersistedDecisionRecords();
      setPersistedDecisionRecords(rows);
    } catch (error) {
      setPersistedLoadError(
        error instanceof Error ? error.message : "failed to read persisted decisions",
      );
    }
  }, []);

  const handleMockSubmitDecisions = useCallback(async () => {
    setIsSubmittingDecisions(true);

    try {
      const result = await submitDecisionPayload({
        payload: effectiveSubmitPayload,
      });

      setSubmittedDecisionRecords(decisionRecordsForSubmit);
      setLastSubmittedAt(result.submittedAt);
      await refreshPersistedDecisionRecords();
      await load();
    } finally {
      setIsSubmittingDecisions(false);
    }
  }, [decisionRecordsForSubmit, effectiveSubmitPayload, load, refreshPersistedDecisionRecords]);

  if (loading) {
    return <AmazonReconciliationLoadingState />;
  }

  if (error) {
    return (
      <AmazonReconciliationErrorState
        lang={lang}
        error={error}
        onReload={load}
      />
    );
  }
  React.useEffect(() => {
    void refreshPersistedDecisionRecords();
  }, [refreshPersistedDecisionRecords]);


  if (!snapshot) {
      return (
        <AmazonReconciliationErrorState
          lang={lang}
          error="amazon reconciliation snapshot is unavailable"
          onReload={load}
        />
      );
    }

    const matching = snapshot.matching;
    const matchingCard = snapshot.matchingCard;
    const totalFailed = Number(snapshot.matching.totalFailedJobs);

  return (
    <main className="space-y-6">
      <AmazonReconciliationHero lang={lang} onReload={load} />

      <AmazonReconciliationStatsSection
        importJobsCount={Number(importSummary?.total ?? snapshot.importItems.length ?? 0)}
        exportJobsCount={Number(exportSummary?.total ?? snapshot.exportItems.length ?? 0)}
        totalFailed={totalFailed}
      />

      <AmazonReconciliationMatchingSection
        lang={lang}
        model={matchingCard}
      />

        {engineSummary && (
          <AmazonReconciliationEngineSummaryCard
            lang={lang}
            model={engineSummary}
          />
        )}

        {executionPreview && (
          <AmazonReconciliationExecutionPreviewCard
            model={executionPreview}
          />
        )}

        <AmazonReconciliationCandidateListCard
          candidates={displayCandidates}
          decisionById={candidateDecisionById}
          persistedDecisionByCandidateId={persistedDecisionByCandidateId}
          selectedCandidateIds={selectedCandidateIds}
          onToggleCandidateSelection={handleToggleCandidateSelection}
          onSelectAllVisible={handleSelectAllVisible}
          onClearSelection={handleClearSelection}
          onBatchApprove={handleBatchApprove}
          onBatchReject={handleBatchReject}
          onApprove={handleApproveCandidate}
          onReject={handleRejectCandidate}
        />

      <AmazonReconciliationJobSection
        lang={lang}
        importSummary={importSummary}
        exportSummary={exportSummary}
        recentImport={recentImport}
        recentExport={recentExport}
      />
        <section className="ls-card-solid rounded-[28px] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Decision Persistence Preview</div>
              <div className="mt-1 text-[12px] text-slate-500">
                Mock submit flow for candidate decisions before API persistence is added.
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleMockSubmitDecisions()}
              disabled={isSubmittingDecisions || decisionRecordsForSubmit.length === 0}
              className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmittingDecisions ? "Saving..." : "Save Decisions"}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-medium text-slate-500">Ready to Submit</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {effectiveSubmitPayload.items.length}
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-medium text-slate-500">Submitted</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {submittedDecisionRecords.length}
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-medium text-slate-500">Persisted</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {persistedDecisionRecords.length}
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-medium text-slate-500">Last Submitted</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                {lastSubmittedAt
                  ? new Intl.DateTimeFormat("ja-JP", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(lastSubmittedAt))
                  : "-"}
              </div>
            </div>
          </div>

          {persistedLoadError ? (
            <div className="mt-5 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {persistedLoadError}
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            {decisionRecordsForSubmit.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No decision payload available yet.
              </div>
            ) : (
              decisionRecordsForSubmit.slice(0, 5).map((record) => (
                <div
                  key={record.candidateId}
                  className="rounded-[22px] border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{record.candidateId}</div>
                      <div className="mt-1 text-xs text-slate-500">{record.persistenceKey}</div>
                    </div>

                    <div className="text-sm font-semibold text-slate-900">{record.decision}</div>
                  </div>

                  <div className="mt-3 text-sm text-slate-600">
                    confidence: {Math.round(record.confidence * 100)}%
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
        <div className="mt-5">
          <div className="text-sm font-semibold text-slate-900">Persisted Decisions</div>
          <div className="mt-3 space-y-3">
            {persistedDecisionRecords.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No persisted reconciliation decisions yet.
              </div>
            ) : (
              persistedDecisionRecords.slice(0, 5).map((record) => (
                <div
                  key={record.id}
                  className="rounded-[22px] border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {record.candidateId}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {record.persistenceKey}
                      </div>
                    </div>

                    <div className="text-sm font-semibold text-slate-900">
                      {record.decision}
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-slate-600">
                    submitted:{" "}
                    {new Intl.DateTimeFormat("ja-JP", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(record.submittedAt))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>




      <AmazonReconciliationBottomSection
        lang={lang}
        matching={matching}
      />
    </main>
  );
}
