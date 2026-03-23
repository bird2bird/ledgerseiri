import type { WorkspaceContextValue } from "@/core/workspace/types";
import { ensureNotTenantSuspended } from "@/core/tenant-suspended";

export async function fetchWorkspaceContext(args: {
  token?: string;
  slug?: string;
  plan?: string;
  locale?: string;
}): Promise<WorkspaceContextValue> {
  const qs = new URLSearchParams();

  if (args.slug) qs.set("slug", args.slug);
  if (args.plan) qs.set("plan", args.plan);
  if (args.locale) qs.set("locale", args.locale);

  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  const headers: Record<string, string> = {};

  if (args.token) {
    headers.Authorization = `Bearer ${args.token}`;
  }

  const res = await fetch(`/workspace/context${suffix}`, {
    headers,
    cache: "no-store",
  });

  await ensureNotTenantSuspended(res);

  return (await res.json()) as WorkspaceContextValue;
}
