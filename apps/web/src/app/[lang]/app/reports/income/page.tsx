"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportPageShared } from "@/core/reports/report-page-shared";
import { buildDetailReportHref } from "@/core/reports/detail-query-contract";
import {
  buildReportExportHref,
  buildReportStoreOptions,
  fetchIncomeReport,
  fmtJPY,
  normalizeReportRange,
  readReportStoreId,
} from "@/core/reports/report-api-shared";
import type { ReportPageVm, ReportRange } from "@/core/reports/types";

export default function IncomeReportPage() {
  const params = useParams<{ lang: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const lang = params?.lang ?? "ja";
  const range = normalizeReportRange(searchParams.get("range"));
  const storeId = readReportStoreId(searchParams.get("storeId"));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);
        setError("");
        const res = await fetchIncomeReport({ range, storeId });
        if (!alive) return;
        setData(res);
      } catch (e: unknown) {
        if (!alive) return;
        setData(null);
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    void run();
    return () => {
      alive = false;
    };
  }, [range, storeId]);

  function replaceQuery(nextRange: ReportRange, nextStoreId: string) {
    const qs = new URLSearchParams(searchParams.toString());
    qs.set("range", nextRange);
    qs.set("storeId", nextStoreId);
    router.replace(`${pathname}?${qs.toString()}`);
  }

  const vm = useMemo<ReportPageVm>(() => {
    const summary = data?.summary ?? {};
    const breakdown = Array.isArray(data?.breakdown) ? data.breakdown : [];
    const trend = Array.isArray(data?.trend) ? data.trend : [];

    return {
      reportKey: "income",
      title: "収入分析",
      description: "収入合計・件数・平均・日別推移を確認します。",
      range,
      storeId,
      stores: buildReportStoreOptions(storeId),
      exportHref: buildReportExportHref({
        lang,
        reportKey: "income",
        range,
        storeId,
      }),
      summaryCards: [
        { key: "totalIncome", label: "Total Income", value: fmtJPY(summary.totalIncome ?? 0),    detailHref: buildDetailReportHref({
      lang,
      kind: "income",
      metric: "totalIncome",
      range,
      storeId,
    }),
 tone: "profit" },
        { key: "rowsCount", label: "Rows", value: String(summary.rowsCount ?? 0),    detailHref: buildDetailReportHref({
      lang,
      kind: "income",
      metric: "rowsCount",
      range,
      storeId,
    }),
 tone: "info" },
        { key: "averagePerRow", label: "Avg / Row", value: fmtJPY(summary.averagePerRow ?? 0),    detailHref: buildDetailReportHref({
      lang,
      kind: "income",
      metric: "averagePerRow",
      range,
      storeId,
    }),
 tone: "default" },
        { key: "activeDays", label: "Active Days", value: String(summary.activeDays ?? 0),    detailHref: buildDetailReportHref({
      lang,
      kind: "income",
      metric: "activeDays",
      range,
      storeId,
    }),
 tone: "warning" },
      ],
      breakdownItems: breakdown.map((item: any) => ({
        key: String(item.key ?? item.label ?? Math.random()),
        label: String(item.label ?? item.key ?? "-"),
        amount: fmtJPY(Number(item.amount ?? 0)),
      })),
      trendColumns: [
        { key: "date", label: "Date" },
        { key: "amount", label: "Income", align: "right" },
        { key: "rowsCount", label: "Rows", align: "right" },
      ],
      trendRows: trend.map((row: any, idx: number) => ({
        key: String(row.date ?? idx),
        values: {
          date: String(row.date ?? "-"),
          amount: fmtJPY(Number(row.amount ?? row.totalIncome ?? 0)),
          rowsCount: String(row.rowsCount ?? row.count ?? 0),
        },
      })),
      loading,
      error,
    };
  }, [data, error, lang, loading, range, storeId]);

  return (
    <ReportPageShared
      vm={vm}
      onRangeChange={(next) => replaceQuery(next, storeId)}
      onStoreChange={(next) => replaceQuery(range, next)}
    />
  );
}
