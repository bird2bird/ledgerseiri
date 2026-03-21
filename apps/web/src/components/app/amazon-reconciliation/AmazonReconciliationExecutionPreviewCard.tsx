import React from "react";
import type { MatchingExecutionPreview } from "@/core/amazon-reconciliation";

function stateTone(state: "eligible" | "review" | "blocked") {
  if (state === "eligible") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (state === "review") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function AmazonReconciliationExecutionPreviewCard(props: {
  model: MatchingExecutionPreview;
}) {
  return (
    <section className="ls-card-solid rounded-[28px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Execution Preview</div>
          <div className="mt-1 text-[12px] text-slate-500">{props.model.nextStepLabel}</div>
        </div>
      </div>

      <div className="mt-3 text-sm text-slate-600">{props.model.nextStepDetail}</div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] font-medium text-slate-500">Eligible</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{props.model.eligibleCount}</div>
        </div>
        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] font-medium text-slate-500">Review Queue</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{props.model.reviewQueueCount}</div>
        </div>
        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] font-medium text-slate-500">Blocked</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{props.model.blockedCount}</div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {props.model.suggestedMatches.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
            No execution preview candidates yet.
          </div>
        ) : (
          props.model.suggestedMatches.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-4 rounded-[22px] border border-slate-200 p-4"
            >
              <div>
                <div className="text-sm font-medium text-slate-900">{item.label}</div>
                <div className="mt-1 text-xs text-slate-500">{item.detail}</div>
              </div>

              <div
                className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${stateTone(item.state)}`}
              >
                {item.confidenceLabel}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
