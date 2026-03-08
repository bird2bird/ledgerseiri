import type { PlanCode } from "@/components/app/dashboard-v2/types";

export type Workspace = {
  slug: string;
  displayName: string;
  companyName: string;
  locale?: string;
};

export type WorkspaceSubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled";

export type WorkspaceEntitlements = {
  aiInsights: boolean;
  aiChat: boolean;
  invoiceOcr: boolean;
  multiStore: boolean;
  fundTransfer: boolean;
  invoiceManagement: boolean;
  advancedExport: boolean;
  skuLevelExport: boolean;
  history24m: boolean;
};

export type WorkspaceLimits = {
  maxStores: number;
  invoiceStorageMb: number;
  aiChatMonthly: number;
  aiInvoiceOcrMonthly: number;
};

export type SubscriptionSource = "mock-query" | "mock-default" | "db";

export type WorkspaceSubscription = {
  planCode: PlanCode;
  status: WorkspaceSubscriptionStatus;
  source: SubscriptionSource;
  currentPeriodEnd?: string | null;
  entitlements: WorkspaceEntitlements;
  limits: WorkspaceLimits;
};

export type WorkspaceContextValue = {
  workspace: Workspace;
  subscription: WorkspaceSubscription;
};
