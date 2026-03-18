import React from "react";
import type { JournalRow, JournalTab } from "@/core/transactions/transactions";
import { renderJournalsActionPanel } from "@/core/transactions/journals-action-panels";
import { renderJournalsMainContent } from "@/core/transactions/journals-page-main-content";
import { renderJournalsHeaderTabs } from "@/core/transactions/journals-page-header-tabs";

type JournalsActionPanelArgs = Parameters<typeof renderJournalsActionPanel>[0];

export function renderJournalsPageShell(args: {
  lang: string;
  isDashboard: boolean;
  rawFrom: string | null;
  from: string;
  rawStoreId: string | null;
  storeId: string;
  rawRange: string | null;
  range: string;
  tab: JournalTab;
  adapterNote: string;

  tabItems: JournalTab[];
  tabLabels: Record<JournalTab, string>;
  onUpdateTab: (next: JournalTab) => void;

  action: string;
  actionPanelProps: Omit<JournalsActionPanelArgs, "action" | "lang">;

  rows: JournalRow[];
  selectedRowId: string;
  selectedRow: JournalRow | null;
  loading: boolean;
  error: string;
  totalAmount: string;
  onSelectRow: (id: string) => void;
  fmtJPY: (value: number) => string;
}) {
  const {
    lang,
    isDashboard,
    rawFrom,
    from,
    rawStoreId,
    storeId,
    rawRange,
    range,
    tab,
    adapterNote,
    tabItems,
    tabLabels,
    onUpdateTab,
    action,
    actionPanelProps,
    rows,
    selectedRowId,
    selectedRow,
    loading,
    error,
    totalAmount,
    onSelectRow,
    fmtJPY,
  } = args;

  return (
    <div className="space-y-6">
      {renderJournalsHeaderTabs({
        lang,
        isDashboard,
        rawFrom,
        from,
        rawStoreId,
        storeId,
        rawRange,
        range,
        tab,
        adapterNote,
        tabItems,
        tabLabels,
        onUpdateTab,
      })}

      {renderJournalsActionPanel({
        action,
        lang,
        ...actionPanelProps,
      })}

      {renderJournalsMainContent({
        rows,
        selectedRowId,
        selectedRow,
        loading,
        error,
        totalAmount,
        onSelectRow,
        fmtJPY,
        tabLabels,
      })}
    </div>
  );
}
