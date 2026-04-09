"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";
import { formatJPY, getAmazonAhaMock } from "@/core/onboarding/amazon-aha";

export default function AmazonAhaPage() {
  const params = useParams<{ lang: string }>();
  const lang: Lang = normalizeLang(params?.lang);
  const data = getAmazonAhaMock();

  return (
    <div className="min-h-screen bg-[#f8fafc] px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[32px] border border-black/5 bg-white p-8 shadow-sm md:p-10">
          <div className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            Step 2 / Amazon Aha
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
            Amazonの売上と入金の差額を、最初に理解できます
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            {data.summary}
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-black/5 bg-slate-50 p-5">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">売上</div>
              <div className="mt-2 text-3xl font-semibold text-slate-900">
                {formatJPY(data.salesAmount)}
              </div>
              <div className="mt-2 text-sm text-slate-600">
                Amazonで売れた総額
              </div>
            </div>

            <div className="rounded-3xl border border-black/5 bg-slate-50 p-5">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">入金</div>
              <div className="mt-2 text-3xl font-semibold text-slate-900">
                {formatJPY(data.payoutAmount)}
              </div>
              <div className="mt-2 text-sm text-slate-600">
                実際に受け取った金額
              </div>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
              <div className="text-xs font-medium uppercase tracking-wide text-blue-700">差額</div>
              <div className="mt-2 text-3xl font-semibold text-slate-900">
                {formatJPY(data.gapAmount)}
              </div>
              <div className="mt-2 text-sm text-slate-600">
                手数料・広告費・返金などの影響
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-black/5 bg-white p-6">
              <div className="text-lg font-semibold text-slate-900">差額の内訳</div>
              <div className="mt-2 text-sm text-slate-600">
                売上と入金のズレは、複数の費用や調整項目で構成されます。
              </div>

              <div className="mt-5 space-y-3">
                {data.breakdown.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-black/5 bg-slate-50 px-4 py-4"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-600">
                        {item.description}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {formatJPY(item.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
                <div className="text-sm font-semibold text-amber-900">
                  LedgerSeiri がこれから提供する価値
                </div>
                <div className="mt-3 text-sm leading-7 text-amber-800">
                  LedgerSeiri は、Amazonの売上と実際の入金額のズレを、
                  手数料・広告費・返金などに分けて見える化します。
                  次の Step では、この差額をより構造的に説明できるようにします。
                </div>
              </div>

              <div className="rounded-3xl border border-black/5 bg-slate-50 p-6">
                <div className="text-sm font-semibold text-slate-900">
                  データの見え方 / Trust
                </div>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  {data.trustNotes.map((note) => (
                    <li key={note} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={`/${lang}/onboarding/business-type`}
              className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
            >
              事業タイプ選択に戻る
            </Link>

            <Link
              href={`/${lang}/app`}
              className="inline-flex items-center justify-center rounded-full bg-[#2b5cff] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95"
            >
              ダッシュボードへ進む
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
