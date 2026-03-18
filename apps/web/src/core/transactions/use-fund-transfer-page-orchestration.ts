import { useMemo } from "react";
import type { TransferStatus } from "@/core/transactions/transactions";
import {
  buildTransactionsActionHref,
  clearTransactionsActionHref,
} from "@/core/transactions/action-mode";
import {
  buildDrilldownHref,
  cloneSearchParams,
  setOrDeleteQueryParam,
} from "@/core/drilldown/query-contract";

export function useFundTransferPageOrchestration(args: {
  pathname: string;
  searchParams: { get(name: string): string | null; toString(): string };
  router: { replace(href: string): void };
  selectedRowId: string;
}) {
  const { pathname, searchParams, router, selectedRowId } = args;

  function updateStatus(next: TransferStatus) {
    const qs = cloneSearchParams(searchParams);
    setOrDeleteQueryParam(qs, "status", next, "all");
    router.replace(buildDrilldownHref(pathname, qs));
  }

  function buildCurrentPageActionHref(nextAction: string) {
    return buildTransactionsActionHref(pathname, searchParams, nextAction);
  }

  function clearActionMode() {
    router.replace(clearTransactionsActionHref(pathname, searchParams));
  }

  const sidebarActions = useMemo(
    () => [
      { label: "新規振替", href: buildCurrentPageActionHref("create") },
      { label: "CSV取込", href: buildCurrentPageActionHref("import") },
      { label: "編集", href: buildCurrentPageActionHref("edit"), disabled: !selectedRowId },
      { label: "再同期", href: buildCurrentPageActionHref("resync"), disabled: !selectedRowId },
      { label: "明細確認", href: buildCurrentPageActionHref("details") },
    ],
    [pathname, searchParams, selectedRowId]
  );

  return {
    updateStatus,
    clearActionMode,
    sidebarActions,
  };
}
