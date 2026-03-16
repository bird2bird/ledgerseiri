"use client";

import React from "react";

export function TransactionsEditAmountField(props: {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  label?: string;
  invalidMessage?: string;
}) {
  const {
    value,
    onChange,
    invalid = false,
    label = "金額",
    invalidMessage = "0 より大きい金額を入力してください。",
  } = props;

  return (
    <div>
      <div className="mb-1 text-sm font-medium text-slate-700">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="numeric"
        className="h-11 w-full rounded-[14px] border border-black/8 bg-white px-3 text-sm"
      />
      {invalid ? (
        <div className="mt-1 text-xs text-rose-600">{invalidMessage}</div>
      ) : null}
    </div>
  );
}

export default TransactionsEditAmountField;
