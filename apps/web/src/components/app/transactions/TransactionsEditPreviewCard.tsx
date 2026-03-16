"use client";

import React from "react";

export type TransactionsEditPreviewItem = {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
};

export function TransactionsEditPreviewCard(props: {
  title?: string;
  items: TransactionsEditPreviewItem[];
}) {
  const { title = "編集対象プレビュー", items } = props;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-medium text-slate-900">{title}</div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
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

export default TransactionsEditPreviewCard;
