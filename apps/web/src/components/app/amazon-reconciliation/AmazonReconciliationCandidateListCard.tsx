import React, { useMemo } from "react";
import type { MatchingCandidate } from "@/core/amazon-reconciliation";

type CandidateDecision = "approved" | "rejected";
type DecisionMap = Record<string, CandidateDecision | undefined>;

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

function decisionTone(decision: CandidateDecision) {
  return decision === "approved"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-rose-200 bg-rose-50 text-rose-700";
}

function decisionLabel(decision: CandidateDecision) {
  return decision === "approved" ? "Approved" : "Rejected";
}

function formatConfidence(value: number) {
  return `${Math.round(value * 100)}%`;
}

function getRankBadge(candidate: MatchingCandidate) {
  if (candidate.status === "auto" && candidate.confidence >= 0.9) {
    return {
      label: "Top Match",
      className: "border-sky-200 bg-sky-50 text-sky-700",
    };
  }

  if (candidate.status === "auto" && candidate.confidence >= 0.8) {
    return {
      label: "Good Match",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (candidate.status === "review") {
    return {
      label: "Review Needed",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Blocked",
    className: "border-slate-200 bg-slate-50 text-slate-700",
  };
}

function buildExplanationBullets(candidate: MatchingCandidate): string[] {
  const bullets: string[] = [];

  if (candidate.confidence >= 0.9) {
    bullets.push("High-confidence candidate based on the current matching strategy.");
  } else if (candidate.confidence >= 0.8) {
    bullets.push("Strong candidate with good domain/time alignment.");
  } else if (candidate.confidence >= 0.6) {
    bullets.push("Moderate-confidence candidate that still benefits from user confirmation.");
  } else {
    bullets.push("Lower-confidence candidate that should be checked carefully.");
  }

  if (candidate.status === "auto") {
    bullets.push("Engine marked this candidate as auto-reconcilable.");
  } else if (candidate.status === "review") {
    bullets.push("Engine still requires manual review before confirmation.");
  } else {
    bullets.push("Engine baseline is not ready for this candidate yet.");
  }

  bullets.push(candidate.reason);

  return bullets;
}

export function AmazonReconciliationCandidateListCard(props: {
  candidates: MatchingCandidate[];
  decisionById: DecisionMap;
  onApprove: (candidateId: string) => void;
  onReject: (candidateId: string) => void;
}) {
  const approvedCount = props.candidates.filter(
    (candidate) => props.decisionById[candidate.id] === "approved"
  ).length;

  const rejectedCount = props.candidates.filter(
    (candidate) => props.decisionById[candidate.id] === "rejected"
  ).length;

  const pendingCount = props.candidates.length - approvedCount - rejectedCount;

  const rankedCandidates = useMemo(() => {
    return [...props.candidates].sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;

      const statusRank = (status: MatchingCandidate["status"]) =>
        status === "auto" ? 3 : status === "review" ? 2 : 1;

      return statusRank(b.status) - statusRank(a.status);
    });
  }, [props.candidates]);

  return (
    <section className="ls-card-solid rounded-[28px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Matching Candidates</div>
          <div className="mt-1 text-[12px] text-slate-500">
            Candidate-level review queue ranked by confidence and matching explanation.
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] font-medium text-slate-500">Total</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {props.candidates.length}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] font-medium text-slate-500">Approved</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{approvedCount}</div>
        </div>
        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] font-medium text-slate-500">Rejected</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{rejectedCount}</div>
        </div>
        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] font-medium text-slate-500">Pending</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">{pendingCount}</div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {rankedCandidates.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
            No matching candidates available yet.
          </div>
        ) : (
          rankedCandidates.map((candidate, index) => {
            const decision = props.decisionById[candidate.id];
            const rankBadge = getRankBadge(candidate);
            const bullets = buildExplanationBullets(candidate);

            return (
              <div
                key={candidate.id}
                className="rounded-[22px] border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-medium text-slate-900">
                        #{index + 1}
                      </div>
                      <div
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${rankBadge.className}`}
                      >
                        {rankBadge.label}
                      </div>
                    </div>

                    <div className="mt-2 text-sm font-medium text-slate-900">
                      {candidate.sourceLabel}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      → {candidate.targetLabel}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusTone(candidate.status)}`}
                    >
                      {statusLabel(candidate.status)}
                    </div>

                    {decision && (
                      <div
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${decisionTone(decision)}`}
                      >
                        {decisionLabel(decision)}
                      </div>
                    )}
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

                <div className="mt-4 rounded-[18px] border border-slate-100 bg-slate-50 p-3">
                  <div className="text-[11px] font-medium text-slate-500">Why this rank</div>
                  <div className="mt-2 space-y-1">
                    {bullets.map((bullet) => (
                      <div key={bullet} className="text-sm text-slate-600">
                        • {bullet}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => props.onApprove(candidate.id)}
                    disabled={decision === "approved"}
                    className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    onClick={() => props.onReject(candidate.id)}
                    disabled={decision === "rejected"}
                    className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
