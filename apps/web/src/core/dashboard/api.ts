export type DashboardRange = "thisMonth" | "lastMonth" | "thisYear" | "custom";

export type DashboardSummaryResponse = {
  ok: boolean;
  revenue: number;
  expense: number;
  profit: number;
  cash: number;
  message?: string;
};

export async function fetchDashboardSummary(args?: {
  storeId?: string;
  range?: DashboardRange;
  locale?: string;
}): Promise<DashboardSummaryResponse> {
  const qs = new URLSearchParams();

  if (args?.storeId) qs.set("storeId", args.storeId);
  if (args?.range) qs.set("range", args.range);
  if (args?.locale) qs.set("locale", args.locale);

  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  const res = await fetch(`/dashboard/summary${suffix}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`/dashboard/summary failed: ${res.status} ${text}`);
  }

  return (await res.json()) as DashboardSummaryResponse;
}
