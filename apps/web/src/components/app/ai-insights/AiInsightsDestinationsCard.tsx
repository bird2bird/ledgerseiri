import Link from "next/link";
import React from "react";

export function AiInsightsDestinationsCard(props: {
  profitHref: string;
  cashflowHref: string;
  unpaidHref: string;
}) {
  return (
    <section className="ls-card-solid rounded-[28px] p-6">
      <div className="text-sm font-semibold text-slate-900">移動先</div>
      <div className="mt-4 grid grid-cols-1 gap-3">
        <Link
          href={props.profitHref}
          className="rounded-[18px] border border-black/5 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
        >
          利益分析
        </Link>
        <Link
          href={props.cashflowHref}
          className="rounded-[18px] border border-black/5 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
        >
          キャッシュフロー
        </Link>
        <Link
          href={props.unpaidHref}
          className="rounded-[18px] border border-black/5 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
        >
          未入金
        </Link>
      </div>
    </section>
  );
}
