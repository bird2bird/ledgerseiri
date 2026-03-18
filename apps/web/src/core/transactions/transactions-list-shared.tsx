import React from "react";

export function renderTransactionsListTable(args: {
  columns: React.ReactNode;
  loading: boolean;
  error: string;
  isEmpty: boolean;
  emptyMessage?: string;
  rows: React.ReactNode;
}) {
  const {
    columns,
    loading,
    error,
    isEmpty,
    emptyMessage = "no rows",
    rows,
  } = args;

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
      {columns}

      {loading ? (
        <div className="px-4 py-8 text-sm text-slate-500">loading...</div>
      ) : error ? (
        <div className="px-4 py-8 text-sm text-rose-600">{error}</div>
      ) : isEmpty ? (
        <div className="px-4 py-8 text-sm text-slate-500">{emptyMessage}</div>
      ) : (
        rows
      )}
    </div>
  );
}
