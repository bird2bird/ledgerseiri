import type { DashboardHomeData, DashboardRange } from "@/components/app/dashboard-v2/types";

export async function fetchDashboardSummary(args: {
  token: string;
  storeId?: string;
  range?: DashboardRange;
  locale?: string;
}): Promise<DashboardHomeData> {
  const qs = new URLSearchParams();

  if (args.storeId) qs.set("storeId", args.storeId);
  if (args.range) qs.set("range", args.range);
  if (args.locale) qs.set("locale", args.locale);

  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  const res = await fetch(`/dashboard/summary${suffix}`, {
    headers: {
      Authorization: `Bearer ${args.token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`/dashboard/summary failed: ${res.status} ${text}`);
  }

  return (await res.json()) as DashboardHomeData;
}
