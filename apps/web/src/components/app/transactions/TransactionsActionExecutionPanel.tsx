"use client";

import React from "react";

export function TransactionsActionExecutionPanel(props: {
  title?: string;
  description?: string;
  note?: string;
  onExecute?: () => void;
  executeLabel?: string;
  executeDisabled?: boolean;
  executeLoading?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryDisabled?: boolean;
}) {
  const {
    title = "実行アクション",
    description = "",
    note = "",
    onExecute,
    executeLabel = "実行",
    executeDisabled = false,
    executeLoading = false,
    secondaryLabel,
    onSecondary,
    secondaryDisabled = false,
  } = props;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-medium text-slate-900">{title}</div>

      {description ? (
        <div className="mt-2 text-sm text-slate-600">{description}</div>
      ) : null}

      {note ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {note}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap justify-end gap-3">
        {secondaryLabel ? (
          <button
            type="button"
            onClick={onSecondary}
            disabled={secondaryDisabled}
            className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {secondaryLabel}
          </button>
        ) : null}

        <button
          type="button"
          onClick={onExecute}
          disabled={executeDisabled}
          className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {executeLoading ? "実行中..." : executeLabel}
        </button>
      </div>
    </div>
  );
}

export default TransactionsActionExecutionPanel;
