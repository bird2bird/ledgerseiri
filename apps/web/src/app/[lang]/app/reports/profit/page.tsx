"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createDrilldownContext,
  fetchProfitDrilldown,
  normalizeProfitFocusParam,
  type ProfitFocus,
} from "@/core/drilldown/target-pages";
import {
  buildDrilldownHref,
  cloneSearchParams,
  isDashboardSource,
  readBaseDrilldownQuery,
  setOrDeleteQueryParam,
} from "@/core/drilldown/query-contract";

const FOCUS_ITEMS: ProfitFocus[] = ["profit", "revenue", "margin", "trend"];

const FOCUS_LABELS: Record<ProfitFocus, string> = {
  profit: "営業利益",
  revenue: "売上",
  margin: "利益率",
  trend: "利益推移",
};

export default function Page() {
  const params = useParams<{ lang: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawFrom = searchParams.get("from");
  const rawStoreId = searchParams.get("storeId");
  const rawRange = searchParams.get("range");
  const { from, storeId, range } = readBaseDrilldownQuery(searchParams);
  void rawFrom;
  void rawStoreId;
  void rawRange;
  const focus = normalizeProfitFocusParam(searchParams.get("focus"));
  const isDashboard = isDashboardSource(from);

  const [metric, setMetric] = useState<{
    title: string;
    value: string;
    note: string;
  } | null>(null);
  const [adapterNote, setAdapterNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const ctx = createDrilldownContext({
      from,
      storeId,
      range,
      focus,
    });

    fetchProfitDrilldown(focus, ctx)
      .then((res) => {
        if (!mounted) return;
        setMetric(res.metric);
        setAdapterNote(res.meta.note ?? "");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [from, storeId, range, focus]);

  function updateFocus(next: ProfitFocus) {
    const qs = cloneSearchParams(searchParams);
    setOrDeleteQueryParam(qs, "focus", next);
    router.replace(buildDrilldownHref(pathname, qs));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">利益レポート · {FOCUS_LABELS[focus]}</div>
            <div className="mt-2 text-sm text-slate-500">
              Step39E: reports page 共享统一 base drilldown query contract。
            </div>
          </div>

          {isDashboard ? (
            <Link
              href={`/${params?.lang ?? "ja"}/app`}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard に戻る
            </Link>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Store</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{storeId}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Range</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{range}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">Current Focus</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{FOCUS_LABELS[focus]}</div>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-500">{adapterNote}</div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="text-lg font-semibold text-slate-900">Focus</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {FOCUS_ITEMS.map((item) => {
            const active = focus === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => updateFocus(item)}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {FOCUS_LABELS[item]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white p-8 shadow-sm">
        <div className="text-sm text-slate-500">Current Focus Metric</div>

        {loading ? (
          <div className="mt-4 text-sm text-slate-500">loading...</div>
        ) : metric ? (
          <>
            <div className="mt-3 text-3xl font-semibold text-slate-900">{metric.title}</div>
            <div className="mt-4 text-5xl font-semibold tracking-tight text-slate-900">{metric.value}</div>
            <div className="mt-4 text-sm text-slate-500">{metric.note}</div>
          </>
        ) : (
          <div className="mt-4 text-sm text-slate-500">no metric</div>
        )}
      </div>
    </div>
  );
}
