"use client";

import React from "react";

export type TransactionsReadonlyMetaItem = {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
};

export function TransactionsReadonlyMetaGrid(props: {
  items: TransactionsReadonlyMetaItem[];
  className?: string;
}) {
  const { items, className = "" } = props;

  return (
    <div className={className}>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item, idx) => (
          <div
            key={`${item.label}-${idx}`}
            className={item.fullWidth ? "sm:col-span-2" : ""}
          >
            <div className="text-xs uppercase tracking-wide text-slate-500">
              {item.label}
            </div>
            <div className="mt-1 text-sm font-medium text-slate-900">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TransactionsReadonlyMetaGrid;
