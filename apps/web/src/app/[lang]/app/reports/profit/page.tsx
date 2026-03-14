"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { fetchProfitDrilldown, type ProfitFocus } from "@/core/drilldown/target-pages";

const FOCUS_LABELS: Record<ProfitFocus, string> = {
  profit: "営業利益",
  revenue: "売上高",
  margin: "利益率",
  trend: "利益推移",
};

export default function Page() {
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const from = searchParams.get("from");
  const rawFocus = searchParams.get("focus") ?? "profit";
  const focus = (["profit", "revenue", "margin", "trend"].includes(rawFocus) ? rawFocus : "profit") as ProfitFocus;
  const isDashboard = from === "dashboard";

  const [metric, setMetric] = useState<{ title: string; value: string; note: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchProfitDrilldown(focus)
      .then((res) => {
        if (!active) return;
        setMetric(res.metric);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [focus]);

  function updateFocus(next: ProfitFocus) {
    const qs = new URLSearchParams(searchParams.toString());
    qs.set("focus", next);
    router.replace(`${pathname}?${qs.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">利益レポート · {FOCUS_LABELS[focus]}</div>
            <div className="mt-2 text-sm text-slate-500">
              Step39C: focus 状态已绑定 adapter metric 解析层。
            </div>
          </div>

          {isDashboard ? (
            <Link
              href={`/${params?.lang ?? "ja"}/app`}
              className="inline-flex rounded-xl border border-black/10 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard に戻る
            </Link>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["profit", "revenue", "margin", "trend"] as ProfitFocus[]).map((item) => {
            const active = focus === item;
            return (
              <button
                key={item}
                onClick={() => updateFocus(item)}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-black/10 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {FOCUS_LABELS[item]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-6">
        {loading || !metric ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            loading...
          </div>
        ) : (
          <>
            <div className="text-sm text-slate-500">Current Focus</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">{metric.title}</div>
            <div className="mt-3 text-5xl font-semibold tracking-tight text-slate-900">{metric.value}</div>
            <div className="mt-3 text-sm text-slate-500">{metric.note}</div>
          </>
        )}
      </div>
    </div>
  );
}
