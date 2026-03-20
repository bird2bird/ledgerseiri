"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import {
  loadExportJobsPageSnapshot,
  type ExportJobItem,
  type ExportMetaResponse,
  type ExportJobsResponse,
} from "@/core/jobs";

function fmtDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function statusTone(status?: string | null) {
  const s = String(status || "").toUpperCase();
  if (s === "SUCCEEDED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (s === "FAILED") return "border-rose-200 bg-rose-50 text-rose-700";
  if (s === "PROCESSING") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function MetricCard(props: {
  label: string;
  value: string | number;
  helper?: string;
  tone?: "default" | "primary" | "success" | "warning";
}) {
  const tone =
    props.tone === "primary"
      ? "border-sky-200 bg-sky-50"
      : props.tone === "success"
      ? "border-emerald-200 bg-emerald-50"
      : props.tone === "warning"
      ? "border-amber-200 bg-amber-50"
      : "border-slate-200 bg-slate-50";

  return (
    <div className={`rounded-[22px] border p-4 ${tone}`}>
      <div className="text-[11px] font-medium text-slate-500">{props.label}</div>
      <div className="mt-2 text-xl font-semibold text-slate-900">{props.value}</div>
      {props.helper ? <div className="mt-2 text-xs text-slate-500">{props.helper}</div> : null}
    </div>
  );
}

function formatLabel(value?: string | null) {
  const v = String(value || "").trim();
  return v ? v.toUpperCase() : "-";
}

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

  const downloadableCount = useMemo(
    () => jobs.filter((x) => !!x.fileUrl).length,
    [jobs]
  );

  if (loading) {
    return (
      <main className="space-y-6">
        <section className="ls-card-solid rounded-[28px] p-6">
          <div className="text-sm text-slate-500">export jobs を読み込み中...</div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="space-y-6">
        <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-6">
          <div className="text-sm font-semibold text-rose-700">データエクスポート情報の取得に失敗しました</div>
          <div className="mt-2 break-all text-sm text-rose-600">{error}</div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void load()}
              className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold"
            >
              再読み込み
            </button>
            <Link
              href={`/${lang}/app/data/import`}
              className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold"
            >
              データインポートへ
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#334155_100%)] p-7 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
        <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-[11px] font-medium text-white/90">
          Data Export
        </div>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[34px] font-semibold tracking-tight">データエクスポート</h1>
            <div className="mt-3 text-sm text-white/80">
              export job の一覧と状態を表示する production baseline です。実ファイル生成は後続ステップで接続します。
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void load()}
              className="ls-btn ls-btn-ghost inline-flex border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
            >
              再読み込み
            </button>
            <Link
              href={`/${lang}/app/data/import`}
              className="ls-btn ls-btn-ghost inline-flex border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
            >
              データインポートへ
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-[22px] bg-white/92 p-5 text-slate-900 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Total Jobs</div>
            <div className="mt-2 text-xl font-semibold">{meta?.summary?.total ?? 0}</div>
          </div>
          <div className="rounded-[22px] bg-white/92 p-5 text-slate-900 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Succeeded</div>
            <div className="mt-2 text-xl font-semibold">{meta?.summary?.succeeded ?? 0}</div>
          </div>
          <div className="rounded-[22px] bg-white/92 p-5 text-slate-900 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Download Ready</div>
            <div className="mt-2 text-xl font-semibold">{downloadableCount}</div>
          </div>
          <div className="rounded-[22px] bg-white/92 p-5 text-slate-900 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Latest Update</div>
            <div className="mt-2 text-xl font-semibold">{latestUpdatedAt}</div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <MetricCard
          label="処理中"
          value={meta?.summary?.processing ?? 0}
          helper="PROCESSING"
          tone="primary"
        />
        <MetricCard
          label="失敗"
          value={meta?.summary?.failed ?? 0}
          helper="FAILED"
          tone="warning"
        />
        <MetricCard
          label="形式数"
          value={(meta?.formats?.filter((x) => x.value).length ?? 0).toString()}
          helper="meta.formats"
          tone="success"
        />
        <MetricCard
          label="現在の状態"
          value="real baseline"
          helper="generate/create はまだ stub"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Export Job List</div>
              <div className="mt-1 text-[12px] text-slate-500">
                /api/export-jobs の戻り値を安全に表示しています
              </div>
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="mt-5 rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              export job はまだありません。次ステップで create/generate 導線を追加できます。
            </div>
          ) : (
            <div className="mt-5 overflow-hidden rounded-[22px] border border-slate-200">
              <div className="grid grid-cols-[1.3fr_120px_120px_160px_100px] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                <div>Domain</div>
                <div>Format</div>
                <div>Status</div>
                <div>Updated</div>
                <div>File</div>
              </div>

              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="grid grid-cols-[1.3fr_120px_120px_160px_100px] gap-4 border-t border-slate-100 px-4 py-3 text-sm"
                >
                  <div>
                    <div className="font-medium text-slate-900">{job.domain || "-"}</div>
                    <div className="mt-1 text-xs text-slate-500 break-all">{job.id}</div>
                  </div>
                  <div className="text-slate-700">{formatLabel(job.format)}</div>
                  <div>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusTone(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="text-slate-700">{fmtDate(job.updatedAt)}</div>
                  <div className="text-slate-700">
                    {job.fileUrl ? "ready" : "-"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-4">
          <div className="text-sm font-semibold text-slate-900">Meta Summary</div>
          <div className="mt-1 text-[12px] text-slate-500">/api/export-jobs/meta</div>

          <div className="mt-5 space-y-5">
            <div>
              <div className="text-[11px] font-medium text-slate-500">Formats</div>
              <div className="mt-3 space-y-2">
                {(meta?.formats ?? []).filter((x) => x.value).length === 0 ? (
                  <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                    no data
                  </div>
                ) : (
                  (meta?.formats ?? [])
                    .filter((x) => x.value)
                    .map((item) => (
                      <div
                        key={item.value}
                        className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                      >
                        {item.label}
                      </div>
                    ))
                )}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-medium text-slate-500">Domains</div>
              <div className="mt-3 space-y-2">
                {(meta?.domains ?? []).filter((x) => x.value).length === 0 ? (
                  <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                    no data
                  </div>
                ) : (
                  (meta?.domains ?? [])
                    .filter((x) => x.value)
                    .map((item) => (
                      <div
                        key={item.value}
                        className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                      >
                        {item.label}
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="rounded-[22px] border border-dashed border-[color:var(--ls-primary)]/35 bg-[color:var(--ls-primary)]/5 p-4">
              <div className="text-sm font-medium text-slate-900">Next Step</div>
              <div className="mt-2 text-sm text-slate-600">
                Step46-F で import/export baseline を freeze できます。
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
