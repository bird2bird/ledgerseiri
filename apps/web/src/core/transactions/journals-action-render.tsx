import React from "react";
import { TransactionsActionWorkflow } from "@/components/app/transactions/TransactionsActionWorkflow";

export function renderBulkPostActionPanel(args: {
  selectedRow: unknown;
  bulkPostWorkflowProps: React.ComponentProps<typeof TransactionsActionWorkflow> | null;
}) {
  const { selectedRow, bulkPostWorkflowProps } = args;

  if (!selectedRow || !bulkPostWorkflowProps) {
    return (
      <div className="text-sm text-slate-600">
        一括転記を行うには、先に一覧から 1 行選択してください。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TransactionsActionWorkflow {...bulkPostWorkflowProps} />
    </div>
  );
}

export function renderFlaggedActionPanel(args: {
  flaggedWorkflowProps: React.ComponentProps<typeof TransactionsActionWorkflow>;
}) {
  const { flaggedWorkflowProps } = args;

  return (
    <div className="space-y-4">
      <TransactionsActionWorkflow {...flaggedWorkflowProps} />
    </div>
  );
}
