"use client";

import React from "react";

export function ErrorState({
  title = "読み込みに失敗しました",
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6">
      <div className="text-sm font-semibold text-rose-700">{title}</div>
      {description ? <div className="mt-2 text-sm text-rose-600">{description}</div> : null}
    </div>
  );
}
