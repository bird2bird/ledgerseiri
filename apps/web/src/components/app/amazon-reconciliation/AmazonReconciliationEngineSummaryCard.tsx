import Link from "next/link";
import React from "react";
import type { MatchingEngineSummary } from "@/core/amazon-reconciliation";

export function AmazonReconciliationEngineSummaryCard({
  lang,
  model,
}: {
  lang: string;
  model: MatchingEngineSummary;
}) {
  return (
    <div className="rounded-2xl border p-5 bg-white shadow-sm">
      <div className="text-sm text-gray-500 mb-1">
        Matching Engine
      </div>

      <div className="text-lg font-semibold mb-2">
        {model.statusLabel}
      </div>

      <div className="text-sm text-gray-600 mb-3">
        {model.summaryText}
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-gray-400">Matched</div>
          <div className="font-medium">{model.matchedCount}</div>
        </div>

        <div>
          <div className="text-gray-400">Unmatched</div>
          <div className="font-medium">{model.unmatchedCount}</div>
        </div>

        <div>
          <div className="text-gray-400">Review</div>
          <div className="font-medium">{model.reviewRequiredCount}</div>
        </div>
      </div>

      {(model.primaryAction || model.secondaryAction) && (
        <div className="mt-4 flex flex-wrap gap-3">
          {model.primaryAction && (
            <Link
              href={`/${lang}${model.primaryAction.href}`}
              className="ls-btn ls-btn-primary inline-flex px-4 py-2 text-sm font-semibold"
            >
              {model.primaryAction.label}
            </Link>
          )}

          {model.secondaryAction && (
            <Link
              href={`/${lang}${model.secondaryAction.href}`}
              className="ls-btn ls-btn-ghost inline-flex px-4 py-2 text-sm font-semibold"
            >
              {model.secondaryAction.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
