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
import { deriveAutoApplySuggestions, submitDecisionPayload } from "@/core/amazon-reconciliation";
import { loadPersistedDecisionRecordsPage, loadReconciliationMetricsSummary } from "@/core/amazon-reconciliation/api";

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
  const [lastDecisionSnapshot, setLastDecisionSnapshot] = useState<
    Record<string, CandidateDecision | undefined> | null
  >(null);
  const [lastDecisionActionLabel, setLastDecisionActionLabel] = useState<string | null>(null);

  const captureDecisionSnapshot = (
    actionLabel: string,
    updater: (prev: Record<string, CandidateDecision | undefined>) => Record<string, CandidateDecision | undefined>,
  ) => {
    setCandidateDecisionById((prev) => {
      setLastDecisionSnapshot(prev);
      setLastDecisionActionLabel(actionLabel);
      return updater(prev);
    });
  };

  const handleUndoLastDecisionAction = () => {
    if (!lastDecisionSnapshot) return;
    setCandidateDecisionById(lastDecisionSnapshot);
    setLastDecisionSnapshot(null);
    setLastDecisionActionLabel(null);
  };

  const handleApproveCandidate = (candidateId: string) => {
    captureDecisionSnapshot("Approve Candidate", (prev) => ({
      ...prev,
      [candidateId]: "approved",
    }));
  };

  const handleRejectCandidate = (candidateId: string) => {
    captureDecisionSnapshot("Reject Candidate", (prev) => ({
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
    captureDecisionSnapshot("Batch Approve", (prev) => {
      const next = { ...prev };
      for (const candidateId of selectedCandidateIds) {
        next[candidateId] = "approved";
      }
      return next;
    });
  };

  const handleBatchReject = () => {
    captureDecisionSnapshot("Batch Reject", (prev) => {
      const next = { ...prev };
      for (const candidateId of selectedCandidateIds) {
        next[candidateId] = "rejected";
      }
      return next;
    });
  };

  const displayCandidates = useMemo(() => matchingCandidates, [matchingCandidates]);

  const autoApplySuggestions = useMemo(
    () => deriveAutoApplySuggestions({ candidates: displayCandidates }),
    [displayCandidates],
  );

  const handleApplySuggestions = () => {
    captureDecisionSnapshot("Apply Suggestions", (prev) => {
      const next = { ...prev };
      for (const suggestion of autoApplySuggestions) {
        next[suggestion.candidateId] = "approved";
      }
      return next;
    });
  };

  

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
  const [persistedDecisionPage, setPersistedDecisionPage] = useState(1);
  const [persistedDecisionLimit] = useState(5);
  const [persistedDecisionFilter, setPersistedDecisionFilter] = useState("");
  const [persistedDecisionCandidateQuery, setPersistedDecisionCandidateQuery] = useState("");
  const [persistedDecisionKeyQuery, setPersistedDecisionKeyQuery] = useState("");
  const [persistedDecisionTotal, setPersistedDecisionTotal] = useState(0);
  const [persistedDecisionTotalPages, setPersistedDecisionTotalPages] = useState(1);
  const [persistedDecisionHasNextPage, setPersistedDecisionHasNextPage] = useState(false);
  const [persistedDecisionHasPrevPage, setPersistedDecisionHasPrevPage] = useState(false);
  const [metricsSummary, setMetricsSummary] = useState<{
    totalDecisions: number;
    approvedCount: number;
    rejectedCount: number;
    approveRate: number;
    rejectRate: number;
    totalAudits: number;
    changedDecisionCount: number;
    unchangedDecisionCount: number;
    changeRate: number;
    autoApplyCount: number;
  } | null>(null);

  const metricsVisualization = useMemo(() => {
    if (!metricsSummary) return null;

    const approvedPct = Number((metricsSummary.approveRate * 100).toFixed(1));
    const rejectedPct = Number((metricsSummary.rejectRate * 100).toFixed(1));
    const changedPct = Number((metricsSummary.changeRate * 100).toFixed(1));
    const unchangedPct = Number((100 - changedPct).toFixed(1));

    return {
      approvedPct,
      rejectedPct,
      changedPct,
      unchangedPct,
      totalDecisions: metricsSummary.totalDecisions,
      totalAudits: metricsSummary.totalAudits,
      autoApplyCount: metricsSummary.autoApplyCount,
      approvedCount: metricsSummary.approvedCount,
      rejectedCount: metricsSummary.rejectedCount,
      changedDecisionCount: metricsSummary.changedDecisionCount,
      unchangedDecisionCount: metricsSummary.unchangedDecisionCount,
    };
  }, [metricsSummary]);


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
      const pageResult = await loadPersistedDecisionRecordsPage({
        page: persistedDecisionPage,
        limit: persistedDecisionLimit,
        decision: persistedDecisionFilter || undefined,
        candidateId: persistedDecisionCandidateQuery || undefined,
        persistenceKey: persistedDecisionKeyQuery || undefined,
      });
      setPersistedDecisionRecords(pageResult.items);
      setPersistedDecisionTotal(pageResult.total);
      setPersistedDecisionTotalPages(pageResult.totalPages);
      setPersistedDecisionHasNextPage(pageResult.hasNextPage);
      setPersistedDecisionHasPrevPage(pageResult.hasPrevPage);
    } catch (error) {
      setPersistedLoadError(
        error instanceof Error ? error.message : "failed to read persisted decisions",
      );
    }
  }, [
    persistedDecisionPage,
    persistedDecisionLimit,
    persistedDecisionFilter,
    persistedDecisionCandidateQuery,
    persistedDecisionKeyQuery,
  ]);

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


  React.useEffect(() => {
    void refreshPersistedDecisionRecords();
  }, [refreshPersistedDecisionRecords]);

  React.useEffect(() => {
    void (async () => {
      try {
        const summary = await loadReconciliationMetricsSummary();
        setMetricsSummary(summary);
      } catch {
        setMetricsSummary(null);
      }
    })();
  }, []);

  React.useEffect(() => {
    setPersistedDecisionPage(1);
  }, [
    persistedDecisionFilter,
    persistedDecisionCandidateQuery,
    persistedDecisionKeyQuery,
  ]);

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


      {metricsVisualization ? (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold text-slate-900">Decision Mix</div>
            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Approved</span>
                  <span>{metricsVisualization.approvedCount} / {metricsVisualization.approvedPct}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-slate-900 transition-all"
                    style={{ width: `${metricsVisualization.approvedPct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Rejected</span>
                  <span>{metricsVisualization.rejectedCount} / {metricsVisualization.rejectedPct}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-slate-500 transition-all"
                    style={{ width: `${metricsVisualization.rejectedPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold text-slate-900">Change Quality</div>
            <div className="mt-4 space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Changed</span>
                  <span>{metricsVisualization.changedDecisionCount} / {metricsVisualization.changedPct}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-slate-900 transition-all"
                    style={{ width: `${metricsVisualization.changedPct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Unchanged</span>
                  <span>{metricsVisualization.unchangedDecisionCount} / {metricsVisualization.unchangedPct}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-slate-400 transition-all"
                    style={{ width: `${metricsVisualization.unchangedPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold text-slate-900">Operational Snapshot</div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-[18px] bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Total Decisions</div>
                <div className="mt-2 text-xl font-semibold text-slate-900">
                  {metricsVisualization.totalDecisions}
                </div>
              </div>
              <div className="rounded-[18px] bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Total Audits</div>
                <div className="mt-2 text-xl font-semibold text-slate-900">
                  {metricsVisualization.totalAudits}
                </div>
              </div>
              <div className="rounded-[18px] bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Auto Apply</div>
                <div className="mt-2 text-xl font-semibold text-slate-900">
                  {metricsVisualization.autoApplyCount}
                </div>
              </div>
              <div className="rounded-[18px] bg-slate-50 p-4">
                <div className="text-xs text-slate-500">Change Rate</div>
                <div className="mt-2 text-xl font-semibold text-slate-900">
                  {metricsVisualization.changedPct}%
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {metricsSummary ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Total Decisions</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{metricsSummary.totalDecisions}</div>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Approved</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{metricsSummary.approvedCount}</div>
            <div className="mt-1 text-xs text-slate-500">
              {(metricsSummary.approveRate * 100).toFixed(1)}%
            </div>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Rejected</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{metricsSummary.rejectedCount}</div>
            <div className="mt-1 text-xs text-slate-500">
              {(metricsSummary.rejectRate * 100).toFixed(1)}%
            </div>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Changed Decisions</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{metricsSummary.changedDecisionCount}</div>
            <div className="mt-1 text-xs text-slate-500">
              {(metricsSummary.changeRate * 100).toFixed(1)}%
            </div>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Auto Apply</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{metricsSummary.autoApplyCount}</div>
            <div className="mt-1 text-xs text-slate-500">
              audits: {metricsSummary.totalAudits}
            </div>
          </div>
        </section>
      ) : null}

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
          <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm font-semibold text-slate-900">Persisted Decisions</div>
        <div className="mt-1 text-[12px] text-slate-500">
          Filter and paginate persisted reconciliation decisions.
        </div>
      </div>
      <div className="text-xs text-slate-500">
        total: {persistedDecisionTotal} / page: {persistedDecisionPage} of {persistedDecisionTotalPages}
      </div>
    </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
  <select
    value={persistedDecisionFilter}
    onChange={(event) => setPersistedDecisionFilter(event.target.value)}
    className="rounded-[18px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
  >
    <option value="">All decisions</option>
    <option value="approved">Approved</option>
    <option value="rejected">Rejected</option>
  </select>

  <input
    value={persistedDecisionCandidateQuery}
    onChange={(event) => setPersistedDecisionCandidateQuery(event.target.value)}
    placeholder="Search candidateId"
    className="rounded-[18px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
  />

  <input
    value={persistedDecisionKeyQuery}
    onChange={(event) => setPersistedDecisionKeyQuery(event.target.value)}
    placeholder="Search persistenceKey"
    className="rounded-[18px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
  />

  <button
    type="button"
    onClick={() => {
      setPersistedDecisionFilter("");
      setPersistedDecisionCandidateQuery("");
      setPersistedDecisionKeyQuery("");
      setPersistedDecisionPage(1);
    }}
    className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold"
  >
    Clear Filters
  </button>
</div>

<div className="mt-4 flex items-center justify-between gap-3">
  <button
    type="button"
    onClick={() => setPersistedDecisionPage((prev) => Math.max(1, prev - 1))}
    disabled={!persistedDecisionHasPrevPage}
    className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold disabled:opacity-50"
  >
    Previous
  </button>

  <div className="text-xs text-slate-500">
    Showing {persistedDecisionRecords.length} records
  </div>

  <button
    type="button"
    onClick={() => setPersistedDecisionPage((prev) => prev + 1)}
    disabled={!persistedDecisionHasNextPage}
    className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold disabled:opacity-50"
  >
    Next
  </button>
</div>

<div className="mt-3 space-y-3">
            {persistedDecisionRecords.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No persisted reconciliation decisions match the current filters.
              </div>
            ) : (
              persistedDecisionRecords.map((record) => (
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

        <section className="ls-card-solid rounded-[28px] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Undo / Rollback</div>
              <div className="mt-1 text-[12px] text-slate-500">
                Restore the most recent local batch or auto-apply decision change.
              </div>
            </div>

            <button
              type="button"
              onClick={handleUndoLastDecisionAction}
              disabled={!lastDecisionSnapshot}
              className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Undo Last Action
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-medium text-slate-500">Rollback Available</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {lastDecisionSnapshot ? "Yes" : "No"}
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-medium text-slate-500">Last Action</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {lastDecisionActionLabel ?? "-"}
              </div>
            </div>
          </div>
        </section>

        <section className="ls-card-solid rounded-[28px] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Auto-apply Suggestions</div>
              <div className="mt-1 text-[12px] text-slate-500">
                High-confidence candidates recommended for first-pass approval.
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplySuggestions}
              disabled={autoApplySuggestions.length === 0}
              className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply Suggestions
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-medium text-slate-500">Suggested</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {autoApplySuggestions.length}
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-medium text-slate-500">Threshold</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                90%
              </div>
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-medium text-slate-500">Decision</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                Approve
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {autoApplySuggestions.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No high-confidence auto-apply suggestions yet.
              </div>
            ) : (
              autoApplySuggestions.map((suggestion) => (
                <div
                  key={suggestion.candidateId}
                  className="rounded-[22px] border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {suggestion.candidateId}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {suggestion.reason}
                      </div>
                    </div>

                    <div className="text-sm font-semibold text-slate-900">
                      {Math.round(suggestion.confidence * 100)}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>






      <AmazonReconciliationBottomSection
        lang={lang}
        matching={matching}
      />
    </main>
  );
}
