"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";

type JobStatus = "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | string;

type ImportJobItem = {
  id: string;
  domain?: string | null;
  filename?: string | null;
  status?: JobStatus | null;
  totalRows?: number | null;
  successRows?: number | null;
  failedRows?: number | null;
  errorMessage?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type ExportJobItem = {
  id: string;
  domain?: string | null;
  format?: string | null;
  status?: JobStatus | null;
  fileUrl?: string | null;
  errorMessage?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type ImportJobsResponse = {
  ok?: boolean;
  domain?: string;
  action?: string;
  items?: ImportJobItem[];
  total?: number;
  message?: string;
};

type ExportJobsResponse = {
  ok?: boolean;
  domain?: string;
  action?: string;
  items?: ExportJobItem[];
  total?: number;
  message?: string;
};

type MetaSummary = {
  total?: number;
  pending?: number;
  processing?: number;
  succeeded?: number;
  failed?: number;
};

type ImportMetaResponse = {
  ok?: boolean;
  domain?: string;
  action?: string;
  summary?: MetaSummary;
  message?: string;
};

type ExportMetaResponse = {
  ok?: boolean;
  domain?: string;
  action?: string;
  summary?: MetaSummary;
  message?: string;
};

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

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

function text(value?: string | null, fallback = "-") {
  const v = String(value ?? "").trim();
  return v || fallback;
}

function statusTone(status?: string | null) {
  switch (String(status ?? "").toUpperCase()) {
    case "SUCCEEDED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "FAILED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "PROCESSING":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function StatCard(props: {
  title: string;
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
    <section className={cls("rounded-[24px] border p-5", tone)}>
      <div className="text-xs font-medium text-slate-500">{props.title}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{props.value}</div>
      {props.helper ? <div className="mt-2 text-sm text-slate-600">{props.helper}</div> : null}
    </section>
  );
}

export default function AmazonReconciliationPage() {
  const params = useParams<{ lang: string }>();
  const lang = normalizeLang(params?.lang) as Lang;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [importItems, setImportItems] = useState<ImportJobItem[]>([]);
  const [exportItems, setExportItems] = useState<ExportJobItem[]>([]);
  const [importSummary, setImportSummary] = useState<MetaSummary | null>(null);
  const [exportSummary, setExportSummary] = useState<MetaSummary | null>(null);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [importRes, importMetaRes, exportRes, exportMetaRes] = await Promise.all([
        fetch("/api/import-jobs", { credentials: "include", cache: "no-store" }),
        fetch("/api/import-jobs/meta", { credentials: "include", cache: "no-store" }),
        fetch("/api/export-jobs", { credentials: "include", cache: "no-store" }),
        fetch("/api/export-jobs/meta", { credentials: "include", cache: "no-store" }),
      ]);

      if (!importRes.ok) {
        throw new Error(`/api/import-jobs failed: ${importRes.status}`);
      }
      if (!importMetaRes.ok) {
        throw new Error(`/api/import-jobs/meta failed: ${importMetaRes.status}`);
      }
      if (!exportRes.ok) {
        throw new Error(`/api/export-jobs failed: ${exportRes.status}`);
      }
      if (!exportMetaRes.ok) {
        throw new Error(`/api/export-jobs/meta failed: ${exportMetaRes.status}`);
      }

      const importJson = (await importRes.json()) as ImportJobsResponse;
      const importMetaJson = (await importMetaRes.json()) as ImportMetaResponse;
      const exportJson = (await exportRes.json()) as ExportJobsResponse;
      const exportMetaJson = (await exportMetaRes.json()) as ExportMetaResponse;

      setImportItems(Array.isArray(importJson?.items) ? importJson.items : []);
      setExportItems(Array.isArray(exportJson?.items) ? exportJson.items : []);
      setImportSummary(importMetaJson?.summary ?? null);
      setExportSummary(exportMetaJson?.summary ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to load reconciliation jobs");
      setImportItems([]);
      setExportItems([]);
      setImportSummary(null);
      setExportSummary(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const recentImport = useMemo(
    () =>
      [...importItems]
        .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")))
        .slice(0, 8),
    [importItems]
  );

  const recentExport = useMemo(
    () =>
      [...exportItems]
        .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")))
        .slice(0, 8),
    [exportItems]
  );

  const importFailed = Number(importSummary?.failed ?? 0);
  const exportFailed = Number(exportSummary?.failed ?? 0);
  const totalFailed = importFailed + exportFailed;

  if (loading) {
    return (
      <main className="space-y-6">
        <section className="ls-card-solid rounded-[28px] p-6">
          <div className="text-sm text-slate-500">Amazon照合ページを読み込み中...</div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="space-y-6">
        <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-6">
          <div className="text-sm font-semibold text-rose-700">
            Amazon reconciliation の読込に失敗しました
          </div>
          <div className="mt-2 break-all text-sm text-rose-600">{error}</div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
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
              Import へ
            </Link>

            <Link
              href={`/${lang}/app/data/export`}
              className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold"
            >
              Export へ
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(135deg,#111827_0%,#1f2937_52%,#334155_100%)] p-7 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
        <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-[11px] font-medium text-white/90">
          Amazon Reconciliation
        </div>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[34px] font-semibold tracking-tight">Amazon照合</h1>
            <div className="mt-3 max-w-3xl text-sm text-white/80">
              Step47-C: import/export job baseline と接続し、照合準備状況・履歴・失敗件数を
              ひとつの画面で確認できる reconciliation hub にします。
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
              データインポート
            </Link>

            <Link
              href={`/${lang}/app/data/export`}
              className="ls-btn ls-btn-ghost inline-flex border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
            >
              データエクスポート
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <StatCard
          title="Import Jobs"
          value={Number(importSummary?.total ?? importItems.length)}
          helper="import job total"
          tone="primary"
        />
        <StatCard
          title="Export Jobs"
          value={Number(exportSummary?.total ?? exportItems.length)}
          helper="export job total"
          tone="success"
        />
        <StatCard
          title="Failed Jobs"
          value={totalFailed}
          helper="import + export failed"
          tone="warning"
        />
        <StatCard
          title="Current Mode"
          value="Connected"
          helper="real Step46 job baseline connected"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Import Job Summary</div>
              <div className="mt-1 text-[12px] text-slate-500">
                /api/import-jobs + /api/import-jobs/meta
              </div>
            </div>

            <Link
              href={`/${lang}/app/data/import`}
              className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold"
            >
              Import Page
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-medium text-slate-500">PENDING</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {Number(importSummary?.pending ?? 0)}
              </div>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-medium text-slate-500">PROCESSING</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {Number(importSummary?.processing ?? 0)}
              </div>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-medium text-slate-500">SUCCEEDED</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {Number(importSummary?.succeeded ?? 0)}
              </div>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-medium text-slate-500">FAILED</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {Number(importSummary?.failed ?? 0)}
              </div>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[22px] border border-slate-200">
            <div className="grid grid-cols-[1.1fr_120px_140px] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
              <div>Filename / Domain</div>
              <div>Status</div>
              <div>Created</div>
            </div>

            {recentImport.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">import jobs はまだありません</div>
            ) : (
              recentImport.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1.1fr_120px_140px] gap-4 border-t border-slate-100 px-4 py-3 text-sm"
                >
                  <div>
                    <div className="font-medium text-slate-900">{text(item.filename)}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      domain: {text(item.domain, "unknown")}
                    </div>
                  </div>
                  <div>
                    <span
                      className={cls(
                        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium",
                        statusTone(item.status)
                      )}
                    >
                      {text(item.status)}
                    </span>
                  </div>
                  <div className="text-slate-600">{fmtDate(item.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Export Job Summary</div>
              <div className="mt-1 text-[12px] text-slate-500">
                /api/export-jobs + /api/export-jobs/meta
              </div>
            </div>

            <Link
              href={`/${lang}/app/data/export`}
              className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold"
            >
              Export Page
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-medium text-slate-500">PENDING</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {Number(exportSummary?.pending ?? 0)}
              </div>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-medium text-slate-500">PROCESSING</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {Number(exportSummary?.processing ?? 0)}
              </div>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-medium text-slate-500">SUCCEEDED</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {Number(exportSummary?.succeeded ?? 0)}
              </div>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] font-medium text-slate-500">FAILED</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {Number(exportSummary?.failed ?? 0)}
              </div>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[22px] border border-slate-200">
            <div className="grid grid-cols-[1.1fr_120px_140px] gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
              <div>Format / Domain</div>
              <div>Status</div>
              <div>Created</div>
            </div>

            {recentExport.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">export jobs はまだありません</div>
            ) : (
              recentExport.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1.1fr_120px_140px] gap-4 border-t border-slate-100 px-4 py-3 text-sm"
                >
                  <div>
                    <div className="font-medium text-slate-900">{text(item.format, "unknown")}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      domain: {text(item.domain, "unknown")}
                    </div>
                  </div>
                  <div>
                    <span
                      className={cls(
                        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium",
                        statusTone(item.status)
                      )}
                    >
                      {text(item.status)}
                    </span>
                  </div>
                  <div className="text-slate-600">{fmtDate(item.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </section>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-7">
          <div className="text-sm font-semibold text-slate-900">Reconciliation Readiness</div>
          <div className="mt-1 text-[12px] text-slate-500">
            Amazon settlement / order / fee file reconciliation preparation baseline
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
              <div className="text-[11px] font-medium text-slate-500">Import Baseline</div>
              <div className="mt-2 text-base font-semibold text-slate-900">Ready</div>
              <div className="mt-2 text-sm text-slate-600">
                Step46 import jobs page already connected.
              </div>
            </div>

            <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
              <div className="text-[11px] font-medium text-slate-500">Export Baseline</div>
              <div className="mt-2 text-base font-semibold text-slate-900">Ready</div>
              <div className="mt-2 text-sm text-slate-600">
                Step46 export jobs page already connected.
              </div>
            </div>

            <div className="rounded-[22px] border border-black/5 bg-slate-50 p-4">
              <div className="text-[11px] font-medium text-slate-500">Amazon Matching Engine</div>
              <div className="mt-2 text-base font-semibold text-slate-900">Planned</div>
              <div className="mt-2 text-sm text-slate-600">
                next step will add settlement/order matching logic baseline.
              </div>
            </div>
          </div>
        </section>

        <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-5">
          <div className="text-sm font-semibold text-slate-900">Quick Actions</div>
          <div className="mt-1 text-[12px] text-slate-500">
            import/export center and related ledger pages
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <Link
              href={`/${lang}/app/data/import`}
              className="ls-btn ls-btn-primary inline-flex justify-center px-4 py-2 text-sm font-semibold"
            >
              データインポートを開く
            </Link>

            <Link
              href={`/${lang}/app/data/export`}
              className="ls-btn ls-btn-ghost inline-flex justify-center px-4 py-2 text-sm font-semibold"
            >
              データエクスポートを開く
            </Link>

            <Link
              href={`/${lang}/app/journals`}
              className="ls-btn ls-btn-ghost inline-flex justify-center px-4 py-2 text-sm font-semibold"
            >
              仕訳一覧へ
            </Link>

            <Link
              href={`/${lang}/app/reports/detail`}
              className="ls-btn ls-btn-ghost inline-flex justify-center px-4 py-2 text-sm font-semibold"
            >
              詳細レポートへ
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
