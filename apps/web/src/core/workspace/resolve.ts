import type { PlanCode } from "@/components/app/dashboard-v2/types";
import { getPlanFeatures } from "@/core/billing/features";
import type {
  Workspace,
  WorkspaceSubscription,
  WorkspaceContextValue,
  WorkspaceEntitlements,
  WorkspaceLimits,
} from "./types";

export function normalizePlanCode(raw?: string | null): PlanCode {
  if (raw === "starter" || raw === "standard" || raw === "premium") return raw;
  return "starter";
}

export function prettifyWorkspaceName(input?: string | null): string {
  const raw = (input || "").trim();
  if (!raw) return "Weiwei";

  return raw
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildLimits(planCode: PlanCode): WorkspaceLimits {
  if (planCode === "starter") {
    return {
      maxStores: 1,
      invoiceStorageMb: 200,
      aiChatMonthly: 0,
      aiInvoiceOcrMonthly: 0,
      historyMonths: 12,
    };
  }

  if (planCode === "standard") {
    return {
      maxStores: 3,
      invoiceStorageMb: 1024,
      aiChatMonthly: 0,
      aiInvoiceOcrMonthly: 0,
      historyMonths: 24,
    };
  }

  return {
    maxStores: 10,
    invoiceStorageMb: 5120,
    aiChatMonthly: 50,
    aiInvoiceOcrMonthly: 100,
    historyMonths: 24,
  };
}

function buildEntitlements(planCode: PlanCode): WorkspaceEntitlements {
  return getPlanFeatures(planCode);
}

export function resolveWorkspaceContext(args: {
  slug?: string | null;
  plan?: string | null;
  locale?: string | null;
}): WorkspaceContextValue {
  const resolvedSlug = (args.slug || "weiwei").trim() || "weiwei";
  const displayName = prettifyWorkspaceName(resolvedSlug);
  const planCode = normalizePlanCode(args.plan);

  const workspace: Workspace = {
    slug: resolvedSlug,
    displayName,
    companyName: "LedgerSeiri Demo Company",
    locale: args.locale || "ja",
  };

  const subscription: WorkspaceSubscription = {
    planCode,
    status: "active",
    source: args.plan ? "mock-query" : "mock-default",
    currentPeriodEnd: "2026-04-30T00:00:00.000Z",
    entitlements: buildEntitlements(planCode),
    limits: buildLimits(planCode),
  };

  return {
    workspace,
    subscription,
  };
}
