const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export type IncomeTrendItem = {
  date: string;
  amount: number;
  count: number;
};

export type IncomeBreakdownItem = {
  key: string;
  label: string;
  amount: number;
  count: number;
};

export type IncomeReportResponse = {
  ok: boolean;
  domain: string;
  action: string;
  filters: {
    range: string;
    label: string;
    start: string;
    end: string;
  };
  summary: {
    totalIncome: number;
    rowsCount: number;
    averagePerRow: number;
    activeDays: number;
  };
  trend: IncomeTrendItem[];
  breakdown: IncomeBreakdownItem[];
  message?: string;
};

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function getIncomeReport(
  range: "thisMonth" | "lastMonth" | "thisYear" | "custom" = "thisMonth"
): Promise<IncomeReportResponse> {
  const res = await fetch(`${API_BASE}/api/reports/income?range=${range}`, {
    credentials: "include",
    cache: "no-store",
  });
  return readJson<IncomeReportResponse>(res);
}
