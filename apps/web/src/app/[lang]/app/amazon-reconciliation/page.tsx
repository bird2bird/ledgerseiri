"use client";

import React from "react";
import { useParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { AmazonReconciliationStatCard } from "@/components/app/amazon-reconciliation/AmazonReconciliationStatCard";
import { AmazonReconciliationHero } from "@/components/app/amazon-reconciliation/AmazonReconciliationHero";
import { AmazonReconciliationJobSummaryCard } from "@/components/app/amazon-reconciliation/AmazonReconciliationJobSummaryCard";
import { AmazonReconciliationMatchingSummaryCard } from "@/components/app/amazon-reconciliation/AmazonReconciliationMatchingSummaryCard";
import { AmazonReconciliationReadinessCard } from "@/components/app/amazon-reconciliation/AmazonReconciliationReadinessCard";
import { AmazonReconciliationQuickActionsCard } from "@/components/app/amazon-reconciliation/AmazonReconciliationQuickActionsCard";
import { AmazonReconciliationLoadingState } from "@/components/app/amazon-reconciliation/AmazonReconciliationLoadingState";
import { AmazonReconciliationErrorState } from "@/components/app/amazon-reconciliation/AmazonReconciliationErrorState";
import { useAmazonReconciliationPageState } from "@/components/app/amazon-reconciliation/useAmazonReconciliationPageState";

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
    matching,
    matchingCard,
    totalFailed,
  } = useAmazonReconciliationPageState();

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

  if (!snapshot || !matching || !matchingCard) {
    return (
      <AmazonReconciliationErrorState
        lang={lang}
        error="amazon reconciliation snapshot is unavailable"
        onReload={load}
      />
    );
  }

  return (
    <main className="space-y-6">
      <AmazonReconciliationHero lang={lang} onReload={load} />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <AmazonReconciliationStatCard
          title="Import Jobs"
          value={Number(importSummary?.total ?? snapshot.importItems.length ?? 0)}
          helper="import job total"
          tone="primary"
        />
        <AmazonReconciliationStatCard
          title="Export Jobs"
          value={Number(exportSummary?.total ?? snapshot.exportItems.length ?? 0)}
          helper="export job total"
          tone="success"
        />
        <AmazonReconciliationStatCard
          title="Failed Jobs"
          value={totalFailed}
          helper="import + export failed"
          tone="warning"
        />
        <AmazonReconciliationStatCard
          title="Current Mode"
          value="Connected"
          helper="real Step46 job baseline connected"
        />
      </section>

      <section className="grid grid-cols-1 gap-6">
        <AmazonReconciliationMatchingSummaryCard
          lang={lang}
          model={matchingCard}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <AmazonReconciliationJobSummaryCard
          mode="import"
          lang={lang}
          summary={importSummary}
          items={recentImport}
        />

        <AmazonReconciliationJobSummaryCard
          mode="export"
          lang={lang}
          summary={exportSummary}
          items={recentExport}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <AmazonReconciliationReadinessCard matching={matching} />
        <AmazonReconciliationQuickActionsCard lang={lang} />
      </section>
    </main>
  );
}
