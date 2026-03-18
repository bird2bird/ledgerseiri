import { useMemo } from "react";
import { buildTransactionsActionHref } from "@/core/transactions/action-mode";
import {
  buildDrilldownHref,
  cloneSearchParams,
} from "@/core/drilldown/query-contract";

export type JournalsPageActionItem = {
  label: string;
  href: string;
  disabled?: boolean;
};

export function useJournalsPageActions(args: {
  pathname: string;
  searchParams: { get(name: string): string | null; toString(): string };
  selectedRowId: string;
}) {
  const { pathname, searchParams, selectedRowId } = args;

  const buildCurrentPageActionHref = (nextAction: string) => {
    return buildTransactionsActionHref(pathname, searchParams, nextAction);
  };

  const buildFlaggedHref = () => {
    const qs = cloneSearchParams(searchParams);
    qs.set("tab", "flagged");
    qs.set("action", "flagged");
    return buildDrilldownHref(pathname, qs);
  };

  const sidebarActions = useMemo<JournalsPageActionItem[]>(
    () => [
      { label: "新規仕訳", href: buildCurrentPageActionHref("create") },
      { label: "CSV取込", href: buildCurrentPageActionHref("import") },
      {
        label: "一括転記",
        href: buildCurrentPageActionHref("bulk-post"),
        disabled: !selectedRowId,
      },
      { label: "要確認一覧", href: buildFlaggedHref() },
    ],
    [pathname, searchParams, selectedRowId]
  );

  return {
    sidebarActions,
    buildCurrentPageActionHref,
    buildFlaggedHref,
  };
}
