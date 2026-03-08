import type { PlanCode } from "@/components/app/dashboard-v2/types";
import type { WorkspaceLimits } from "@/core/workspace/types";

export const PLAN_LIMITS: Record<PlanCode, WorkspaceLimits> = {
  starter: {
    maxStores: 1,
    invoiceStorageMb: 200,
    aiChatMonthly: 0,
    aiInvoiceOcrMonthly: 0,
    historyMonths: 12,
  },
  standard: {
    maxStores: 3,
    invoiceStorageMb: 1024,
    aiChatMonthly: 0,
    aiInvoiceOcrMonthly: 0,
    historyMonths: 24,
  },
  premium: {
    maxStores: 10,
    invoiceStorageMb: 5120,
    aiChatMonthly: 50,
    aiInvoiceOcrMonthly: 100,
    historyMonths: 24,
  },
};

export function getPlanLimits(planCode: PlanCode): WorkspaceLimits {
  return PLAN_LIMITS[planCode] ?? PLAN_LIMITS.starter;
}
