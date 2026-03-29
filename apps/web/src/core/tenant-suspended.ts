export class TenantSuspendedError extends Error {
  constructor() {
    super("TENANT_SUSPENDED");
    this.name = "TenantSuspendedError";
  }
}

export class PlanLimitReachedError extends Error {
  constructor(message = "PLAN_LIMIT_REACHED") {
    super(message);
    this.name = "PlanLimitReachedError";
  }
}

export function isTenantSuspendedPayload(payload: unknown): boolean {
  return !!payload && typeof payload === "object" && (payload as any).message === "TENANT_SUSPENDED";
}

export function isPlanLimitReachedPayload(payload: unknown): boolean {
  return !!payload && typeof payload === "object" && (payload as any).message === "PLAN_LIMIT_REACHED";
}

export function getTenantSuspendedPath(): string {
  if (typeof window === "undefined") return "/ja/tenant-suspended";
  const parts = window.location.pathname.split("/").filter(Boolean);
  const lang = parts[0] || "ja";
  return `/${lang}/tenant-suspended`;
}

export function getUpgradePath(target = "standard"): string {
  if (typeof window === "undefined") return `/ja/app/billing/change?target=${target}`;
  const parts = window.location.pathname.split("/").filter(Boolean);
  const lang = parts[0] || "ja";
  return `/${lang}/app/billing/change?target=${target}`;
}

export function redirectToTenantSuspended(): never {
  if (typeof window !== "undefined") {
    const next = getTenantSuspendedPath();
    if (window.location.pathname !== next) {
      window.location.href = next;
    }
  }
  throw new TenantSuspendedError();
}

export function dispatchPlanLimitReached(detail?: { message?: string; target?: string }) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("ledgerseiri:plan-limit-reached", {
      detail: {
        message:
          detail?.message ||
          "現在のプラン上限に達しました。アップグレードすると引き続き利用できます。",
        target: detail?.target || "standard",
      },
    })
  );
}

export async function parseResponsePayload(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return { statusCode: res.status, message: `Request failed: ${res.status}` };

  try {
    return JSON.parse(text);
  } catch {
    return { statusCode: res.status, message: text };
  }
}

export async function ensureNotTenantSuspended(res: Response): Promise<unknown | null> {
  if (res.ok) return null;

  const payload = await parseResponsePayload(res);

  const message =
    payload && typeof payload === "object" && typeof (payload as any).message === "string"
      ? String((payload as any).message)
      : typeof payload === "string"
      ? payload
      : `Request failed: ${res.status}`;

  if (isPlanLimitReachedPayload(payload)) {
    dispatchPlanLimitReached({ message, target: "standard" });
    throw new PlanLimitReachedError(message);
  }

  if (res.status === 403 && isTenantSuspendedPayload(payload)) {
    redirectToTenantSuspended();
  }

  throw new Error(message);
}

export async function readErrorTextOrThrowSpecialCases(
  res: Response,
  target = "standard"
): Promise<string> {
  const payload = await parseResponsePayload(res);

  if (isTenantSuspendedPayload(payload)) {
    redirectToTenantSuspended();
  }

  if (
    isPlanLimitReachedPayload(payload) ||
    (res.status === 403 &&
      !!payload &&
      typeof payload === "object" &&
      String((payload as any).message || "").trim() === "PLAN_LIMIT_REACHED")
  ) {
    const message =
      typeof payload === "object" && payload && "message" in (payload as any)
        ? String((payload as any).message || "PLAN_LIMIT_REACHED")
        : "PLAN_LIMIT_REACHED";

    dispatchPlanLimitReached({ message, target });
    throw new PlanLimitReachedError(message);
  }

  if (typeof payload === "string") return payload;

  if (payload && typeof payload === "object") {
    const msg = String((payload as any).message || "").trim();
    if (msg) return msg;
    try {
      return JSON.stringify(payload);
    } catch {
      return `Request failed: ${res.status}`;
    }
  }

  return `Request failed: ${res.status}`;
}
