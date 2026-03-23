export class TenantSuspendedError extends Error {
  constructor() {
    super("TENANT_SUSPENDED");
    this.name = "TenantSuspendedError";
  }
}

export function isTenantSuspendedPayload(payload: unknown): boolean {
  return !!payload && typeof payload === "object" && (payload as any).message === "TENANT_SUSPENDED";
}

export function getTenantSuspendedPath(): string {
  if (typeof window === "undefined") return "/ja/tenant-suspended";
  const parts = window.location.pathname.split("/").filter(Boolean);
  const lang = parts[0] || "ja";
  return `/${lang}/tenant-suspended`;
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

  if (res.status === 403 && isTenantSuspendedPayload(payload)) {
    redirectToTenantSuspended();
  }

  const message =
    payload && typeof payload === "object" && typeof (payload as any).message === "string"
      ? String((payload as any).message)
      : typeof payload === "string"
      ? payload
      : `Request failed: ${res.status}`;

  throw new Error(message);
}
