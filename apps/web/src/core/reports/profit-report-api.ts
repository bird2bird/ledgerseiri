export type ProfitReportRange = "thisMonth" | "lastMonth" | "thisYear" | "custom";

export type ProfitReportResponse = {
  ok: boolean;
  domain: "reports";
  action: "profit";
  filters: {
    range: ProfitReportRange;
    label: string;
    start: string;
    end: string;
  };
  summary: {
    totalIncome: number;
    totalExpense: number;
    grossProfit: number;
    marginPct: number;
  };
  breakdown: Array<{
    type: string;
    amount: number;
  }>;
  trend: Array<{
    date: string;
    income: number;
    expense: number;
    profit: number;
  }>;
  message: string;
};

export async function getProfitReport(
  range: ProfitReportRange = "thisMonth"
): Promise<ProfitReportResponse> {
  const qs = new URLSearchParams();
  qs.set("range", range);

  const res = await fetch(`/api/reports/profit?${qs.toString()}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`profit report request failed: ${res.status}`);
  }

  return (await res.json()) as ProfitReportResponse;
}
