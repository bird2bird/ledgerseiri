"use client";

import React from "react";
import Link from "next/link";
import { PageShell } from "@/components/app/PageShell";
import { PageHeader } from "@/components/app/PageHeader";

export function PagePlaceholder({
  title,
  description,
  moduleKey,
  lang = "ja",
}: {
  title: string;
  description?: string;
  moduleKey: string;
  lang?: string;
}) {
  return (
    <PageShell>
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <Link
              href={`/${lang}/app`}
              className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold"
            >
              Dashboard
            </Link>
            <Link
              href={`/${lang}/app/billing`}
              className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold"
            >
              Billing
            </Link>
          </>
        }
      />

      <section className="ls-card-solid rounded-[28px] p-6">
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8">
          <div className="text-base font-semibold text-slate-900">開発中ページ</div>
          <div className="mt-2 text-sm text-slate-600">
            このページは Step 32 以降で本実装されます。
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-[20px] border border-black/5 bg-white p-4">
              <div className="text-[11px] font-medium text-slate-500">Module</div>
              <div className="mt-2 text-base font-semibold text-slate-900">{moduleKey}</div>
            </div>

            <div className="rounded-[20px] border border-black/5 bg-white p-4">
              <div className="text-[11px] font-medium text-slate-500">State</div>
              <div className="mt-2 text-base font-semibold text-amber-700">Placeholder Ready</div>
            </div>

            <div className="rounded-[20px] border border-black/5 bg-white p-4">
              <div className="text-[11px] font-medium text-slate-500">Next Phase</div>
              <div className="mt-2 text-base font-semibold text-slate-900">CRUD / Import / Export</div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
