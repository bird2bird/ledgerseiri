"use client";

import React from "react";
import {
  TransactionsActionPreviewCard,
  type TransactionsActionPreviewItem,
} from "@/components/app/transactions/TransactionsActionPreviewCard";
import { TransactionsActionStatusBanner } from "@/components/app/transactions/TransactionsActionStatusBanner";
import { TransactionsActionExecutionPanel } from "@/components/app/transactions/TransactionsActionExecutionPanel";
import { TransactionsActionShell } from "@/components/app/transactions/TransactionsActionShell";

export function TransactionsActionWorkflow(props: {
  previewTitle: string;
  previewItems: TransactionsActionPreviewItem[];
  statusMessage?: string;
  statusTone?: "info" | "success" | "error";
  executionTitle: string;
  executionDescription: string;
  executionNote?: string;
  onExecute?: () => void;
  executeLabel: string;
  executeDisabled?: boolean;
  executeLoading?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryDisabled?: boolean;
  className?: string;
}) {
  const {
    previewTitle,
    previewItems,
    statusMessage = "",
    statusTone = "info",
    executionTitle,
    executionDescription,
    executionNote = "",
    onExecute,
    executeLabel,
    executeDisabled = false,
    executeLoading = false,
    secondaryLabel,
    onSecondary,
    secondaryDisabled = false,
    className = "",
  } = props;

  return (
    <TransactionsActionShell
      className={className}
      preview={
        <TransactionsActionPreviewCard
          title={previewTitle}
          items={previewItems}
        />
      }
      status={
        <TransactionsActionStatusBanner
          message={statusMessage}
          tone={statusTone}
        />
      }
      execution={
        <TransactionsActionExecutionPanel
          title={executionTitle}
          description={executionDescription}
          note={executionNote}
          onExecute={onExecute}
          executeLabel={executeLabel}
          executeDisabled={executeDisabled}
          executeLoading={executeLoading}
          secondaryLabel={secondaryLabel}
          onSecondary={onSecondary}
          secondaryDisabled={secondaryDisabled}
        />
      }
    />
  );
}

export default TransactionsActionWorkflow;
