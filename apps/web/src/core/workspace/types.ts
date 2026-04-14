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
  /**
   * 旧字段：现有页面仍在使用
   */
  maxStores?: number;
  aiChatMonthly?: number;
  aiInvoiceOcrMonthly?: number;
  historyMonths?: number;

  /**
   * 新字段：给 dashboard-v3 / 后续模型使用
   */
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

/**
 * Step104-N server-side workspace context
 */
export type WorkspaceContext = {
  slug: string;
  locale: string;
  companyId?: string | null;
  subscription: WorkspaceSubscription;
};

/**
 * 旧前端页面仍在使用的 workspace view
 */
export type WorkspaceView = {
  slug: string;
  displayName: string;
  companyName?: string;
  locale: string;
};

/**
 * 旧前端页面仍在使用的 subscription view
 */
export type WorkspaceSubscriptionValue = {
  planCode: WorkspacePlanCode;
  status: WorkspaceSubscriptionStatus;
  source?: string;
  limits: WorkspaceLimits;
  entitlements?: WorkspaceEntitlements;
  currentPeriodEnd?: string | null;
};

/**
 * billing/change 等页面仍在依赖的旧上下文类型
 */
export type WorkspaceContextValue = {
  workspace: WorkspaceView;
  subscription: WorkspaceSubscriptionValue;
  limits: WorkspaceLimits;
  companyId?: string | null;
};
