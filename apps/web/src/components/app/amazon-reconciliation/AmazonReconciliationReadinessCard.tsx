import React from "react";
import type { MatchingBaselineSummary } from "@/core/amazon-reconciliation";

function toneClass(status: "ready" | "attention" | "planned") {
  if (status === "ready") return "border-emerald-200 bg-emerald-50";
  if (status === "attention") return "border-amber-200 bg-amber-50";
  return "border-black/5 bg-slate-50";
}

export function AmazonReconciliationReadinessCard(props: {
  matching: MatchingBaselineSummary;
}) {
  const blocks = [
    props.matching.importBaseline,
    props.matching.exportBaseline,
    props.matching.matchingEngine,
  ];

  return (
    <section className="ls-card-solid rounded-[28px] p-5 xl:col-span-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Reconciliation Readiness</div>
          <div className="mt-1 text-[12px] text-slate-500">
            Amazon settlement / order / fee file reconciliation preparation baseline
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] font-medium text-slate-500">Failed Jobs</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {props.matching.totalFailedJobs}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {blocks.map((block) => (
          <div
            key={block.title}
            className={`rounded-[22px] border p-4 ${toneClass(block.status)}`}
          >
            <div className="text-[11px] font-medium text-slate-500">{block.title}</div>
            <div className="mt-2 text-base font-semibold text-slate-900">{block.headline}</div>
            <div className="mt-2 text-sm text-slate-600">{block.detail}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
