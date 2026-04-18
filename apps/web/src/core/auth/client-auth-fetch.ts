let inMemoryAccessToken = "";
let refreshInFlight: Promise<string | null> | null = null;
let authExpired = false;

function cloneHeaders(init?: RequestInit): Headers {
  return new Headers(init?.headers || {});
}

function isProtectedPath(url: string): boolean {
  return url.startsWith("/api/") || url.startsWith("/workspace/");
}

function isRefreshPath(url: string): boolean {
  return url === "/api/auth/refresh" || url.startsWith("/api/auth/refresh?");
}

async function requestNewAccessToken(): Promise<string | null> {
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      "X-Requested-With": "fetch",
    },
  });

  if (!res.ok) {
    inMemoryAccessToken = "";
    authExpired = true;
    return null;
  }

  const payload = (await res.json().catch(() => null)) as
    | { accessToken?: string }
    | null;

  const token = String(payload?.accessToken || "").trim();
  if (!token) {
    inMemoryAccessToken = "";
    authExpired = true;
    return null;
  }

  authExpired = false;
  inMemoryAccessToken = token;
  return token;
}

async function ensureAccessToken(): Promise<string | null> {
  if (authExpired) {
    return null;
  }

  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = requestNewAccessToken().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

export function clearClientAccessToken() {
  inMemoryAccessToken = "";
  authExpired = false;
}

export async function fetchWithAutoRefresh(
  input: string,
  init?: RequestInit
): Promise<Response> {
  const firstHeaders = cloneHeaders(init);

  if (isProtectedPath(input) && !isRefreshPath(input) && inMemoryAccessToken) {
    firstHeaders.set("Authorization", `Bearer ${inMemoryAccessToken}`);
  }

  const firstRes = await fetch(input, {
    ...init,
    headers: firstHeaders,
    credentials: "include",
    cache: init?.cache ?? "no-store",
  });

  if (firstRes.status !== 401 || !isProtectedPath(input) || isRefreshPath(input)) {
    return firstRes;
  }

  if (authExpired) {
    return firstRes;
  }

  const refreshedToken = await ensureAccessToken();
  if (!refreshedToken) {
    return firstRes;
  }

  const retryHeaders = cloneHeaders(init);
  retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);

  const retryRes = await fetch(input, {
    ...init,
    headers: retryHeaders,
    credentials: "include",
    cache: init?.cache ?? "no-store",
  });

  if (retryRes.status === 401) {
    authExpired = true;
    inMemoryAccessToken = "";
  }

  return retryRes;
}
