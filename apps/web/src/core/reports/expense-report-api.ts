export type ExpenseReportRange = "thisMonth" | "lastMonth" | "thisYear" | "custom";

export type ExpenseReportSummary = {
  totalExpense: number;
  rowsCount: number;
  averagePerRow: number;
  activeDays: number;
};

export type ExpenseReportBreakdownItem = {
  category: string;
  amount: number;
};

export type ExpenseReportTrendItem = {
  date: string;
  amount: number;
  count: number;
};

export type ExpenseReportRecentItem = {
  id: string;
  date: string;
  type: string;
  amount: number;
  memo?: string | null;
};

export type ExpenseReportResponse = {
  ok: boolean;
  domain: "reports";
  action: "expense";
  filters: {
    range: ExpenseReportRange;
    label: string;
    start: string;
    end: string;
  };
  summary: ExpenseReportSummary;
  breakdown: ExpenseReportBreakdownItem[];
  trend: ExpenseReportTrendItem[];
  recentItems: ExpenseReportRecentItem[];
  message?: string;
};

export async function getExpenseReport(
  range: ExpenseReportRange = "thisMonth",
): Promise<ExpenseReportResponse> {
  const res = await fetch(`/api/reports/expense?range=${encodeURIComponent(range)}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `failed to load expense report: ${res.status}`);
  }

  return (await res.json()) as ExpenseReportResponse;
}
