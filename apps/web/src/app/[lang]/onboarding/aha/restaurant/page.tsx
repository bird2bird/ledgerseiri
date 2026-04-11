"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { formatJPY, getBusinessAhaViewModel } from "@/core/onboarding/business-aha";

function confidenceLabel(value: "low" | "medium" | "high"): string {
  if (value === "low") return "Low";
  if (value === "medium") return "Medium";
  return "High";
}

function PageContent() {
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const lang: Lang = normalizeLang(params?.lang);
  const data = getBusinessAhaViewModel("restaurant");

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#fff7ed_55%,#f8fafc_100%)] px-6 py-10 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[36px] border border-black/5 bg-white/90 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="border-b border-black/5 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.12),_transparent_28%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-6 py-8 md:px-8 xl:px-10">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                  {data.stepLabel}
                </div>

                <div className="mt-5 inline-flex rounded-full border border-orange-200 bg-white px-3 py-1 text-xs text-slate-700">
                  Profit pressure first
                </div>

                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                  {data.title}
                </h1>

                <p className="mt-5 text-base leading-8 text-slate-600">
                  {data.summary}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {data.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:w-[480px]">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {data.kpi1Label}
                  </div>
                  <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                    {formatJPY(data.kpi1Value)}
                  </div>
                  <div className="mt-2 text-xs leading-5 text-slate-600">
                    {data.kpi1Description}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {data.kpi2Label}
                  </div>
                  <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                    {formatJPY(data.kpi2Value)}
                  </div>
                  <div className="mt-2 text-xs leading-5 text-slate-600">
                    {data.kpi2Description}
                  </div>
                </div>

                <div className="rounded-3xl border border-orange-100 bg-[linear-gradient(135deg,#fff7ed_0%,#fed7aa_100%)] p-4 shadow-sm">
                  <div className="text-xs font-medium uppercase tracking-wide text-orange-700">
                    {data.kpi3Label}
                  </div>
                  <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                    {formatJPY(data.kpi3Value)}
                  </div>
                  <div className="mt-2 text-xs leading-5 text-slate-600">
                    {data.kpi3Description}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-8 md:px-8 xl:px-10">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-6">
                <div className="rounded-[32px] border border-black/5 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-lg font-semibold text-slate-900">
                      {data.breakdownTitle}
                    </div>
                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                      {data.breakdown.length} items
                    </span>
                  </div>

                  <div className="mt-2 text-sm leading-6 text-slate-600">
                    {data.breakdownDescription}
                  </div>

                  <div className="mt-6 space-y-3">
                    {data.breakdown.map((item) => (
                      <div
                        key={item.key}
                        className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-base font-semibold text-slate-900">
                              {item.label}
                            </div>
                            <div className="mt-2 text-sm leading-6 text-slate-600">
                              {item.description}
                            </div>
                          </div>
                          <div className="text-base font-semibold text-slate-900">
                            {formatJPY(item.amount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[32px] border border-orange-100 bg-[linear-gradient(135deg,#fff7ed_0%,#ffedd5_100%)] p-6">
                  <div className="text-sm font-semibold text-slate-900">
                    {data.valueTitle}
                  </div>
                  <div className="mt-3 text-sm leading-7 text-slate-700">
                    {data.valueSummary}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[32px] border border-black/5 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-lg font-semibold text-slate-900">
                      Explain status
                    </div>
                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                      Confidence: {confidenceLabel(data.confidence)}
                    </span>
                  </div>

                  <div className="mt-4 rounded-2xl border border-black/5 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                    {data.coverageNote}
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-900">
                        原価率
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate-600">
                        食材原価が利益を圧迫していないか把握します。
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-900">
                        人件費圧力
                      </div>
                      <div className="mt-2 text-xs leading-5 text-slate-600">
                        売上に対して人件費が重くなっていないか確認します。
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[32px] border border-black/5 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-sm">
                  <div className="text-lg font-semibold text-slate-900">
                    データの見え方 / Trust
                  </div>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                    {data.trustNotes.map((note) => (
                      <li key={note} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[32px] border border-black/5 bg-[linear-gradient(135deg,#431407_0%,#9a3412_55%,#b45309_100%)] p-6 text-white shadow-sm">
                  <div className="text-sm font-semibold text-white/90">
                    次のステップ
                  </div>
                  <div className="mt-3 text-2xl font-semibold tracking-tight">
                    {data.nextStepTitle}
                  </div>
                  <div className="mt-3 text-sm leading-7 text-white/80">
                    {data.nextStepSummary}
                  </div>

                  <div className="mt-5">
                    <Link
                      href={searchParams.get("next") || `/${lang}/app`}
                      className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-orange-900 shadow-sm hover:bg-orange-50"
                    >
                      このタイプでダッシュボードへ進む
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href={`/${lang}/onboarding/business-type`}
                className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
              >
                事業タイプ選択に戻る
              </Link>

              <Link
                href={searchParams.get("next") || `/${lang}/app`}
                className="inline-flex items-center justify-center rounded-full bg-[#2b5cff] px-7 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(43,92,255,0.28)] transition hover:opacity-95"
              >
                このタイプで始める
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RestaurantAhaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center px-6 py-12">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
            Loading...
          </div>
        </div>
      }
    >
      <PageContent />
    </Suspense>
  );
}
