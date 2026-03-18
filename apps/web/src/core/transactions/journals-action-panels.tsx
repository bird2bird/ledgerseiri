import React from "react";
import Link from "next/link";
import { TransactionsInlineActionPanel } from "@/components/app/transactions/TransactionsInlineActionPanel";
import {
  renderBulkPostActionPanel,
  renderFlaggedActionPanel,
} from "@/core/transactions/journals-action-render";
import { TransactionsActionWorkflow } from "@/components/app/transactions/TransactionsActionWorkflow";
import type { JournalRow } from "@/core/transactions/transactions";

export function renderJournalsBulkPostPanel(args: {
  selectedRow: JournalRow | null;
  bulkPostWorkflowProps: React.ComponentProps<typeof TransactionsActionWorkflow> | null;
  clearActionMode: () => void;
}) {
  const { selectedRow, bulkPostWorkflowProps, clearActionMode } = args;

  return (
    <TransactionsInlineActionPanel
      title="一括転記"
      description="選択中の仕訳を対象に、次段階で実際の bulk post action へ接続します。"
      onClose={clearActionMode}
    >
      {renderBulkPostActionPanel({
        selectedRow,
        bulkPostWorkflowProps,
      })}
    </TransactionsInlineActionPanel>
  );
}

export function renderJournalsFlaggedPanel(args: {
  flaggedWorkflowProps: React.ComponentProps<typeof TransactionsActionWorkflow>;
  clearActionMode: () => void;
}) {
  const { flaggedWorkflowProps, clearActionMode } = args;

  return (
    <TransactionsInlineActionPanel
      title="要確認仕訳"
      description="flagged 絞り込み一覧を対象に、review action shell を標準化します。"
      onClose={clearActionMode}
    >
      {renderFlaggedActionPanel({
        flaggedWorkflowProps,
      })}
    </TransactionsInlineActionPanel>
  );
}

export function renderJournalsCreatePanel(args: {
  clearActionMode: () => void;
}) {
  const { clearActionMode } = args;

  return (
    <TransactionsInlineActionPanel
      title="新規仕訳"
      description="journal API 導入前のため、ここでは operation mode の固定化のみを行います。"
      onClose={clearActionMode}
    >
      <div className="text-sm text-slate-600">
        Step41G では journals を page-internal action mode に統合しました。次段階で real journal contract を追加後、この領域を form 化します。
      </div>
    </TransactionsInlineActionPanel>
  );
}

export function renderJournalsImportPanel(args: {
  lang: string;
  clearActionMode: () => void;
}) {
  const { lang, clearActionMode } = args;

  return (
    <TransactionsInlineActionPanel
      title="仕訳CSV取込"
      description="取込導線は page-internal action mode に接続済みです。"
      onClose={clearActionMode}
    >
      <Link
        href={`/${lang}/app/data/import?module=journals`}
        className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        import center を開く
      </Link>
    </TransactionsInlineActionPanel>
  );
}

export function renderJournalsActionPanel(args: {
  action: string;
  lang: string;
  selectedRow: JournalRow | null;
  bulkPostWorkflowProps: React.ComponentProps<typeof import("@/components/app/transactions/TransactionsActionWorkflow").TransactionsActionWorkflow> | null;
  flaggedWorkflowProps: React.ComponentProps<typeof import("@/components/app/transactions/TransactionsActionWorkflow").TransactionsActionWorkflow>;
  clearActionMode: () => void;
}) {
  const {
    action,
    lang,
    selectedRow,
    bulkPostWorkflowProps,
    flaggedWorkflowProps,
    clearActionMode,
  } = args;

  if (action === "create") {
    return renderJournalsCreatePanel({
      clearActionMode,
    });
  }

  if (action === "import") {
    return renderJournalsImportPanel({
      lang,
      clearActionMode,
    });
  }

  if (action === "bulk-post") {
    return renderJournalsBulkPostPanel({
      selectedRow,
      bulkPostWorkflowProps,
      clearActionMode,
    });
  }

  if (action === "flagged") {
    return renderJournalsFlaggedPanel({
      flaggedWorkflowProps,
      clearActionMode,
    });
  }

  return null;
}

