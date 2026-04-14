export type WorkspacePlanCode = "starter" | "standard" | "premium";
export type WorkspaceSubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled";

export type WorkspaceEntitlements = {
  invoiceManagement: boolean;
  aiInsights: boolean;
};

export type WorkspaceLimits = {
  maxStores?: number;
  aiChatMonthly?: number;
  aiInvoiceOcrMonthly?: number;
  historyMonths?: number;

  stores?: number;
  invoiceStorageMb?: number;
  aiChatPerMonth?: number;
  aiInvoiceScanPerMonth?: number;
};

export type WorkspaceSubscription = {
  planCode: WorkspacePlanCode;
  status: WorkspaceSubscriptionStatus;
  entitlements: WorkspaceEntitlements;
  limits: WorkspaceLimits;
  currentPeriodEnd?: string | null;
};

export type WorkspaceContext = {
  slug: string;
  locale: string;
  companyId?: string | null;
  subscription: WorkspaceSubscription;
};

export type WorkspaceView = {
  slug: string;
  displayName: string;
  companyName?: string;
  locale: string;
};

export type WorkspaceSubscriptionValue = {
  planCode: WorkspacePlanCode;
  status: WorkspaceSubscriptionStatus;
  source?: string;
  limits: WorkspaceLimits;
  entitlements?: WorkspaceEntitlements;
  currentPeriodEnd?: string | null;
};

export type WorkspaceContextValue = {
  workspace: WorkspaceView;
  subscription: WorkspaceSubscriptionValue;
  limits: WorkspaceLimits;
  companyId?: string | null;
};
