export type DetailApiRange = "thisMonth" | "lastMonth" | "thisYear" | "custom";
export type DetailApiKind = "cashflow" | "income" | "expense" | "profit";

export type ReportDetailApiResponse = {
  ok: boolean;
  domain: "reports";
  action: "detail";
  filters: {
    kind: DetailApiKind;
    metric: string;
    range: DetailApiRange;
    label: string;
    start: string;
    end: string;
    storeId: string;
  };
  summary: {
    label: string;
    value: string;
  };
  columns: Array<{
    key: string;
    label: string;
    align?: "left" | "right";
  }>;
  rows: Array<{
    key: string;
    values: Record<string, string>;
  }>;
  message?: string;
};

export async function fetchReportDetail(args: {
  kind: DetailApiKind;
  metric: string;
  range: DetailApiRange;
  storeId: string;
}): Promise<ReportDetailApiResponse> {
  const qs = new URLSearchParams();
  qs.set("kind", args.kind);
  qs.set("metric", args.metric);
  qs.set("range", args.range);
  qs.set("storeId", args.storeId || "all");

  const res = await fetch(`/api/reports/detail?${qs.toString()}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`detail api error: ${res.status}`);
  }

  return res.json();
}
