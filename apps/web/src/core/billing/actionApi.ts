export type BillingCheckoutResponse = {
  ok: boolean;
  action?: "checkout-session";
  targetPlan?: "starter" | "standard" | "premium";
  url?: string | null;
  message?: string;
};

export type BillingPortalResponse = {
  ok: boolean;
  action?: "portal-session";
  url?: string | null;
  message?: string;
};

export async function createBillingCheckoutSession(args: {
  targetPlan: "starter" | "standard" | "premium";
  currentPlan: "starter" | "standard" | "premium";
  locale?: string;
}): Promise<BillingCheckoutResponse> {
  const res = await fetch("/billing/checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(args),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`/billing/checkout-session failed: ${res.status} ${text}`);
  }

  return (await res.json()) as BillingCheckoutResponse;
}

export async function createBillingPortalSession(args?: {
  locale?: string;
}): Promise<BillingPortalResponse> {
  const qs = new URLSearchParams();
  if (args?.locale) qs.set("locale", args.locale);

  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  const res = await fetch(`/billing/portal-session${suffix}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`/billing/portal-session failed: ${res.status} ${text}`);
  }

  return (await res.json()) as BillingPortalResponse;
}
