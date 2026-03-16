"use client";

import React from "react";

export function TransactionsEditFeedback(props: {
  dirty: boolean;
  error?: string;
  message?: string;
  banner: string;
  dirtyMessage?: string;
  cleanMessage?: string;
}) {
  const {
    dirty,
    error,
    message,
    banner,
    dirtyMessage = "未保存の変更があります。",
    cleanMessage = "まだ変更はありません。",
  } = props;

  return (
    <>
      {dirty ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {dirtyMessage}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {cleanMessage}
        </div>
      )}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {banner}
      </div>
    </>
  );
}

export default TransactionsEditFeedback;
