let inMemoryAccessToken = "";
let refreshInFlight: Promise<string | null> | null = null;

function cloneHeaders(init?: RequestInit): Headers {
  return new Headers(init?.headers || {});
}

function isApiPath(url: string): boolean {
  return url.startsWith("/api/");
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
    return null;
  }

  const payload = (await res.json().catch(() => null)) as
    | { accessToken?: string }
    | null;

  const token = String(payload?.accessToken || "").trim();
  if (!token) {
    inMemoryAccessToken = "";
    return null;
  }

  inMemoryAccessToken = token;
  return token;
}

async function ensureAccessToken(): Promise<string | null> {
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
}

export async function fetchWithAutoRefresh(
  input: string,
  init?: RequestInit
): Promise<Response> {
  const firstHeaders = cloneHeaders(init);

  if (isApiPath(input) && !isRefreshPath(input) && inMemoryAccessToken) {
    firstHeaders.set("Authorization", `Bearer ${inMemoryAccessToken}`);
  }

  const firstRes = await fetch(input, {
    ...init,
    headers: firstHeaders,
    credentials: "include",
    cache: init?.cache ?? "no-store",
  });

  if (firstRes.status !== 401 || !isApiPath(input) || isRefreshPath(input)) {
    return firstRes;
  }

  const refreshedToken = await ensureAccessToken();
  if (!refreshedToken) {
    return firstRes;
  }

  const retryHeaders = cloneHeaders(init);
  retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);

  return fetch(input, {
    ...init,
    headers: retryHeaders,
    credentials: "include",
    cache: init?.cache ?? "no-store",
  });
}
