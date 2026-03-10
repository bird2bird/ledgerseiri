"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { normalizeLang, type Lang } from "@/lib/i18n/lang";

function PortalContent() {
  const params = useParams<{ lang: string }>();
  const lang = normalizeLang(params?.lang) as Lang;

  return (
    <main className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-white/60 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#334155_100%)] p-7 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
        <div className="inline-flex rounded-full bg-white/12 px-3 py-1 text-[11px] font-medium text-white/90">
          Billing Portal Stub
        </div>

        <h1 className="mt-5 text-[34px] font-semibold tracking-tight">
          請求管理ポータル
        </h1>

        <div className="mt-3 text-sm text-white/80">
          Step 27 では portal 導線を stub 化しています。Step 40 で本番の subscription 管理ポータルへ接続します。
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-[22px] bg-white/92 p-5 text-slate-900 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Planned Feature</div>
            <div className="mt-2 text-base font-semibold">Upgrade / Downgrade</div>
          </div>

          <div className="rounded-[22px] bg-white/92 p-5 text-slate-900 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Planned Feature</div>
            <div className="mt-2 text-base font-semibold">Payment Method</div>
          </div>

          <div className="rounded-[22px] bg-white/92 p-5 text-slate-900 shadow-sm">
            <div className="text-[11px] font-medium text-slate-500">Planned Feature</div>
            <div className="mt-2 text-base font-semibold">Invoice History</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={`/${lang}/app/billing`}
            className="ls-btn ls-btn-ghost inline-flex border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
          >
            Billing に戻る
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function BillingPortalPage() {
  return (
    <Suspense
      fallback={
        <main className="rounded-[28px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          billing portal page を読み込み中...
        </main>
      }
    >
      <PortalContent />
    </Suspense>
  );
}
