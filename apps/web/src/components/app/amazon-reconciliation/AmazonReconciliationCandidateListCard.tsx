import React from "react";
import type { MatchingCandidate } from "@/core/amazon-reconciliation";

function statusTone(status: "auto" | "review" | "blocked") {
  if (status === "auto") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "review") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function statusLabel(status: "auto" | "review" | "blocked") {
  if (status === "auto") return "Auto";
  if (status === "review") return "Review";
  return "Blocked";
}

function formatConfidence(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function AmazonReconciliationCandidateListCard(props: {
  candidates: MatchingCandidate[];
}) {
  return (
    <section className="ls-card-solid rounded-[28px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Matching Candidates</div>
          <div className="mt-1 text-[12px] text-slate-500">
            Baseline candidate list derived from the matching engine runtime.
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] font-medium text-slate-500">Total</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {props.candidates.length}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {props.candidates.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
            No matching candidates available yet.
          </div>
        ) : (
          props.candidates.map((candidate) => (
            <div
              key={candidate.id}
              className="rounded-[22px] border border-slate-200 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    {candidate.sourceLabel}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    → {candidate.targetLabel}
                  </div>
                </div>

                <div
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusTone(candidate.status)}`}
                >
                  {statusLabel(candidate.status)}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-[18px] border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="text-[11px] font-medium text-slate-500">Source</div>
                  <div className="mt-1 text-sm text-slate-900">{candidate.sourceType}</div>
                </div>

                <div className="rounded-[18px] border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="text-[11px] font-medium text-slate-500">Target</div>
                  <div className="mt-1 text-sm text-slate-900">{candidate.targetType}</div>
                </div>

                <div className="rounded-[18px] border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="text-[11px] font-medium text-slate-500">Confidence</div>
                  <div className="mt-1 text-sm text-slate-900">
                    {formatConfidence(candidate.confidence)}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-sm text-slate-600">{candidate.reason}</div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
