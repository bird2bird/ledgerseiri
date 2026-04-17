import type { WorkspaceContextValue, WorkspaceLimits } from "@/core/workspace/types";
import { readErrorTextOrThrowSpecialCases } from "@/core/tenant-suspended";
import { fetchWithAutoRefresh } from "@/core/auth/client-auth-fetch";

export type WorkspaceUsageValue = {
  storesUsed: number;
  invoiceStorageMbUsed: number;
  aiChatUsedMonthly: number;
  aiInvoiceOcrUsedMonthly: number;
};

export type WorkspaceUsageResponse = {
  workspace: WorkspaceContextValue["workspace"];
  subscription: WorkspaceContextValue["subscription"];
  effectiveLimits: WorkspaceLimits;
  usage: WorkspaceUsageValue;
  utilization: {
    storesPct: number;
    invoiceStoragePct: number;
    aiChatPct: number;
    aiInvoiceOcrPct: number;
  };
  overLimit: {
    stores: boolean;
    invoiceStorage: boolean;
    aiChat: boolean;
    aiInvoiceOcr: boolean;
  };
  period: {
    monthKey: string;
  };
};

export async function fetchWorkspaceUsage(args: {
  token?: string;
  slug?: string;
  plan?: string;
  locale?: string;
}): Promise<WorkspaceUsageResponse> {
  const qs = new URLSearchParams();

  if (args.slug) qs.set("slug", args.slug);
  if (args.plan) qs.set("plan", args.plan);
  if (args.locale) qs.set("locale", args.locale);

  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  const headers: Record<string, string> = {};
  if (args.token) {
    headers.Authorization = `Bearer ${args.token}`;
  }

  const res = await fetchWithAutoRefresh(`/workspace/usage${suffix}`, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await readErrorTextOrThrowSpecialCases(res, "standard");
    throw new Error(`/workspace/usage failed: ${res.status} ${text}`);
  }

  return (await res.json()) as WorkspaceUsageResponse;
}
