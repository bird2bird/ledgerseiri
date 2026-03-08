import type { PlanCode } from "@/components/app/dashboard-v2/types";
import type { FeatureMatrix } from "@/core/billing/features";

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

export type WorkspaceEntitlements = FeatureMatrix;

export type WorkspaceLimits = {
  maxStores: number;
  invoiceStorageMb: number;
  aiChatMonthly: number;
  aiInvoiceOcrMonthly: number;
  historyMonths: number;
};

export type SubscriptionSource =
  | "mock-query"
  | "mock-default"
  | "db"
  | "db+query-override";

export type WorkspaceSubscription = {
  planCode: PlanCode;
  status: WorkspaceSubscriptionStatus;
  source: SubscriptionSource;
  currentPeriodEnd?: string | null;
  entitlements?: WorkspaceEntitlements;
  limits: WorkspaceLimits;
};

export type WorkspaceContextValue = {
  workspace: Workspace;
  subscription: WorkspaceSubscription;
};
