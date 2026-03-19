"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  fetchReportDetail,
  type ReportDetailApiResponse,
} from "@/core/reports/detail-report-api";
import {
  buildDetailReportHref,
  normalizeDetailMetric,
  normalizeDetailReportKind,
} from "@/core/reports/detail-query-contract";

type ReportRange = "thisMonth" | "lastMonth" | "thisYear" | "custom";

function normalizeRange(value: string | null | undefined): ReportRange {
  switch (value) {
    case "lastMonth":
    case "thisYear":
    case "custom":
    case "thisMonth":
      return value;
    default:
      return "thisMonth";
  }
}

function setQueryParam(qs: URLSearchParams, key: string, value: string) {
  if (value && String(value).trim()) {
    qs.set(key, value);
  } else {
    qs.delete(key);
  }
}

function getKindLabel(kind: "cashflow" | "income" | "expense" | "profit") {
  switch (kind) {
    case "cashflow":
      return "キャッシュフロー明細";
    case "income":
      return "収入明細";
    case "expense":
      return "支出明細";
    case "profit":
      return "利益明細";
    default:
      return kind;
  }
}

export default function ReportDetailPage() {
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const lang = params?.lang ?? "ja";
  const kind = normalizeDetailReportKind(searchParams.get("kind"));
  const metric = normalizeDetailMetric(searchParams.get("metric"));
  const range = normalizeRange(searchParams.get("range"));
  const storeId = searchParams.get("storeId") || "all";

  const [data, setData] = useState<ReportDetailApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function run() {
      setLoading(true);
      setError("");

      try {
        const res = await fetchReportDetail({
          kind,
          metric,
          range,
          storeId,
        });

        if (!active) return;
        setData(res);
      } catch (e: unknown) {
        if (!active) return;
        setError(e instanceof Error ? e.message : String(e));
        setData(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    run();
    return () => {
      active = false;
    };
  }, [kind, metric, range, storeId]);

  const backHref = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("range", range);
    qs.set("storeId", storeId);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return `/${lang}/app/reports/${kind}${suffix}`;
  }, [kind, lang, range, storeId]);

  function updateRange(next: ReportRange) {
    const qs = new URLSearchParams(searchParams.toString());
    setQueryParam(qs, "range", next);
    router.replace(`/${lang}/app/reports/detail?${qs.toString()}`);
  }

  function updateStoreId(next: string) {
    const qs = new URLSearchParams(searchParams.toString());
    setQueryParam(qs, "storeId", next);
    router.replace(`/${lang}/app/reports/detail?${qs.toString()}`);
  }

  const title = getKindLabel(kind);
  const description = data?.message ?? "detail report";

  const rangeItems: ReportRange[] = ["thisMonth", "lastMonth", "thisYear", "custom"];

  const storeOptions = useMemo(() => {
    const base = [{ value: "all", label: "全店舗" }];
    if (storeId && storeId !== "all") {
      base.push({ value: storeId, label: `Store: ${storeId}` });
    }
    return base;
  }, [storeId]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">{title}</div>
            <div className="mt-2 text-sm text-slate-500">{description}</div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={backHref}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              元レポートに戻る
            </Link>
            <Link
              href={buildDetailReportHref({ lang, kind, metric, range, storeId })}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              現在条件リンク
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {rangeItems.map((item) => {
            const active = range === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => updateRange(item)}
                className={
                  active
                    ? "rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                    : "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                }
              >
                {item}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="text-sm font-medium text-slate-700">Store</div>
          <select
            value={storeId}
            onChange={(e) => updateStoreId(e.target.value)}
            className="h-11 rounded-[14px] border border-black/8 bg-white px-3 text-sm text-slate-700"
          >
            {storeOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <div className="text-sm text-slate-500">
            {data?.summary?.label ?? "選択中指標"}
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {loading ? "loading..." : data?.summary?.value ?? "-"}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Kind</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">
            {getKindLabel(kind)}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Metric</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{metric}</div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Range / Store</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">
            {(data?.filters?.label ?? range)} / {(storeId === "all" ? "全店舗" : storeId)}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-lg font-semibold text-slate-900">Detail Rows</div>
        <div className="mt-1 text-sm text-slate-500">
          query contract → detail api → render baseline
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <div
            className="grid gap-4 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600"
            style={{
              gridTemplateColumns: `repeat(${Math.max(data?.columns?.length ?? 1, 1)}, minmax(0, 1fr))`,
            }}
          >
            {(data?.columns ?? [{ key: "placeholder", label: "Detail" }]).map((col) => (
              <div key={col.key} className={col.align === "right" ? "text-right" : ""}>
                {col.label}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="px-4 py-8 text-sm text-slate-500">loading...</div>
          ) : !data || (data.rows?.length ?? 0) === 0 ? (
            <div className="px-4 py-8 text-sm text-slate-500">no rows</div>
          ) : (
            data.rows.map((row) => (
              <div
                key={row.key}
                className="grid gap-4 border-t border-slate-100 px-4 py-3 text-sm"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(data.columns.length, 1)}, minmax(0, 1fr))`,
                }}
              >
                {data.columns.map((col) => (
                  <div
                    key={col.key}
                    className={`${col.align === "right" ? "text-right" : ""} text-slate-700`}
                  >
                    {row.values[col.key] ?? "-"}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
