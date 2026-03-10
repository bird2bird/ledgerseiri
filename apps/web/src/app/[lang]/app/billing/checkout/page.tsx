"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";

function CheckoutContent() {
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const lang = normalizeLang(params?.lang) as Lang;

  const target = searchParams?.get("target") || "standard";
  const current = searchParams?.get("current") || "starter";

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(135deg,#111827_0%,#1f2937_55%,#334155_100%)] p-7 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
        <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-[11px] font-medium text-white/90">
          Checkout Stub
        </div>

        <h1 className="mt-5 text-[34px] font-semibold tracking-tight">
          決済準備ページ
        </h1>

        <div className="mt-3 text-sm text-white/80">
          Step 27 では checkout 導線を stub 化しています。Step 40 で Stripe / KOMOJU などの本番決済に接続します。
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-[22px] bg-white/92 p-5 text-slate-900 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Current Plan</div>
            <div className="mt-2 text-xl font-semibold">{current}</div>
          </div>

          <div className="rounded-[22px] bg-white/92 p-5 text-slate-900 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Target Plan</div>
            <div className="mt-2 text-xl font-semibold">{target}</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={`/${lang}/app/billing/change?target=${target}`}
            className="ls-btn ls-btn-ghost inline-flex border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
          >
            プラン変更ページに戻る
          </Link>

          <Link
            href={`/${lang}/app/billing`}
            className="ls-btn ls-btn-ghost inline-flex border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
          >
            Billing に戻る
          </Link>
        </div>
      </section>

      <section className="ls-card-solid rounded-[28px] p-5">
        <div className="text-sm font-semibold text-slate-900">Next Implementation</div>
        <div className="mt-2 text-sm text-slate-600">
          ここに本番では checkout session 作成、決済失敗処理、success / cancel redirect を接続します。
        </div>
      </section>
    </main>
  );
}

export default function BillingCheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="rounded-[28px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          checkout page を読み込み中...
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
