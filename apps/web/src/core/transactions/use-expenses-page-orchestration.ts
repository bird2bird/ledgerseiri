import { useMemo } from "react";
import type { ExpenseCategory } from "@/core/transactions/transactions";
import {
  buildTransactionsActionHref,
  clearTransactionsActionHref,
} from "@/core/transactions/action-mode";
import {
  buildDrilldownHref,
  cloneSearchParams,
  setOrDeleteQueryParam,
} from "@/core/drilldown/query-contract";

export function useExpensesPageOrchestration(args: {
  pathname: string;
  searchParams: { get(name: string): string | null; toString(): string };
  router: { replace(href: string): void };
  selectedRowId: string;
}) {
  const { pathname, searchParams, router, selectedRowId } = args;

  function updateCategory(next: ExpenseCategory) {
    const qs = cloneSearchParams(searchParams);
    setOrDeleteQueryParam(qs, "category", next, "all");
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
      { label: "新規支出", href: buildCurrentPageActionHref("create") },
      { label: "CSV取込", href: buildCurrentPageActionHref("import") },
      { label: "編集", href: buildCurrentPageActionHref("edit"), disabled: !selectedRowId },
      { label: "カテゴリ設定", href: buildCurrentPageActionHref("category-settings") },
    ],
    [pathname, searchParams, selectedRowId]
  );

  return {
    updateCategory,
    clearActionMode,
    sidebarActions,
  };
}
