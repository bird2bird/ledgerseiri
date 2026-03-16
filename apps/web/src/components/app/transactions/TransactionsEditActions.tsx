"use client";

import React from "react";

export function TransactionsEditActions(props: {
  onReset: () => void;
  onSave: () => void;
  resetDisabled?: boolean;
  saveDisabled?: boolean;
  saveLoading?: boolean;
}) {
  const {
    onReset,
    onSave,
    resetDisabled = false,
    saveDisabled = false,
    saveLoading = false,
  } = props;

  return (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        disabled={resetDisabled}
        onClick={onReset}
        className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        リセット
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={saveDisabled}
        className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saveLoading ? "保存中..." : "保存"}
      </button>
    </div>
  );
}

export default TransactionsEditActions;
