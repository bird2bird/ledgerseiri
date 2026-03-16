"use client";

import React from "react";

export function TransactionsEditMemoField(props: {
  value: string;
  onChange: (value: string) => void;
  tooLong?: boolean;
  maxLength?: number;
  label?: string;
}) {
  const {
    value,
    onChange,
    tooLong = false,
    maxLength = 500,
    label = "メモ",
  } = props;

  return (
    <div>
      <div className="mb-1 text-sm font-medium text-slate-700">{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full rounded-[14px] border border-black/8 bg-white px-3 py-3 text-sm"
      />
      <div className="mt-1 flex items-center justify-between text-xs">
        <span className={tooLong ? "text-rose-600" : "text-slate-500"}>
          {tooLong ? `メモは ${maxLength} 文字以内で入力してください。` : `${maxLength} 文字まで入力できます。`}
        </span>
        <span className={tooLong ? "text-rose-600" : "text-slate-400"}>
          {value.length} / {maxLength}
        </span>
      </div>
    </div>
  );
}

export default TransactionsEditMemoField;
