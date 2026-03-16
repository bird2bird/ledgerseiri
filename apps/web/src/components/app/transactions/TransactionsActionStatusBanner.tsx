"use client";

import React from "react";

export type TransactionsActionStatusTone = "info" | "success" | "error";

export function TransactionsActionStatusBanner(props: {
  message?: string;
  tone?: TransactionsActionStatusTone;
  className?: string;
}) {
  const {
    message = "",
    tone = "info",
    className = "",
  } = props;

  if (!message) return null;

  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "error"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-blue-200 bg-blue-50 text-blue-800";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClass} ${className}`.trim()}>
      {message}
    </div>
  );
}

export default TransactionsActionStatusBanner;
