"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ExportJobItem, ImportJobItem, MetaSummary } from "@/core/jobs";
import type { AmazonReconciliationSnapshot } from "@/core/amazon-reconciliation";
import { loadAmazonReconciliationSnapshot } from "@/core/amazon-reconciliation";
import { selectRecentJobs } from "./amazon-reconciliation-shared";

export function useAmazonReconciliationPageState() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState<AmazonReconciliationSnapshot | null>(null);

  const load = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const importItems: ImportJobItem[] = snapshot?.importItems ?? [];
  const exportItems: ExportJobItem[] = snapshot?.exportItems ?? [];
  const importSummary: MetaSummary | null = snapshot?.importSummary ?? null;
  const exportSummary: MetaSummary | null = snapshot?.exportSummary ?? null;

  const recentImport = useMemo(() => selectRecentJobs(importItems, 8), [importItems]);
  const recentExport = useMemo(() => selectRecentJobs(exportItems, 8), [exportItems]);

  const engineSummary = snapshot?.engineSummary ?? null;
    const executionPreview = snapshot?.executionPreview ?? null;
    const matchingCandidates = snapshot?.matchingCandidates ?? [];
    const decisionRecords = snapshot?.decisionRecords ?? [];
    const submitPayloadPreview = snapshot?.submitPayloadPreview ?? null;
    const submitResultPreview = snapshot?.submitResultPreview ?? null;
    const matching = snapshot ? snapshot.matching : null;
  const matchingCard = snapshot ? snapshot.matchingCard : null;
  const totalFailed = snapshot ? Number(snapshot.matching.totalFailedJobs) : 0;

  return {
    loading,
    error,
    snapshot,
    load,

    importItems,
    exportItems,
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
      matching,
    matchingCard,
    totalFailed,
  };
}
