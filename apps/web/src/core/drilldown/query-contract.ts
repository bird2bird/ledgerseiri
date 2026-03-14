export type DashboardSource = "dashboard" | "other";

export type DrilldownBaseQuery = {
  from: DashboardSource;
  storeId: string;
  range: string;
};

type ReadonlyURLSearchParamsLike = {
  get(name: string): string | null;
  toString(): string;
};

export function readBaseDrilldownQuery(
  searchParams: URLSearchParams | ReadonlyURLSearchParamsLike
): DrilldownBaseQuery {
  const from = searchParams.get("from") === "dashboard" ? "dashboard" : "other";
  const storeId = normalizeStoreIdParam(searchParams.get("storeId"));
  const range = normalizeRangeParam(searchParams.get("range"));

  return {
    from,
    storeId,
    range,
  };
}

export function isDashboardSource(from?: string | null): boolean {
  return from === "dashboard";
}

export function normalizeStoreIdParam(value?: string | null): string {
  const v = String(value ?? "").trim();
  return v ? v : "all";
}

export function normalizeRangeParam(value?: string | null): string {
  const v = String(value ?? "").trim();
  if (v === "7d" || v === "30d" || v === "90d" || v === "12m") return v;
  return "30d";
}

export function cloneSearchParams(
  searchParams: URLSearchParams | ReadonlyURLSearchParamsLike
): URLSearchParams {
  return new URLSearchParams(searchParams.toString());
}

export function setOrDeleteQueryParam(
  qs: URLSearchParams,
  key: string,
  value?: string | null,
  emptyValue?: string
): void {
  const next = String(value ?? "").trim();
  if (!next || (emptyValue !== undefined && next === emptyValue)) {
    qs.delete(key);
    return;
  }
  qs.set(key, next);
}

export function buildDrilldownHref(pathname: string, qs: URLSearchParams): string {
  const q = qs.toString();
  return q ? `${pathname}?${q}` : pathname;
}
