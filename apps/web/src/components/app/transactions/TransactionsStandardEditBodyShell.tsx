"use client";

import React from "react";

export function TransactionsStandardEditBodyShell(props: {
  info: React.ReactNode;
  primaryFields: React.ReactNode;
  memoField: React.ReactNode;
  feedback: React.ReactNode;
  actions: React.ReactNode;
  className?: string;
}) {
  const {
    info,
    primaryFields,
    memoField,
    feedback,
    actions,
    className = "",
  } = props;

  return (
    <div className={`space-y-4 ${className}`.trim()}>
      {info}
      {primaryFields}
      {memoField}
      {feedback}
      {actions}
    </div>
  );
}

export default TransactionsStandardEditBodyShell;
