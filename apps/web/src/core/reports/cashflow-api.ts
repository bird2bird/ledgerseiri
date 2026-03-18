const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export type CashflowTrendItem = {
  date: string;
  cashIn: number;
  cashOut: number;
  netCash: number;
  inboundTransfers: number;
  outboundTransfers: number;
};

export type CashflowBreakdownItem = {
  key: string;
  label: string;
  amount: number;
};

export type CashflowReportResponse = {
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
    cashIn: number;
    cashOut: number;
    netCash: number;
    inboundTransfers: number;
    outboundTransfers: number;
  };
  breakdown: CashflowBreakdownItem[];
  trend: CashflowTrendItem[];
  message?: string;
};

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function getCashflowReport(
  range: "thisMonth" | "lastMonth" | "thisYear" | "custom" = "thisMonth"
): Promise<CashflowReportResponse> {
  const res = await fetch(`${API_BASE}/api/reports/cashflow?range=${range}`, {
    credentials: "include",
    cache: "no-store",
  });
  return readJson<CashflowReportResponse>(res);
}
