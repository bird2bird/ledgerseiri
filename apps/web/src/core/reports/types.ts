export type ReportRange = "thisMonth" | "lastMonth" | "thisYear" | "custom";

export type ReportStoreOption = {
  value: string;
  label: string;
};

export type ReportSummaryCardTone = "default" | "profit" | "warning" | "danger" | "info";

export type ReportSummaryCardVm = {
  key: string;
  label: string;
  value: string;
  subValue?: string;
  tone?: ReportSummaryCardTone;
  detailHref?: string;
};

export type ReportBreakdownItemVm = {
  key: string;
  label: string;
  amount: string;
};

export type ReportTrendColumnVm = {
  key: string;
  label: string;
  align?: "left" | "right";
};

export type ReportTrendRowVm = {
  key: string;
  values: Record<string, string>;
};

export type ReportPageVm = {
  reportKey: "cashflow" | "income" | "expense" | "profit";
  title: string;
  description: string;
  range: ReportRange;
  storeId: string;
  stores: ReportStoreOption[];
  exportHref: string;
  summaryCards: ReportSummaryCardVm[];
  breakdownItems: ReportBreakdownItemVm[];
  trendColumns: ReportTrendColumnVm[];
  trendRows: ReportTrendRowVm[];
  loading: boolean;
  error: string;
};
