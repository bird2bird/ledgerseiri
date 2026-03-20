"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import {
  loadAmazonReconciliationSnapshot,
  type AmazonReconciliationSnapshot,
} from "@/core/amazon-reconciliation";
import {
  type ExportJobItem,
  type ImportJobItem,
  type MetaSummary,
} from "@/core/jobs";
import { AmazonReconciliationStatCard } from "@/components/app/amazon-reconciliation/AmazonReconciliationStatCard";
import { AmazonReconciliationHero } from "@/components/app/amazon-reconciliation/AmazonReconciliationHero";
import { AmazonReconciliationJobSummaryCard } from "@/components/app/amazon-reconciliation/AmazonReconciliationJobSummaryCard";
import { AmazonReconciliationReadinessCard } from "@/components/app/amazon-reconciliation/AmazonReconciliationReadinessCard";
import { AmazonReconciliationQuickActionsCard } from "@/components/app/amazon-reconciliation/AmazonReconciliationQuickActionsCard";
import { AmazonReconciliationLoadingState } from "@/components/app/amazon-reconciliation/AmazonReconciliationLoadingState";
import { AmazonReconciliationErrorState } from "@/components/app/amazon-reconciliation/AmazonReconciliationErrorState";
import { selectRecentJobs } from "@/components/app/amazon-reconciliation/amazon-reconciliation-shared";

export default function AmazonReconciliationPage() {
  const params = useParams<{ lang: string }>();
  const lang = normalizeLang(params?.lang) as Lang;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [snapshot, setSnapshot] = useState<AmazonReconciliationSnapshot | null>(null);

  const importItems: ImportJobItem[] = snapshot?.importItems ?? [];
  const exportItems: ExportJobItem[] = snapshot?.exportItems ?? [];
  const importSummary: MetaSummary | null = snapshot?.importSummary ?? null;
  const exportSummary: MetaSummary | null = snapshot?.exportSummary ?? null;

  async function load() {
    setLoading(true);
    setError("");

    try {
      const nextSnapshot = await loadAmazonReconciliationSnapshot();
      setSnapshot(nextSnapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to load reconciliation jobs");
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const recentImport = useMemo(() => selectRecentJobs(importItems, 8), [importItems]);
  const recentExport = useMemo(() => selectRecentJobs(exportItems, 8), [exportItems]);

  const totalFailed = Number(snapshot?.totalFailed ?? 0);

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

  return (
    <main className="space-y-6">
      <AmazonReconciliationHero lang={lang} onReload={load} />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <AmazonReconciliationStatCard
          title="Import Jobs"
          value={Number(importSummary?.total ?? importItems.length)}
          helper="import job total"
          tone="primary"
        />
        <AmazonReconciliationStatCard
          title="Export Jobs"
          value={Number(exportSummary?.total ?? exportItems.length)}
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
        <AmazonReconciliationReadinessCard />
        <AmazonReconciliationQuickActionsCard lang={lang} />
      </section>
    </main>
  );
}
