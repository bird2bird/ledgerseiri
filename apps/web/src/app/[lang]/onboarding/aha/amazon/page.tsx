"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { formatJPY, getAmazonAhaViewModelMock } from "@/core/onboarding/amazon-aha";

function confidenceLabel(value: "low" | "medium" | "high"): string {
  if (value === "low") return "Low";
  if (value === "medium") return "Medium";
  return "High";
}

function PageContent() {
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const lang: Lang = normalizeLang(params?.lang);
  const data = getAmazonAhaViewModelMock();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_55%,#f8fafc_100%)] px-6 py-10 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[36px] border border-black/5 bg-white/90 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="border-b border-black/5 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-6 py-8 md:px-8 xl:px-10">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  Step 2 / Amazon Aha
                </div>

                <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                  Amazonの売上と入金のズレを、
                  <br />
                  最初に理解できます
                </h1>

                <p className="mt-5 text-base leading-8 text-slate-600">
                  {data.summary}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
                    Amazon settlement
                  </span>
                  <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
                    差額 Explain
                  </span>
                  <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
                    Operating cockpit
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:w-[420px]">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    売上
                  </div>
                  <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                    {formatJPY(data.salesAmount)}
                  </div>
                  <div className="mt-2 text-xs leading-5 text-slate-600">
                    Amazonで売れた総額
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    入金
                  </div>
                  <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                    {formatJPY(data.payoutAmount)}
                  </div>
                  <div className="mt-2 text-xs leading-5 text-slate-600">
                    実際に受け取った金額
                  </div>
                </div>

                <div className="rounded-3xl border border-blue-100 bg-[linear-gradient(135deg,#eef2ff_0%,#dbeafe_100%)] p-4 shadow-sm">
                  <div className="text-xs font-medium uppercase tracking-wide text-blue-700">
                    差額
                  </div>
                  <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                    {formatJPY(data.gapAmount)}
                  </div>
                  <div className="mt-2 text-xs leading-5 text-slate-600">
                    手数料・広告費・返金などの影響
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
                      差額の内訳
                    </div>
                    <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                      {data.breakdown.length} items
                    </span>
                  </div>

                  <div className="mt-2 text-sm leading-6 text-slate-600">
                    売上と入金のズレは、複数の費用や調整項目で構成されます。
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

                    {data.unexplainedRemainder > 0 ? (
                      <div className="rounded-3xl border border-dashed border-amber-300 bg-amber-50 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-base font-semibold text-amber-900">
                              未説明の差額
                            </div>
                            <div className="mt-2 text-sm leading-6 text-amber-800">
                              今後のデータ連携や説明ロジック拡張で補完予定です。
                            </div>
                          </div>
                          <div className="text-base font-semibold text-amber-900">
                            {formatJPY(data.unexplainedRemainder)}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[32px] border border-indigo-100 bg-[linear-gradient(135deg,#eef2ff_0%,#f5f3ff_100%)] p-6">
                  <div className="text-sm font-semibold text-slate-900">
                    LedgerSeiri が最初に提供する価値
                  </div>
                  <div className="mt-3 text-sm leading-7 text-slate-700">
                    LedgerSeiri は、Amazonの売上と実際の入金額のズレを、
                    手数料・広告費・返金などに分けて見える化します。
                    最初の dashboard では、この差額を経営判断しやすい形で整理します。
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-indigo-100 bg-white p-4">
                      <div className="text-sm font-semibold text-slate-900">Explain first</div>
                      <div className="mt-2 text-xs leading-5 text-slate-600">
                        差額の意味を最初に理解できるようにします。
                      </div>
                    </div>
                    <div className="rounded-2xl border border-indigo-100 bg-white p-4">
                      <div className="text-sm font-semibold text-slate-900">Operator view</div>
                      <div className="mt-2 text-xs leading-5 text-slate-600">
                        そのまま運営 dashboard に繋がる表示を提供します。
                      </div>
                    </div>
                    <div className="rounded-2xl border border-indigo-100 bg-white p-4">
                      <div className="text-sm font-semibold text-slate-900">Trustable data</div>
                      <div className="mt-2 text-xs leading-5 text-slate-600">
                        settlement / transaction 起点で差額を整理します。
                      </div>
                    </div>
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
                      <div className="text-sm font-semibold text-slate-900">Coverage</div>
                      <div className="mt-2 text-xs leading-5 text-slate-600">
                        現在の主要因はルールベース説明で整理されています。
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-900">Next evolution</div>
                      <div className="mt-2 text-xs leading-5 text-slate-600">
                        今後は Explain Engine 連携で説明精度をさらに高めます。
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

                <div className="rounded-[32px] border border-black/5 bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_55%,#312e81_100%)] p-6 text-white shadow-sm">
                  <div className="text-sm font-semibold text-white/90">
                    次のステップ
                  </div>
                  <div className="mt-3 text-2xl font-semibold tracking-tight">
                    Amazon operating cockpit へ進みます
                  </div>
                  <div className="mt-3 text-sm leading-7 text-white/80">
                    ここで見た差額の考え方を、そのまま dashboard 上の KPI・トレンド・alerts へ繋げて確認できます。
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/90">
                      KPI
                    </span>
                    <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/90">
                      Trend
                    </span>
                    <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/90">
                      Explain
                    </span>
                    <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/90">
                      Alerts
                    </span>
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
                このタイプでダッシュボードへ進む
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AmazonAhaPage() {
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
