import { useMemo } from "react";
import type { IncomeCategory } from "@/core/transactions/transactions";
import {
  buildTransactionsActionHref,
  clearTransactionsActionHref,
} from "@/core/transactions/action-mode";
import {
  buildDrilldownHref,
  cloneSearchParams,
  setOrDeleteQueryParam,
} from "@/core/drilldown/query-contract";

export function useIncomePageOrchestration(args: {
  pathname: string;
  searchParams: { get(name: string): string | null; toString(): string };
  router: { replace(href: string): void };
  selectedRowId: string;
}) {
  const { pathname, searchParams, router, selectedRowId } = args;

  function updateCategory(next: IncomeCategory) {
    const qs = cloneSearchParams(searchParams);
    setOrDeleteQueryParam(qs, "category", next, "all");
    router.replace(buildDrilldownHref(pathname, qs));
  }

  function updateStoreId(next: string) {
    const qs = cloneSearchParams(searchParams);
    setOrDeleteQueryParam(qs, "storeId", next, "all");
    router.replace(buildDrilldownHref(pathname, qs));
  }

  function updateRange(next: string) {
    const qs = cloneSearchParams(searchParams);
    setOrDeleteQueryParam(qs, "range", next, "30d");
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
      { label: "新規収入", href: buildCurrentPageActionHref("create") },
      { label: "CSV取込", href: buildCurrentPageActionHref("import") },
      { label: "編集", href: buildCurrentPageActionHref("edit"), disabled: !selectedRowId },
      { label: "店舗紐付け", href: buildCurrentPageActionHref("link-store") },
    ],
    [pathname, searchParams, selectedRowId]
  );

  return {
    updateCategory,
    updateStoreId,
    updateRange,
    clearActionMode,
    sidebarActions,
  };
}
