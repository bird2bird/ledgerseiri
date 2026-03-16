"use client";

import React from "react";

export function TransactionsPanelSection(props: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const {
    title,
    children,
    className = "",
    contentClassName = "",
  } = props;

  return (
    <div className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 ${className}`.trim()}>
      {title ? (
        <div className="text-sm font-medium text-slate-900">{title}</div>
      ) : null}
      <div className={`${title ? "mt-3 " : ""}${contentClassName}`.trim()}>
        {children}
      </div>
    </div>
  );
}

export default TransactionsPanelSection;
