import {
  buildDrilldownHref,
  cloneSearchParams,
  setOrDeleteQueryParam,
} from "@/core/drilldown/query-contract";

type ReadonlyURLSearchParamsLike = {
  get(name: string): string | null;
  toString(): string;
};

export type TransactionsActionMode =
  | ""
  | "create"
  | "import"
  | "edit"
  | "link-store"
  | "category-settings"
  | "bulk-post"
  | "details"
  | "resync"
  | "flagged";

const ALLOWED_ACTIONS = new Set<Exclude<TransactionsActionMode, "">>([
  "create",
  "import",
  "edit",
  "link-store",
  "category-settings",
  "bulk-post",
  "details",
  "resync",
  "flagged",
]);

export function readTransactionsActionMode(
  searchParams: URLSearchParams | ReadonlyURLSearchParamsLike
): TransactionsActionMode {
  const raw = String(searchParams.get("action") ?? "").trim();
  if (!raw) return "";
  return ALLOWED_ACTIONS.has(raw as Exclude<TransactionsActionMode, "">)
    ? (raw as TransactionsActionMode)
    : "";
}

export function buildTransactionsActionHref(
  pathname: string,
  searchParams: URLSearchParams | ReadonlyURLSearchParamsLike,
  nextAction?: TransactionsActionMode | string | null
): string {
  const qs = cloneSearchParams(searchParams);
  setOrDeleteQueryParam(qs, "action", nextAction ?? null);
  return buildDrilldownHref(pathname, qs);
}

export function clearTransactionsActionHref(
  pathname: string,
  searchParams: URLSearchParams | ReadonlyURLSearchParamsLike
): string {
  const qs = cloneSearchParams(searchParams);
  qs.delete("action");
  return buildDrilldownHref(pathname, qs);
}

export const TRANSACTIONS_ACTION_MODE_AUDIT = {
  helpers: [
    "readTransactionsActionMode",
    "buildTransactionsActionHref",
    "clearTransactionsActionHref",
  ],
  allowedActions: Array.from(ALLOWED_ACTIONS.values()),
} as const;
