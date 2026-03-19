"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportPageShared } from "@/core/reports/report-page-shared";
import { buildDetailReportHref } from "@/core/reports/detail-query-contract";
import {
  buildReportExportHref,
  buildReportStoreOptions,
  fetchProfitReport,
  fmtJPY,
  fmtPct,
  normalizeReportRange,
  readReportStoreId,
} from "@/core/reports/report-api-shared";
import type { ReportPageVm, ReportRange } from "@/core/reports/types";

export default function ProfitReportPage() {
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
        const res = await fetchProfitReport({ range, storeId });
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
      reportKey: "profit",
      title: "利益分析",
      description: "収入・支出・利益率の推移を確認します。",
      range,
      storeId,
      stores: buildReportStoreOptions(storeId),
      exportHref: buildReportExportHref({
        lang,
        reportKey: "profit",
        range,
        storeId,
      }),
      summaryCards: [
        { key: "totalIncome", label: "Total Income", value: fmtJPY(summary.totalIncome ?? 0),    detailHref: buildDetailReportHref({
      lang,
      kind: "profit",
      metric: "totalIncome",
      range,
      storeId,
    }),
 tone: "info" },
        { key: "totalExpense", label: "Total Expense", value: fmtJPY(summary.totalExpense ?? 0),    detailHref: buildDetailReportHref({
      lang,
      kind: "profit",
      metric: "totalExpense",
      range,
      storeId,
    }),
 tone: "danger" },
        {
          key: "grossProfit",
          label: "Gross Profit",
          value: fmtJPY(summary.grossProfit ?? 0),
          tone: (summary.grossProfit ?? 0) >= 0 ? "profit" : "danger",
          detailHref: buildDetailReportHref({
            lang,
            kind: "profit",
            metric: "grossProfit",
            range,
            storeId,
          }),
        },
        {
          key: "marginPct",
          label: "Margin",
          value: fmtPct(Number(summary.marginPct ?? 0)),
          tone: Number(summary.marginPct ?? 0) >= 0 ? "warning" : "danger",
          detailHref: buildDetailReportHref({
            lang,
            kind: "profit",
            metric: "marginPct",
            range,
            storeId,
          }),
        },
      ],
      breakdownItems: breakdown.map((item: any) => ({
        key: String(item.key ?? item.label ?? Math.random()),
        label: String(item.label ?? item.key ?? "-"),
        amount: fmtJPY(Number(item.amount ?? 0)),
      })),
      trendColumns: [
        { key: "date", label: "Date" },
        { key: "income", label: "Income", align: "right" },
        { key: "expense", label: "Expense", align: "right" },
        { key: "profit", label: "Profit", align: "right" },
      ],
      trendRows: trend.map((row: any, idx: number) => ({
        key: String(row.date ?? idx),
        values: {
          date: String(row.date ?? "-"),
          income: fmtJPY(Number(row.income ?? row.totalIncome ?? 0)),
          expense: fmtJPY(Number(row.expense ?? row.totalExpense ?? 0)),
          profit: fmtJPY(Number(row.profit ?? row.grossProfit ?? 0)),
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
