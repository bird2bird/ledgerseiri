import type {
  WorkspaceContext,
  WorkspaceEntitlements,
  WorkspaceLimits,
  WorkspacePlanCode,
  WorkspaceSubscription,
  WorkspaceSubscriptionStatus,
} from "@/core/workspace/types";

function normalizePlan(plan?: string): WorkspacePlanCode {
  if (plan === "premium") return "premium";
  if (plan === "standard") return "standard";
  return "starter";
}

function resolveStatus(planCode: WorkspacePlanCode): WorkspaceSubscriptionStatus {
  if (planCode === "premium") return "trialing";
  return "active";
}

function makeEntitlements(planCode: WorkspacePlanCode): WorkspaceEntitlements {
  if (planCode === "premium") {
    return {
      invoiceManagement: true,
      aiInsights: true,
    };
  }

  if (planCode === "standard") {
    return {
      invoiceManagement: true,
      aiInsights: false,
    };
  }

  return {
    invoiceManagement: false,
    aiInsights: false,
  };
}

function makeLimits(planCode: WorkspacePlanCode): WorkspaceLimits {
  if (planCode === "premium") {
    return {
      maxStores: 10,
      historyMonths: 24,
      aiChatMonthly: 50,
      aiInvoiceOcrMonthly: 100,

      stores: 10,
      invoiceStorageMb: 1024,
      aiChatPerMonth: 50,
      aiInvoiceScanPerMonth: 100,
    };
  }

  if (planCode === "standard") {
    return {
      maxStores: 3,
      historyMonths: 24,
      aiChatMonthly: 0,
      aiInvoiceOcrMonthly: 0,

      stores: 3,
      invoiceStorageMb: 500,
      aiChatPerMonth: 0,
      aiInvoiceScanPerMonth: 0,
    };
  }

  return {
    maxStores: 1,
    historyMonths: 12,
    aiChatMonthly: 0,
    aiInvoiceOcrMonthly: 0,

    stores: 1,
    invoiceStorageMb: 100,
    aiChatPerMonth: 0,
    aiInvoiceScanPerMonth: 0,
  };
}

function makeCurrentPeriodEnd(status: WorkspaceSubscriptionStatus): string | null {
  if (status !== "trialing") return null;
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString();
}

function makeSubscription(planCode: WorkspacePlanCode): WorkspaceSubscription {
  const status = resolveStatus(planCode);

  return {
    planCode,
    status,
    entitlements: makeEntitlements(planCode),
    limits: makeLimits(planCode),
    currentPeriodEnd: makeCurrentPeriodEnd(status),
  };
}

function resolveCompanyIdBySlug(slug: string): string | null {
  if (slug === "weiwei") {
    return "cmnx527ro0000ms678wqrvyh1";
  }
  return null;
}

export async function resolveWorkspaceContext(args: {
  slug: string;
  locale: string;
  plan?: string;
}): Promise<WorkspaceContext> {
  const planCode = normalizePlan(args.plan);

  return {
    slug: args.slug,
    locale: args.locale,
    companyId: resolveCompanyIdBySlug(args.slug),
    subscription: makeSubscription(planCode),
  };
}
