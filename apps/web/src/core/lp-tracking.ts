export type LpTrackPayload = {
  path: string;
  locale?: string | null;
  eventType?: string;
  ctaName?: string | null;
};

function getOrCreateStorageKey(key: string) {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const value = `${key}_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  window.localStorage.setItem(key, value);
  return value;
}

function getUtm(name: string) {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

function isDevLikeRuntime() {
  if (typeof window === "undefined") return false;
  return (
    process.env.NODE_ENV !== "production" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

function logLpTracking(level: "info" | "warn" | "error", message: string, meta?: unknown) {
  if (typeof window === "undefined") return;

  if (level === "info" && !isDevLikeRuntime()) return;

  const prefix = "[LP tracking]";
  if (level === "error") {
    console.error(prefix, message, meta ?? "");
    return;
  }
  if (level === "warn") {
    console.warn(prefix, message, meta ?? "");
    return;
  }
  console.info(prefix, message, meta ?? "");
}

function trySendBeacon(url: string, body: Record<string, unknown>) {
  if (typeof window === "undefined") return false;
  if (typeof navigator === "undefined") return false;
  if (typeof navigator.sendBeacon !== "function") return false;

  try {
    const blob = new Blob([JSON.stringify(body)], {
      type: "application/json",
    });
    return navigator.sendBeacon(url, blob);
  } catch (error) {
    logLpTracking("warn", "sendBeacon threw error", error);
    return false;
  }
}

export async function trackLpEvent(payload: LpTrackPayload) {
  if (typeof window === "undefined") return;

  const body = {
    ...payload,
    referrer: document.referrer || null,
    visitorId: getOrCreateStorageKey("ls_lp_visitor_id"),
    sessionId: getOrCreateStorageKey("ls_lp_session_id"),
    utmSource: getUtm("utm_source"),
    utmMedium: getUtm("utm_medium"),
    utmCampaign: getUtm("utm_campaign"),
    utmTerm: getUtm("utm_term"),
    utmContent: getUtm("utm_content"),
  };

  logLpTracking("info", "trackLpEvent payload", body);

  try {
    const res = await fetch("/api/platform/lp-analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      logLpTracking("error", `trackLpEvent HTTP ${res.status}`, {
        status: res.status,
        responseText: text,
        body,
      });

      const beaconOk = trySendBeacon("/api/platform/lp-analytics/track", body);
      logLpTracking(
        beaconOk ? "warn" : "error",
        beaconOk
          ? "trackLpEvent sendBeacon fallback queued"
          : "trackLpEvent sendBeacon fallback failed",
        body,
      );
      return;
    }

    const json = await res.json().catch(() => null);
    logLpTracking("info", "trackLpEvent success", json);
  } catch (error) {
    logLpTracking("error", "trackLpEvent fetch failed", { error, body });

    const beaconOk = trySendBeacon("/api/platform/lp-analytics/track", body);
    logLpTracking(
      beaconOk ? "warn" : "error",
      beaconOk
        ? "trackLpEvent sendBeacon fallback queued"
        : "trackLpEvent sendBeacon fallback failed",
      body,
    );
  }
}

export type LpConversionPayload = {
  eventType: string;
  email?: string | null;
  userId?: string | null;
  ctaName?: string | null;
  source?: string | null;
  locale?: string | null;
  referrer?: string | null;
  path?: string | null;
};

export async function trackLpConversionEvent(payload: LpConversionPayload) {
  if (typeof window === "undefined") return;

  const body = {
    ...payload,
    visitorId: window.localStorage.getItem("ls_lp_visitor_id") || null,
    sessionId: window.localStorage.getItem("ls_lp_session_id") || null,
  };

  logLpTracking("info", "trackLpConversionEvent payload", body);

  try {
    const res = await fetch("/api/platform/lp-analytics/conversion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      logLpTracking("error", `trackLpConversionEvent HTTP ${res.status}`, {
        status: res.status,
        responseText: text,
        body,
      });

      const beaconOk = trySendBeacon("/api/platform/lp-analytics/conversion", body);
      logLpTracking(
        beaconOk ? "warn" : "error",
        beaconOk
          ? "trackLpConversionEvent sendBeacon fallback queued"
          : "trackLpConversionEvent sendBeacon fallback failed",
        body,
      );
      return;
    }

    const json = await res.json().catch(() => null);
    logLpTracking("info", "trackLpConversionEvent success", json);
  } catch (error) {
    logLpTracking("error", "trackLpConversionEvent fetch failed", {
      error,
      body,
    });

    const beaconOk = trySendBeacon("/api/platform/lp-analytics/conversion", body);
    logLpTracking(
      beaconOk ? "warn" : "error",
      beaconOk
        ? "trackLpConversionEvent sendBeacon fallback queued"
        : "trackLpConversionEvent sendBeacon fallback failed",
      body,
    );
  }
}
