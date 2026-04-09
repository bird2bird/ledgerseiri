"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";

export default function AmazonAhaPlaceholderPage() {
  const params = useParams<{ lang: string }>();
  const lang: Lang = normalizeLang(params?.lang);

  return (
    <div className="min-h-screen bg-[#f8fafc] px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[32px] border border-black/5 bg-white p-8 shadow-sm md:p-10">
          <div className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            Step 2 / Amazon Aha
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
            Amazon 売上の見え方を、ここから変えます
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            この画面では今後、Amazon販売の「売上」「入金」「差額」と、
            その差額がどこから生まれているかを一目で理解できるようにします。
            Step85-C で本実装を追加予定です。
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-black/5 bg-slate-50 p-5">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">売上</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">--</div>
              <div className="mt-2 text-sm text-slate-600">
                Amazonでどれだけ売れたか
              </div>
            </div>

            <div className="rounded-3xl border border-black/5 bg-slate-50 p-5">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">入金</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">--</div>
              <div className="mt-2 text-sm text-slate-600">
                実際に受け取った金額
              </div>
            </div>

            <div className="rounded-3xl border border-black/5 bg-slate-50 p-5">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">差額</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">--</div>
              <div className="mt-2 text-sm text-slate-600">
                手数料・広告費・返金などの影響
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <div className="text-sm font-semibold text-amber-900">
              このページは現在プレースホルダーです
            </div>
            <div className="mt-2 text-sm leading-6 text-amber-800">
              次の Step で、Amazon Aha の本実装として
              「差額内訳」「説明文」「信頼できるデータソース表示」を追加します。
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
