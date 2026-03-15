"use client";

import React from "react";

export function TransactionsInlineActionPanel(props: {
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { title, description, onClose, children } = props;

  return (
    <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{description}</div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          閉じる
        </button>
      </div>

      <div className="mt-5">{children}</div>
    </div>
  );
}

export default TransactionsInlineActionPanel;
