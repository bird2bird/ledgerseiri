export type BillingCheckoutStubResponse = {
  ok: boolean;
  mode: "stub";
  action: "checkout-session";
  targetPlan: "starter" | "standard" | "premium";
  currentPlan: "starter" | "standard" | "premium";
  redirectPath: string;
  message: string;
};

export type BillingPortalStubResponse = {
  ok: boolean;
  mode: "stub";
  action: "portal-session";
  redirectPath: string;
  message: string;
};

export async function createBillingCheckoutSession(args: {
  targetPlan: "starter" | "standard" | "premium";
  currentPlan: "starter" | "standard" | "premium";
  locale?: string;
}): Promise<BillingCheckoutStubResponse> {
  const res = await fetch("/billing/checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(args),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`/billing/checkout-session failed: ${res.status} ${text}`);
  }

  return (await res.json()) as BillingCheckoutStubResponse;
}

export async function createBillingPortalSession(args?: {
  locale?: string;
}): Promise<BillingPortalStubResponse> {
  const qs = new URLSearchParams();
  if (args?.locale) qs.set("locale", args.locale);

  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  const res = await fetch(`/billing/portal-session${suffix}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`/billing/portal-session failed: ${res.status} ${text}`);
  }

  return (await res.json()) as BillingPortalStubResponse;
}
