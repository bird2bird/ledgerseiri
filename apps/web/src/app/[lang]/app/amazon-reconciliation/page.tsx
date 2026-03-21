"use client";

import React, { useMemo, useState } from "react";
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

type CandidateDecision = "approved" | "rejected";

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
    } = useAmazonReconciliationPageState();

  const [candidateDecisionById, setCandidateDecisionById] = useState<
    Record<string, CandidateDecision | undefined>
  >({});

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

  const displayCandidates = useMemo(() => matchingCandidates, [matchingCandidates]);

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

      <AmazonReconciliationBottomSection
        lang={lang}
        matching={matching}
      />
    </main>
  );
}
