"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReportPageShared } from "@/core/reports/report-page-shared";
import { buildDetailReportHref } from "@/core/reports/detail-query-contract";
import {
  buildReportExportHref,
  buildReportStoreOptions,
  fetchCashflowReport,
  fmtJPY,
  normalizeReportRange,
  readReportStoreId,
} from "@/core/reports/report-api-shared";
import type { ReportPageVm, ReportRange } from "@/core/reports/types";

export default function CashflowReportPage() {
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
        const res = await fetchCashflowReport({ range, storeId });
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
      reportKey: "cashflow",
      title: "キャッシュフロー分析",
      description: "収入・支出・振替の推移を確認します。",
      range,
      storeId,
      stores: buildReportStoreOptions(storeId),
      exportHref: buildReportExportHref({
        lang,
        reportKey: "cashflow",
        range,
        storeId,
      }),
      summaryCards: [
        { key: "cashIn", label: "Cash In", value: fmtJPY(summary.cashIn ?? 0),    detailHref: buildDetailReportHref({
      lang,
      kind: "cashflow",
      metric: "cashIn",
      range,
      storeId,
    }),
 tone: "info" },
        { key: "cashOut", label: "Cash Out", value: fmtJPY(summary.cashOut ?? 0),    detailHref: buildDetailReportHref({
      lang,
      kind: "cashflow",
      metric: "cashOut",
      range,
      storeId,
    }),
 tone: "danger" },
        { key: "netCash", label: "Net Cash", value: fmtJPY(summary.netCash ?? 0),    detailHref: buildDetailReportHref({
      lang,
      kind: "cashflow",
      metric: "netCash",
      range,
      storeId,
    }),
 tone: (summary.netCash ?? 0) >= 0 ? "profit" : "danger" },
        {
          key: "transfers",
          label: "Transfers",
          value: fmtJPY((summary.inboundTransfers ?? 0) + (summary.outboundTransfers ?? 0)),
          subValue: `IN ${fmtJPY(summary.inboundTransfers ?? 0)} / OUT ${fmtJPY(summary.outboundTransfers ?? 0)}`,
          tone: "warning",
          detailHref: buildDetailReportHref({
            lang,
            kind: "cashflow",
            metric: "transfers",
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
        { key: "cashIn", label: "Cash In", align: "right" },
        { key: "cashOut", label: "Cash Out", align: "right" },
        { key: "netCash", label: "Net Cash", align: "right" },
        { key: "inboundTransfers", label: "Transfer In", align: "right" },
        { key: "outboundTransfers", label: "Transfer Out", align: "right" },
      ],
      trendRows: trend.map((row: any, idx: number) => ({
        key: String(row.date ?? idx),
        values: {
          date: String(row.date ?? "-"),
          cashIn: fmtJPY(Number(row.cashIn ?? 0)),
          cashOut: fmtJPY(Number(row.cashOut ?? 0)),
          netCash: fmtJPY(Number(row.netCash ?? 0)),
          inboundTransfers: fmtJPY(Number(row.inboundTransfers ?? 0)),
          outboundTransfers: fmtJPY(Number(row.outboundTransfers ?? 0)),
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
