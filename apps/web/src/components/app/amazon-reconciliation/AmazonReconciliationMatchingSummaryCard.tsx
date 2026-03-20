import Link from "next/link";
import React from "react";
import type { MatchingSummaryCardModel } from "@/core/amazon-reconciliation";

export function AmazonReconciliationMatchingSummaryCard(props: {
  lang: string;
  model: MatchingSummaryCardModel;
}) {
  return (
    <section className="ls-card-solid rounded-[28px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">{props.model.title}</div>
          <div className="mt-1 text-[12px] text-slate-500">{props.model.lead}</div>
        </div>

        <Link
          href={`/${props.lang}${props.model.nextActionHref}`}
          className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold"
        >
          {props.model.nextActionLabel}
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] font-medium text-slate-500">{props.model.coverageLabel}</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">
            {props.model.coverageValue}
          </div>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] font-medium text-slate-500">{props.model.failedJobsLabel}</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">
            {props.model.failedJobsValue}
          </div>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] font-medium text-slate-500">
            {props.model.latestActivityLabel}
          </div>
          <div className="mt-2 text-lg font-semibold text-slate-900">
            {props.model.latestActivityValue}
          </div>
        </div>
      </div>
    </section>
  );
}
