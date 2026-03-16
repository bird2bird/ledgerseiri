"use client";

import React from "react";
import { TransactionsPanelSection } from "@/components/app/transactions/TransactionsPanelSection";

export function TransactionsEditInfoStack(props: {
  preview: React.ReactNode;
  meta?: React.ReactNode;
  metaTitle?: string;
  className?: string;
}) {
  const {
    preview,
    meta,
    metaTitle = "参照情報",
    className = "",
  } = props;

  return (
    <div className={`space-y-4 ${className}`.trim()}>
      <TransactionsPanelSection>{preview}</TransactionsPanelSection>
      {meta ? (
        <TransactionsPanelSection title={metaTitle}>{meta}</TransactionsPanelSection>
      ) : null}
    </div>
  );
}

export default TransactionsEditInfoStack;
