import React from "react";

export type TransactionsSelectedSummaryItem = {
  label: string;
  value: React.ReactNode;
};

export function renderTransactionsSelectedSummary(args: {
  title?: string;
  emptyMessage: string;
  selected: boolean;
  items: TransactionsSelectedSummaryItem[];
}) {
  const {
    title = "Selected Row",
    emptyMessage,
    selected,
    items,
  } = args;

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-medium text-slate-900">{title}</div>
      {selected ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.label}>
              <div className="text-xs uppercase tracking-wide text-slate-500">
                {item.label}
              </div>
              <div className="mt-1 text-sm font-medium text-slate-900">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 text-sm text-slate-500">{emptyMessage}</div>
      )}
    </div>
  );
}
