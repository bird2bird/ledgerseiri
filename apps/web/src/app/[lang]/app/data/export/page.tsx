"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import {
  loadExportJobsPageSnapshot,
  type ExportJobItem,
  type ExportMetaResponse,
} from "@/core/jobs";
import { fmtDate, JobsMetricCard } from "@/components/app/jobs/jobs-shared";
import { JobsLoadingState } from "@/components/app/jobs/JobsLoadingState";
import { JobsErrorState } from "@/components/app/jobs/JobsErrorState";
import { ExportJobsHero } from "@/components/app/jobs/ExportJobsHero";
import { ExportJobsTableCard } from "@/components/app/jobs/ExportJobsTableCard";
import { ExportJobsMetaSummaryCard } from "@/components/app/jobs/ExportJobsMetaSummaryCard";

export default function DataExportPage() {
  const params = useParams<{ lang: string }>();
  const lang = normalizeLang(params?.lang) as Lang;

  const [jobs, setJobs] = useState<ExportJobItem[]>([]);
  const [meta, setMeta] = useState<ExportMetaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const snapshot = await loadExportJobsPageSnapshot();
      setJobs(Array.isArray(snapshot.jobs.items) ? snapshot.jobs.items : []);
      setMeta(snapshot.meta ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to load export jobs");
      setJobs([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const latestUpdatedAt = useMemo(() => {
    const values = jobs
      .map((x) => {
        const raw = x.updatedAt;
        if (!raw) return Number.NaN;
        return new Date(raw).getTime();
      })
      .filter((x) => Number.isFinite(x));

    if (values.length === 0) return "-";
    return fmtDate(new Date(Math.max(...values)).toISOString());
  }, [jobs]);

  const downloadableCount = useMemo(() => jobs.filter((x) => !!x.fileUrl).length, [jobs]);

  if (loading) {
    return <JobsLoadingState text="export jobs を読み込み中..." />;
  }

  if (error) {
    return (
      <JobsErrorState
        title="データエクスポート情報の取得に失敗しました"
        error={error}
        onReload={load}
        secondaryHref={`/${lang}/app/data/import`}
        secondaryLabel="データインポートへ"
      />
    );
  }

  return (
    <main className="space-y-6">
      <ExportJobsHero
        lang={lang}
        onReload={load}
        total={meta?.summary?.total ?? 0}
        succeeded={meta?.summary?.succeeded ?? 0}
        downloadableCount={downloadableCount}
        latestUpdatedAt={latestUpdatedAt}
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <JobsMetricCard
          label="処理中"
          value={meta?.summary?.processing ?? 0}
          helper="PROCESSING"
          tone="primary"
        />
        <JobsMetricCard
          label="失敗"
          value={meta?.summary?.failed ?? 0}
          helper="FAILED"
          tone="warning"
        />
        <JobsMetricCard
          label="形式数"
          value={(meta?.formats?.filter((x) => x.value).length ?? 0).toString()}
          helper="meta.formats"
          tone="success"
        />
        <JobsMetricCard
          label="現在の状態"
          value="real baseline"
          helper="generate/create はまだ stub"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <ExportJobsTableCard jobs={jobs} />
        <ExportJobsMetaSummaryCard meta={meta} />
      </section>
    </main>
  );
}
