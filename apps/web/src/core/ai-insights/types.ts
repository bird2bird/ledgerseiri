export type WorkspaceContextResponse = {
  workspace?: {
    slug?: string;
    displayName?: string;
    companyName?: string;
    locale?: string;
  };
  subscription?: {
    planCode?: string;
    status?: string;
    source?: string;
    entitlements?: Record<string, boolean>;
    limits?: {
      maxStores?: number;
      invoiceStorageMb?: number;
      aiChatMonthly?: number;
      aiInvoiceOcrMonthly?: number;
      historyMonths?: number;
    };
  };
};

export type UsageResponse = {
  effectiveLimits?: {
    maxStores?: number;
    invoiceStorageMb?: number;
    aiChatMonthly?: number;
    aiInvoiceOcrMonthly?: number;
    historyMonths?: number;
  };
  usage?: {
    storesUsed?: number;
    invoiceStorageMbUsed?: number;
    aiChatUsedMonthly?: number;
    aiInvoiceOcrUsedMonthly?: number;
  };
  utilization?: {
    storesPct?: number;
    invoiceStoragePct?: number;
    aiChatPct?: number;
    aiInvoiceOcrPct?: number;
  };
  overLimit?: {
    stores?: boolean;
    invoiceStorage?: boolean;
    aiChat?: boolean;
    aiInvoiceOcr?: boolean;
  };
  period?: {
    monthKey?: string;
  };
};

export type DashboardSummaryResponse = {
  summary?: {
    revenue?: number;
    expense?: number;
    profit?: number;
    cash?: number;
    estimatedTax?: number;
    unpaidAmount?: number;
    unpaidCount?: number;
    inventoryValue?: number;
    inventoryAlertCount?: number;
    runwayMonths?: number;
  };
  businessHealth?: {
    score?: number;
    status?: string;
    headline?: string;
    summary?: string;
    items?: Array<{
      label?: string;
      value?: string;
    }>;
  };
  alerts?: Array<{
    key?: string;
    level?: string;
    title?: string;
    description?: string;
  }>;
};

export type ReportSummaryResponse = {
  summary?: Record<string, number>;
};

export type AiInsightsSnapshot = {
  workspaceCtx: WorkspaceContextResponse | null;
  usage: UsageResponse | null;
  dashboard: DashboardSummaryResponse | null;
  incomeReport: ReportSummaryResponse | null;
  expenseReport: ReportSummaryResponse | null;
  profitReport: ReportSummaryResponse | null;
  cashflowReport: ReportSummaryResponse | null;
};
