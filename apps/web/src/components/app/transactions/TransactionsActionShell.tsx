"use client";

import React from "react";

export function TransactionsActionShell(props: {
  preview: React.ReactNode;
  status?: React.ReactNode;
  execution: React.ReactNode;
  className?: string;
}) {
  const {
    preview,
    status,
    execution,
    className = "",
  } = props;

  return (
    <div className={`space-y-4 ${className}`.trim()}>
      {preview}
      {status ? status : null}
      {execution}
    </div>
  );
}

export default TransactionsActionShell;
